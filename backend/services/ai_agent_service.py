import os
from collections import defaultdict, deque
from datetime import datetime
from typing import Dict, Optional

from groq import Groq

from database import ai_agent_logs_collection, claims_collection, workers_collection, policies_collection


MAX_MEMORY = 5
_memory = defaultdict(lambda: deque(maxlen=MAX_MEMORY))


def _fallback_reply(user_message: str, user_type: str) -> Dict:
    msg = user_message.lower()
    if "premium" in msg:
        return {
            "agent_response": "Your premium is weekly and depends on zone risk, claim history, and earnings. I can show a detailed breakdown.",
            "suggested_actions": ["View Premium Breakdown", "Check Savings Tips"],
        }
    if "fraud" in msg and user_type == "admin":
        return {
            "agent_response": "This claim appears flagged due to mismatch signals. I can explain GPS, weather match, and pattern checks in simple terms.",
            "suggested_actions": ["Explain Fraud Signals", "Escalate Claim"],
        }
    if "claim" in msg:
        return {
            "agent_response": "You can start with claim type and affected time window. I can guide eligibility in one step.",
            "suggested_actions": ["Start Claim", "Check Eligibility"],
        }
    return {
        "agent_response": "I can help with claims, fraud explanations, premium breakdown, and weather verification.",
        "suggested_actions": ["Start Claim", "Explain Premium", "Explain Fraud"],
    }


def _get_client() -> Optional[Groq]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    return Groq(api_key=api_key)


async def _log_response(payload: dict, response: Dict):
    doc = {
        "user_type": payload.get("user_type"),
        "user_message": payload.get("user_message"),
        "context_claim_id": payload.get("context_claim_id"),
        "context_worker_id": payload.get("context_worker_id"),
        "agent_response": response.get("agent_response"),
        "suggested_actions": response.get("suggested_actions", []),
        "created_at": datetime.utcnow(),
    }
    await ai_agent_logs_collection.insert_one(doc)


async def chat(payload: dict) -> Dict:
    memory_key = f"{payload.get('user_type', 'worker')}::{payload.get('context_worker_id', 'anonymous')}"
    _memory[memory_key].append({"role": "user", "content": payload.get("user_message", "")})

    client = _get_client()
    if not client:
        response = _fallback_reply(payload.get("user_message", ""), payload.get("user_type", "worker"))
        await _log_response(payload, response)
        return response

    system_prompt = (
        "You are GigShield Claim Assistant. Be friendly, concise, and practical. "
        "Use worker-friendly language, avoid jargon, and explain numbers clearly. "
        "If asked about claim, fraud, premium or weather, provide concrete guidance."
    )
    history = list(_memory[memory_key])[-MAX_MEMORY:]
    chat_messages = [{"role": "system", "content": system_prompt}] + history

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=chat_messages,
            temperature=0.2,
        )
        agent_text = completion.choices[0].message.content
    except Exception:
        response = _fallback_reply(payload.get("user_message", ""), payload.get("user_type", "worker"))
        await _log_response(payload, response)
        return response

    _memory[memory_key].append({"role": "assistant", "content": agent_text})
    response = {"agent_response": agent_text, "suggested_actions": ["Start Claim", "View Premium Breakdown", "Explain Fraud Signals"]}
    await _log_response(payload, response)
    return response


async def explain_fraud(claim_id: str) -> Dict:
    claim = await claims_collection.find_one({"claim_id": claim_id})
    if not claim:
        return {"explanation_text": "Claim not found.", "fraud_signals_plain_english": []}
    signals = [
        f"GPS anomaly score: {claim.get('gps_fraud_score', 0)}",
        f"Weather verification: {claim.get('weather_verification_result', 'N/A')}",
        f"Behavioral risk: {claim.get('behavioral_risk', 'LOW')}",
        f"ML fraud risk score: {claim.get('ml_fraud_risk_score', 0)}",
    ]
    explanation = "Fraud risk is based on location consistency, weather verification, claim pattern, and amount anomalies."
    return {"explanation_text": explanation, "fraud_signals_plain_english": signals}


async def explain_premium(worker_id: str) -> Dict:
    worker = await workers_collection.find_one({"worker_id": worker_id})
    policy = await policies_collection.find_one({"worker_id": worker_id})
    if not worker:
        return {"premium_breakdown": "Worker not found.", "savings_tips": []}
    base = worker.get("weekly_earnings", 0) * 0.02
    premium = policy.get("premium", 0) if policy else 0
    breakdown = (
        f"Base premium is about ₹{round(base, 2)}. "
        f"Current weekly premium is ₹{premium}, adjusted by zone risk, recent claims, and trust/risk scores."
    )
    tips = [
        "Keep claim submissions accurate and timely.",
        "Avoid high-risk zones during severe weather windows when possible.",
        "Maintain consistent verified check-ins to improve trust score.",
    ]
    return {"premium_breakdown": breakdown, "savings_tips": tips}
