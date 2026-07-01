# Copyright 2026 Muhammad Waleed
# Licensed under the Apache License, Version 2.0
# Author: Muhammad Waleed

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime
import uuid

class LoginRequest(BaseModel):
    username: str = Field(..., max_length=50)
    password: str = Field(..., max_length=100)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class IncidentCreate(BaseModel):
    incident_type: str = Field(..., max_length=50)
    severity: str = Field(..., max_length=20)
    description: str = Field(..., max_length=2000)
    affected_tables: List[str]
    query: Optional[str] = Field(None, max_length=5000)
    agent_id: str = Field(..., max_length=50)

class IncidentResponse(BaseModel):
    id: uuid.UUID
    incident_type: str
    severity: str
    description: str
    affected_tables: Optional[str]
    query: Optional[str]
    agent_id: str
    resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True

class FixCreate(BaseModel):
    incident_id: uuid.UUID
    fix_type: str = Field(..., max_length=50)
    description: str = Field(..., max_length=2000)
    sql: Optional[str] = Field(None, max_length=5000)
    command: Optional[str] = Field(None, max_length=5000)
    risk_score: float = Field(0.0, ge=0.0, le=1.0)
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    rollback_plan: Optional[str] = Field(None, max_length=5000)

class FixResponse(BaseModel):
    id: uuid.UUID
    incident_id: uuid.UUID
    fix_type: str
    description: str
    sql: Optional[str]
    command: Optional[str]
    risk_score: float
    confidence: float
    rollback_plan: Optional[str]
    approved: bool
    applied: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AgentResponse(BaseModel):
    id: uuid.UUID
    agent_id: str
    db_type: str
    hostname: str
    status: str
    last_heartbeat: datetime
    connected_at: datetime

    class Config:
        from_attributes = True

class BillingResponse(BaseModel):
    daily_spend: float
    daily_budget: float
    total_spend: float
    calls_today: int

class ApprovalResponse(BaseModel):
    id: uuid.UUID
    incident_id: uuid.UUID
    fix_id: uuid.UUID
    risk_score: float
    status: str
    requester: Optional[str] = None
    reviewer: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

