# Copyright 2026 Muhammad Waleed
# Licensed under the Apache License, Version 2.0
# Author: Muhammad Waleed
#
# main.py — FastAPI application entry point (security-hardened)
#
# Security properties:
#   - CORS restricted to DASHBOARD_ORIGIN env var only (no wildcard)
#   - All API routes (except /api/health and /api/auth/*) require OIDC token
#   - Rate limiting via SlowAPI applied globally
#   - No sensitive data in startup logs
#   - HS256 tokens are rejected at the auth layer

import os
import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from rate_limiter import limiter
from auth import get_current_user

import auth
import incident_api
import approval_api
import agent_api
import metrics_api
import billing_api

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("taafi.main")

# ── CORS configuration ──────────────────────────────────────────────────────────
# Read from environment — no default wildcard allowed in production
_dashboard_origin = os.environ.get("DASHBOARD_ORIGIN", "https://localhost")

# Ensure the origin is not a wildcard
if _dashboard_origin.strip() == "*":
    raise RuntimeError(
        "DASHBOARD_ORIGIN must not be '*'. Set an explicit origin in production."
    )

logger.info("CORS allowed origin: %s", _dashboard_origin)

# ── App creation ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="TAAFI AI Dashboard API",
    version="0.1.0",
    # Disable default /docs and /redoc in production to reduce attack surface
    docs_url=None if os.getenv("TAAFI_ENV") == "production" else "/docs",
    redoc_url=None if os.getenv("TAAFI_ENV") == "production" else "/redoc",
)

# ── Rate limiter ────────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS middleware — strict allowlist ──────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_dashboard_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT"],   # No DELETE, no PATCH by default
    allow_headers=["Authorization", "Content-Type"],
)

# ── Unauthenticated routes ──────────────────────────────────────────────────────
# /api/health  — liveness probe (no token required)
# /api/auth/*  — OIDC token info endpoint

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# ── Authenticated routes (OIDC token required) ──────────────────────────────────
# All routers below receive `dependencies=[Depends(get_current_user)]`
# which enforces OIDC token validation on every request.

app.include_router(
    incident_api.router,
    prefix="/api/incidents",
    tags=["incidents"],
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    approval_api.router,
    prefix="/api/approvals",
    tags=["approvals"],
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    agent_api.router,
    prefix="/api/agents",
    tags=["agents"],
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    metrics_api.router,
    prefix="/api/metrics",
    tags=["metrics"],
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    billing_api.router,
    prefix="/api/billing",
    tags=["billing"],
    dependencies=[Depends(get_current_user)],
)

# ── Health check — no auth ──────────────────────────────────────────────────────
@app.get("/api/health", include_in_schema=False)
async def health_check():
    return {"status": "ok", "service": "TAAFI AI Dashboard Backend"}
