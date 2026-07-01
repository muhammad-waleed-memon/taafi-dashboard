# Copyright 2026 Muhammad Waleed
# Licensed under the Apache License, Version 2.0
# Author: Muhammad Waleed

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List
import uuid
from datetime import datetime

from db import get_db
from models import ApprovalModel, FixModel
from schemas import ApprovalResponse
from auth import get_current_user

router = APIRouter()

# Mock fallback data for demonstration/resilience if database query fails
MOCK_APPROVALS = [
    {
        "id": uuid.UUID("11111111-2222-3333-4444-555555555555"),
        "incident_id": uuid.UUID("a7b2bc38-348b-4b1f-aa34-118822334455"),
        "fix_id": uuid.UUID("99999999-8888-7777-6666-555555555555"),
        "risk_score": 0.85,
        "status": "pending",
        "requester": "qwen-llm-engine",
        "reviewer": None,
        "created_at": datetime.utcnow(),
        "reviewed_at": None
    }
]

@router.get("/", response_model=List[ApprovalResponse])
async def list_pending_approvals(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        query = select(ApprovalModel).where(ApprovalModel.status == "pending").offset(skip).limit(limit)
        result = await db.execute(query)
        approvals = result.scalars().all()
        return approvals
    except Exception as e:
        # Fallback to mock data on database connection or schema errors during hackathon demo
        return [ApprovalResponse(**item) for item in MOCK_APPROVALS]

@router.get("/history", response_model=List[ApprovalResponse])
async def list_approval_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        query = select(ApprovalModel).where(ApprovalModel.status != "pending").offset(skip).limit(limit)
        result = await db.execute(query)
        approvals = result.scalars().all()
        return approvals
    except Exception as e:
        return []

@router.post("/{approval_id}/approve", response_model=ApprovalResponse)
async def approve_fix(
    approval_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Fetch approval record
        query = select(ApprovalModel).where(ApprovalModel.id == approval_id)
        result = await db.execute(query)
        approval = result.scalar_one_or_none()
        
        if not approval:
            raise HTTPException(status_code=404, detail="Approval request not found")
        
        # Update approval
        approval.status = "approved"
        approval.reviewer = current_user.get("username", "admin")
        approval.reviewed_at = datetime.utcnow()
        
        # Update corresponding Fix
        fix_query = select(FixModel).where(FixModel.id == approval.fix_id)
        fix_result = await db.execute(fix_query)
        fix = fix_result.scalar_one_or_none()
        if fix:
            fix.approved = True
            
        await db.commit()
        await db.refresh(approval)
        return approval
    except HTTPException:
        raise
    except Exception as e:
        # Mock behavior if database is not active
        for item in MOCK_APPROVALS:
            if item["id"] == approval_id:
                item["status"] = "approved"
                item["reviewer"] = current_user.get("username", "admin")
                item["reviewed_at"] = datetime.utcnow()
                return ApprovalResponse(**item)
        raise HTTPException(status_code=404, detail="Approval request not found in database or fallback memory")

@router.post("/{approval_id}/reject", response_model=ApprovalResponse)
async def reject_fix(
    approval_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Fetch approval record
        query = select(ApprovalModel).where(ApprovalModel.id == approval_id)
        result = await db.execute(query)
        approval = result.scalar_one_or_none()
        
        if not approval:
            raise HTTPException(status_code=404, detail="Approval request not found")
        
        # Update approval
        approval.status = "rejected"
        approval.reviewer = current_user.get("username", "admin")
        approval.reviewed_at = datetime.utcnow()
        
        # Update corresponding Fix
        fix_query = select(FixModel).where(FixModel.id == approval.fix_id)
        fix_result = await db.execute(fix_query)
        fix = fix_result.scalar_one_or_none()
        if fix:
            fix.approved = False
            
        await db.commit()
        await db.refresh(approval)
        return approval
    except HTTPException:
        raise
    except Exception as e:
        # Mock behavior if database is not active
        for item in MOCK_APPROVALS:
            if item["id"] == approval_id:
                item["status"] = "rejected"
                item["reviewer"] = current_user.get("username", "admin")
                item["reviewed_at"] = datetime.utcnow()
                return ApprovalResponse(**item)
        raise HTTPException(status_code=404, detail="Approval request not found in database or fallback memory")
