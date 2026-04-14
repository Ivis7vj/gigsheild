from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from services.ai_agent_service import chat, explain_fraud, explain_premium


router = APIRouter()


class ChatRequest(BaseModel):
    user_message: str
    user_type: str = "worker"
    context_claim_id: Optional[str] = None
    context_worker_id: Optional[str] = None


class FraudExplainRequest(BaseModel):
    claim_id: str


class PremiumExplainRequest(BaseModel):
    worker_id: str


@router.post("/chat")
async def ai_chat(payload: ChatRequest):
    return await chat(payload.model_dump())


@router.post("/explain-fraud")
async def ai_explain_fraud(payload: FraudExplainRequest):
    return await explain_fraud(payload.claim_id)


@router.post("/explain-premium")
async def ai_explain_premium(payload: PremiumExplainRequest):
    return await explain_premium(payload.worker_id)
