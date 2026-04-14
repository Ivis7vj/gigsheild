from fastapi import APIRouter, Depends, HTTPException
from deps import get_current_worker
from models import MissedDisruptionReport, Claim
from database import claims_collection
from typing import List

router = APIRouter()

@router.get("/my-claims", response_model=List[Claim])
async def my_claims(worker: dict = Depends(get_current_worker)):
    cursor = claims_collection.find({"worker_id": worker["worker_id"]}).sort("triggered_at", -1)
    claims = await cursor.to_list(length=100)
    for c in claims:
        c.pop("_id", None)
    return claims

@router.post("/report-missed")
async def report_missed_disruption(report: MissedDisruptionReport, worker: dict = Depends(get_current_worker)):
    # Mock storing the missed disruption
    return {"status": "success", "message": "Missed disruption reported to admin for review."}
