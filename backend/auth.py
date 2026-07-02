# Copyright 2026 Muhammad Waleed
# Licensed under the Apache License, Version 2.0
# Author: Muhammad Waleed

#
# auth.py — OIDC / JWKS-based authentication module
#
# Replaces the previous username/password + HS256 JWT approach.
# Now validates Bearer tokens issued by an external OIDC provider
# (e.g. Keycloak, Auth0, Azure AD) using RS256 / ES256 with cached JWKS.
#
# Environment variables required:
#   OIDC_ISSUER       — e.g. https://keycloak.example.com/realms/taafi
#   OIDC_CLIENT_ID    — the registered client/audience
#   OIDC_ALGORITHMS   — comma-separated, default "RS256,ES256"
#
# Security properties:
#   - HS256 is explicitly rejected (symmetric secret cannot be distributed safely)
#   - JWKS is fetched once at startup and refreshed every 15 minutes
#   - Tokens without an 'exp' claim are rejected
#   - Audience is strictly enforced
#   - Role claim is read from 'roles' or 'realm_access.roles' (Keycloak-style)

import os
import time
import logging
import asyncio
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from jose.exceptions import JWKError
from pydantic import BaseModel

logger = logging.getLogger("taafi.auth")

# ── Configuration ──────────────────────────────────────────────────────────────
OIDC_ISSUER: str = os.environ["OIDC_ISSUER"]          # Required — no default
OIDC_CLIENT_ID: str = os.environ["OIDC_CLIENT_ID"]    # Required — no default
OIDC_ALGORITHMS: List[str] = [
    alg.strip()
    for alg in os.getenv("OIDC_ALGORITHMS", "RS256,ES256").split(",")
]

# Reject symmetric algorithms unconditionally
_FORBIDDEN_ALGORITHMS = {"HS256", "HS384", "HS512", "none"}
for _alg in _FORBIDDEN_ALGORITHMS:
    if _alg in OIDC_ALGORITHMS:
        raise RuntimeError(
            f"OIDC_ALGORITHMS must not include symmetric algorithm '{_alg}'. "
            "Only asymmetric algorithms (RS256, ES256) are permitted."
        )

JWKS_REFRESH_INTERVAL_SECONDS = 900  # 15 minutes

# ── JWKS Cache ─────────────────────────────────────────────────────────────────
_jwks_cache: Optional[dict] = None
_jwks_fetched_at: float = 0.0
_jwks_lock = asyncio.Lock()

async def _get_jwks() -> dict:
    """Fetch JWKS from the OIDC provider's well-known endpoint with caching."""
    global _jwks_cache, _jwks_fetched_at

    now = time.monotonic()
    if _jwks_cache and (now - _jwks_fetched_at) < JWKS_REFRESH_INTERVAL_SECONDS:
        return _jwks_cache

    async with _jwks_lock:
        # Double-check after acquiring lock
        now = time.monotonic()
        if _jwks_cache and (now - _jwks_fetched_at) < JWKS_REFRESH_INTERVAL_SECONDS:
            return _jwks_cache

        # Discover JWKS endpoint via OpenID configuration
        discovery_url = f"{OIDC_ISSUER.rstrip('/')}/.well-known/openid-configuration"
        logger.info("Fetching OIDC discovery document from %s", discovery_url)

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                discovery = (await client.get(discovery_url)).json()
                jwks_uri = discovery["jwks_uri"]
                jwks = (await client.get(jwks_uri)).json()
                _jwks_cache = jwks
                _jwks_fetched_at = time.monotonic()
                logger.info("JWKS refreshed: %d key(s) loaded", len(jwks.get("keys", [])))
                return jwks
            except Exception as exc:
                logger.error("Failed to fetch JWKS: %s", exc)
                # If we already have a stale cache, use it rather than failing cold
                if _jwks_cache:
                    logger.warning("Using stale JWKS cache.")
                    return _jwks_cache
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Authentication service unavailable: cannot reach OIDC provider",
                )

# ── Token Models ───────────────────────────────────────────────────────────────
class UserInfo(BaseModel):
    sub: str
    email: Optional[str] = None
    name: Optional[str] = None
    roles: List[str] = []
    raw_claims: dict = {}

# ── Bearer Scheme ──────────────────────────────────────────────────────────────
_http_bearer = HTTPBearer(auto_error=True)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_http_bearer),
) -> UserInfo:
    """
    FastAPI dependency: validates the Bearer token against the OIDC JWKS.
    Returns a `UserInfo` object or raises HTTP 401.
    """
    token = credentials.credentials

    # Peek at the header without verifying to detect forbidden algorithms
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token header: {exc}",
        )

    alg = unverified_header.get("alg", "")
    if alg in _FORBIDDEN_ALGORITHMS:
        logger.warning("Rejected token using forbidden algorithm: %s", alg)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Algorithm '{alg}' is not permitted",
        )

    if alg not in OIDC_ALGORITHMS:
        logger.warning("Rejected token using unexpected algorithm: %s", alg)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Algorithm '{alg}' is not in the allowed list",
        )

    jwks = await _get_jwks()

    try:
        claims = jwt.decode(
            token,
            jwks,
            algorithms=OIDC_ALGORITHMS,
            audience=OIDC_CLIENT_ID,
            issuer=OIDC_ISSUER,
            options={"require_exp": True},
        )
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except (JWTError, JWKError) as exc:
        logger.warning("Token validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate token",
        )

    # Extract roles — support both flat list and Keycloak's nested realm_access
    roles: List[str] = claims.get("roles", [])
    if not roles:
        realm_access = claims.get("realm_access", {})
        roles = realm_access.get("roles", [])

    return UserInfo(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
        roles=roles,
        raw_claims=claims,
    )

# ── Role Enforcement ───────────────────────────────────────────────────────────
def require_role(*required_roles: str):
    """
    FastAPI dependency factory: raises HTTP 403 if the user lacks ANY of the
    required roles.

    Usage:
        @router.post("/approve", dependencies=[Depends(require_role("SRE_Admin", "Approver"))])
    """
    async def _check(user: UserInfo = Depends(get_current_user)) -> UserInfo:
        for role in required_roles:
            if role not in user.roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{role}' required",
                )
        return user
    return _check

# ── Router (no login endpoint — identity is delegated to OIDC provider) ────────
router = APIRouter()

@router.get("/api/auth/me")
async def get_me(user: UserInfo = Depends(get_current_user)):
    """Return the current user's profile extracted from the OIDC token."""
    return {
        "sub": user.sub,
        "email": user.email,
        "name": user.name,
        "roles": user.roles,
    }
