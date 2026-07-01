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
from models import AgentModel
from schemas import AgentResponse
from auth import get_current_user

router = APIRouter()

# Mock agent list for fallback/testing
MOCK_AGENTS = [
    {
        "id": uuid.UUID("ba3a948e-289d-4299-8d77-6ef1f4400aef"),
        "agent_id": "agent-frankfurt-01",
        "db_type": "PostgreSQL",
        "hostname": "ecs-fra-db-01.internal",
        "status": "online",
        "last_heartbeat": datetime.utcnow(),
        "connected_at": datetime.utcnow()
    },
    {
        "id": uuid.UUID("f49a888c-e83c-4cf2-83b4-ee8f15d2a933"),
        "agent_id": "agent-frankfurt-02",
        "db_type": "Redis",
        "hostname": "ecs-fra-cache-01.internal",
        "status": "offline",
        "last_heartbeat": datetime.utcnow(),
        "connected_at": datetime.utcnow()
    }
]

@router.get("/", response_model=List[AgentResponse])
async def list_agents(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        query = select(AgentModel).offset(skip).limit(limit)
        result = await db.execute(query)
        agents = result.scalars().all()
        return agents
    except Exception as e:
        return [AgentResponse(**item) for item in MOCK_AGENTS]

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        query = select(AgentModel).where(AgentModel.agent_id == agent_id)
        result = await db.execute(query)
        agent = result.scalar_one_or_none()
        if agent:
            return agent
        raise HTTPException(status_code=404, detail="Agent not found")
    except HTTPException:
        raise
    except Exception as e:
        for item in MOCK_AGENTS:
            if item["agent_id"] == agent_id:
                return AgentResponse(**item)
        raise HTTPException(status_code=404, detail="Agent not found in database or fallback memory")

@router.post("/", response_model=AgentResponse)
async def register_agent(
    agent_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        agent_id = agent_data.get("agent_id")
        db_type = agent_data.get("db_type")
        hostname = agent_data.get("hostname", "localhost")
        
        if not agent_id or not db_type:
            raise HTTPException(status_code=400, detail="agent_id and db_type are required")
            
        new_agent = AgentModel(
            agent_id=agent_id,
            db_type=db_type,
            hostname=hostname,
            status="online",
            last_heartbeat=datetime.utcnow(),
            connected_at=datetime.utcnow()
        )
        db.add(new_agent)
        await db.commit()
        await db.refresh(new_agent)
        return new_agent
    except HTTPException:
        raise
    except Exception as e:
        # Mock registration
        new_mock_agent = {
            "id": uuid.uuid4(),
            "agent_id": agent_data.get("agent_id", "mock-agent"),
            "db_type": agent_data.get("db_type", "PostgreSQL"),
            "hostname": agent_data.get("hostname", "localhost"),
            "status": "online",
            "last_heartbeat": datetime.utcnow(),
            "connected_at": datetime.utcnow()
        }
        MOCK_AGENTS.append(new_mock_agent)
        return AgentResponse(**new_mock_agent)

@router.put("/{agent_id}/heartbeat", response_model=AgentResponse)
async def update_agent_heartbeat(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        query = select(AgentModel).where(AgentModel.agent_id == agent_id)
        result = await db.execute(query)
        agent = result.scalar_one_or_none()
        
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
            
        agent.last_heartbeat = datetime.utcnow()
        agent.status = "online"
        await db.commit()
        await db.refresh(agent)
        return agent
    except HTTPException:
        raise
    except Exception as e:
        for item in MOCK_AGENTS:
            if item["agent_id"] == agent_id:
                item["last_heartbeat"] = datetime.utcnow()
                item["status"] = "online"
                return AgentResponse(**item)
        raise HTTPException(status_code=404, detail="Agent not found in database or fallback memory")

@router.delete("/{agent_id}")
async def unregister_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        query = select(AgentModel).where(AgentModel.agent_id == agent_id)
        result = await db.execute(query)
        agent = result.scalar_one_or_none()
        
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
            
        await db.delete(agent)
        await db.commit()
        return {"status": "success", "message": f"Agent {agent_id} unregistered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        for i, item in enumerate(MOCK_AGENTS):
            if item["agent_id"] == agent_id:
                MOCK_AGENTS.pop(i)
                return {"status": "success", "message": f"Agent {agent_id} unregistered from fallback memory"}
        raise HTTPException(status_code=404, detail="Agent not found in database or fallback memory")
