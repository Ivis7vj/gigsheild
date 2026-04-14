from fastapi import APIRouter, Depends
from models import WorkerProfile
from deps import get_current_worker

router = APIRouter()

@router.get("/profile", response_model=WorkerProfile)
async def get_profile(worker: dict = Depends(get_current_worker)):
    # worker dict has _id so remove before returning
    worker.pop("_id", None)
    return worker
