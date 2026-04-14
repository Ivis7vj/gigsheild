from fastapi import APIRouter
from services.trigger_engine import check_triggers

router = APIRouter()

@router.post("/run-all")
async def run_all_triggers():
    result = await check_triggers()
    return result
