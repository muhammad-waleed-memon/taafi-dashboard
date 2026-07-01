# Copyright 2026 Muhammad Waleed
# Licensed under the Apache License, Version 2.0
# Author: Muhammad Waleed

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from rate_limiter import limiter

import auth
import incident_api
import approval_api
import agent_api
import metrics_api
import billing_api

app = FastAPI(title="TAAFI AI Dashboard API", version="0.1.0")

# Setup CORS middleware
origins = [
    "http://localhost",
    "http://localhost:80",
    "http://localhost:8080",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(incident_api.router, prefix="/api/incidents", tags=["incidents"])
app.include_router(approval_api.router, prefix="/api/approvals", tags=["approvals"])
app.include_router(agent_api.router, prefix="/api/agents", tags=["agents"])
app.include_router(metrics_api.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(billing_api.router, prefix="/api/billing", tags=["billing"])

@app.get("/api/health")
async def health_check():
    return { "status": "ok", "message": "TAAFI AI Dashboard Backend is operational" }
