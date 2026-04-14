from fastapi import APIRouter, Depends
from models import WorkerProfile
from deps import get_current_worker
from database import workers_collection

router = APIRouter()

@router.get("/profile", response_model=WorkerProfile)
async def get_profile(worker: dict = Depends(get_current_worker)):
    # worker dict has _id so remove before returning
    if not worker.get("pincode"):
        # Backfill legacy worker records created before pincode was introduced.
        worker["pincode"] = "000000"
        await workers_collection.update_one(
            {"worker_id": worker["worker_id"]},
            {"$set": {"pincode": worker["pincode"]}}
        )
    worker.pop("_id", None)
    return worker
