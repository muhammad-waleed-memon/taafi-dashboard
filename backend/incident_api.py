# Copyright 2026 Muhammad Waleed
# Licensed under the Apache License, Version 2.0
# Author: Muhammad Waleed

from fastapi import APIRouter, Depends, Query
from typing import List
from schemas import IncidentResponse
from auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter()

# Mock incident DB for quick hackathon deployment
MOCK_INCIDENTS = [
    {
        "id": uuid.UUID("a7b2bc38-348b-4b1f-aa34-118822334455"),
        "incident_type": "Deadlock",
        "severity": "Critical",
        "description": "Lock contention cycle found between transaction pg_pid 1802 and pg_pid 2045 on financial_transactions",
        "affected_tables": "financial_transactions,accounts",
        "query": "UPDATE financial_transactions SET status = 'processed' WHERE tx_id = 90812;",
        "agent_id": "agent-frankfurt-01",
        "resolved": False,
        "created_at": datetime.utcnow()
    },
    {
        "id": uuid.UUID("3cb4d210-449e-4ff6-993d-d1ef3381a99f"),
        "incident_type": "SlowQuery",
        "severity": "High",
        "description": "Sequential table scan query running for 12.4 seconds on audit_logs",
        "affected_tables": "audit_logs",
        "query": "SELECT * FROM audit_logs WHERE user_id = 89012 ORDER BY timestamp DESC LIMIT 100;",
        "agent_id": "agent-frankfurt-01",
        "resolved": True,
        "created_at": datetime.utcnow()
    }
]

@router.get("/", response_model=List[IncidentResponse])
async def list_incidents(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    severity: str = None,
    current_user: dict = Depends(get_current_user)
):
    filtered = MOCK_INCIDENTS
    if severity:
        filtered = [i for i in filtered if i["severity"] == severity]
    
    start = (page - 1) * limit
    end = start + limit
    return filtered[start:end]

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: uuid.UUID, current_user: dict = Depends(get_current_user)):
    for inc in MOCK_INCIDENTS:
        if inc["id"] == incident_id:
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")
