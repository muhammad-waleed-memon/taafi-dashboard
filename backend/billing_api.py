# Copyright 2026 Muhammad Waleed
# Licensed under the Apache License, Version 2.0
# Author: Muhammad Waleed

from fastapi import APIRouter, Depends
import os
from datetime import datetime, timedelta
from schemas import BillingResponse
from auth import get_current_user

router = APIRouter()

# Global in-memory counter to make demo billing updates reactive
CALLS_TODAY = 142
BASE_SPEND = 0.426 # 142 * 0.003

@router.get("/", response_model=BillingResponse)
async def get_billing_summary(current_user: dict = Depends(get_current_user)):
    global CALLS_TODAY, BASE_SPEND
    
    # Increment slightly on queries to simulate real-time API call tracking in dashboard
    CALLS_TODAY += 1
    BASE_SPEND = round(CALLS_TODAY * 0.003, 4)
    
    daily_budget = float(os.getenv("TAAFI_DAILY_BUDGET", "5.0"))
    total_spend = round(BASE_SPEND + 23.45, 4) # Cumulative past spend + today
    
    return BillingResponse(
        daily_spend=BASE_SPEND,
        daily_budget=daily_budget,
        total_spend=total_spend,
        calls_today=CALLS_TODAY
    )

@router.get("/history")
async def get_billing_history(current_user: dict = Depends(get_current_user)):
    history = []
    base_date = datetime.utcnow()
    
    # Consistently seed history for the past 7 days
    costs = [0.38, 0.45, 0.29, 0.52, 0.61, 0.33, 0.42]
    calls = [126, 150, 96, 173, 203, 110, 140]
    
    for i in range(7):
        date_str = (base_date - timedelta(days=7 - i)).strftime("%Y-%m-%d")
        history.append({
            "date": date_str,
            "spend_usd": costs[i],
            "calls_count": calls[i]
        })
        
    return history
