from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from models import Policy, PremiumHistory
from deps import get_current_worker
from database import policies_collection, premium_history_collection
from services.pricing_engine import calculate_premium
from typing import List

router = APIRouter()

@router.get("/current", response_model=Policy)
async def get_current_policy(worker: dict = Depends(get_current_worker)):
    policy = await policies_collection.find_one({"worker_id": worker["worker_id"]})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    policy.pop("_id", None)
    return policy

@router.post("/toggle")
async def toggle_policy(worker: dict = Depends(get_current_worker)):
    policy = await policies_collection.find_one({"worker_id": worker["worker_id"]})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    new_status = "Active" if policy["status"] == "Inactive" else "Inactive"
    update_data = {"status": new_status}
    
    if new_status == "Active":
        now = datetime.utcnow()
        update_data["week_start"] = now
        update_data["week_end"] = now + timedelta(days=7)
        
    await policies_collection.update_one(
        {"worker_id": worker["worker_id"]},
        {"$set": update_data}
    )
    return {"status": new_status}

@router.get("/history", response_model=List[Policy]) # keeping simple, returning policies instead of creating full schema
async def get_policy_history(worker: dict = Depends(get_current_worker)):
    cursor = policies_collection.find({"worker_id": worker["worker_id"]})
    history = await cursor.to_list(length=100)
    for p in history:
        p.pop("_id", None)
    return history

@router.get("/calculate-premium")
async def on_demand_calculate_premium(worker: dict = Depends(get_current_worker)):
    premium_data = await calculate_premium(worker)
    return premium_data
