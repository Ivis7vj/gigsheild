"""
Payment Service for GigShield
Handles instant payouts via:
1. Razorpay Test Mode Integration (primary)
2. UPI Simulator Fallback (local mock)
"""
import os
import hashlib
import hmac
import json
import asyncio
from datetime import datetime
from typing import Optional, Dict
import httpx

# Razorpay test credentials (from environment or defaults)
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_mock_key_id")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "mock_secret")
RAZORPAY_BASE_URL = "https://api.razorpay.com/v1"


def generate_utr() -> str:
    """Generate a realistic UTR (Unique Transaction Reference) number."""
    import random
    # UTR format: 12 alphanumeric characters (e.g., "HDFC23A12345")
    banks = ["HDFC", "ICIC", "SBIN", "AXIS", "PUNB", "BARB"]
    bank = random.choice(banks)
    chars = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=8))
    return f"{bank}{chars}"


async def initiate_razorpay_payout(
    worker_id: str,
    upi_id: str,
    amount: float,
    claim_id: str
) -> Dict:
    """
    Initiate payout via Razorpay test API.

    Returns dict with:
    - success: bool
    - transaction_id: str
    - gateway_response: dict
    - error: str (if failed)
    """
    try:
        # In real implementation, this would call Razorpay's Payouts API
        # For demo, we simulate the API call with realistic response

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Razorpay test mode payout endpoint
            # Note: This is a simulation - real implementation would use actual Razorpay API

            # Simulate API latency
            await asyncio.sleep(1.5)

            # Mock successful response
            transaction_id = f"pay_{hashlib.md5(f'{claim_id}{datetime.utcnow().isoformat()}'.encode()).hexdigest()[:12]}"

            gateway_response = {
                "id": transaction_id,
                "entity": "payment",
                "amount": int(amount * 100),  # Razorpay uses paise
                "currency": "INR",
                "status": "captured",
                "method": "upi",
                "upi": {
                    "vpa": upi_id,
                    "status": "success",
                    "utr": generate_utr()
                },
                "created_at": int(datetime.utcnow().timestamp())
            }

            return {
                "success": True,
                "transaction_id": transaction_id,
                "gateway_response": gateway_response,
                "utr": gateway_response["upi"]["utr"],
                "error": None
            }

    except httpx.TimeoutException:
        return {
            "success": False,
            "transaction_id": None,
            "gateway_response": None,
            "error": "Payment gateway timeout"
        }
    except Exception as e:
        return {
            "success": False,
            "transaction_id": None,
            "gateway_response": None,
            "error": str(e)
        }


async def simulate_upi_payout(
    worker_id: str,
    upi_id: str,
    amount: float,
    claim_id: str
) -> Dict:
    """
    UPI Simulator Fallback - Mock UPI endpoint.
    Simulates realistic UPI transaction with 2-3 second delay.

    Returns dict with:
    - success: bool
    - transaction_id: str
    - utr: str
    - gateway_response: dict
    - error: str (if failed)
    """
    import asyncio

    try:
        # Simulate UPI processing delay (2-3 seconds)
        await asyncio.sleep(2.5)

        # Generate transaction details
        transaction_id = f"UPI_{hashlib.md5(f'{claim_id}{upi_id}{datetime.utcnow().isoformat()}'.encode()).hexdigest()[:10].upper()}"
        utr = generate_utr()

        # Simulate 95% success rate
        import random
        if random.random() < 0.95:
            gateway_response = {
                "transaction_id": transaction_id,
                "utr": utr,
                "vpa": upi_id,
                "amount": amount,
                "currency": "INR",
                "status": "SUCCESS",
                "message": "Transaction completed successfully",
                "bank_ref_no": f"BRN{random.randint(100000, 999999)}",
                "processed_at": datetime.utcnow().isoformat()
            }

            return {
                "success": True,
                "transaction_id": transaction_id,
                "utr": utr,
                "gateway_response": gateway_response,
                "error": None
            }
        else:
            # Simulate occasional failure
            return {
                "success": False,
                "transaction_id": transaction_id,
                "utr": None,
                "gateway_response": {
                    "status": "FAILED",
                    "message": "Insufficient funds in bank account",
                    "error_code": "UP1001"
                },
                "error": "UPI transaction failed: Insufficient funds"
            }

    except Exception as e:
        return {
            "success": False,
            "transaction_id": None,
            "utr": None,
            "gateway_response": None,
            "error": f"UPI simulator error: {str(e)}"
        }


async def process_payout(
    worker_id: str,
    upi_id: str,
    amount: float,
    claim_id: str,
    use_razorpay: bool = True
) -> Dict:
    """
    Main payout processor with automatic fallback.

    1. Try Razorpay first (if enabled)
    2. Fall back to UPI simulator if Razorpay fails
    3. Record all transaction details

    Returns comprehensive payout result.
    """
    import asyncio

    result = {
        "payout_initiated_at": datetime.utcnow().isoformat(),
        "worker_id": worker_id,
        "upi_id": upi_id,
        "amount": amount,
        "claim_id": claim_id,
        "method": None,
        "status": None,
        "transaction_id": None,
        "utr": None,
        "gateway_response": None,
        "error": None
    }

    # Try Razorpay first
    if use_razorpay:
        print(f"🔄 Attempting Razorpay payout for claim {claim_id}...")
        result["method"] = "razorpay"

        razorpay_result = await initiate_razorpay_payout(
            worker_id=worker_id,
            upi_id=upi_id,
            amount=amount,
            claim_id=claim_id
        )

        if razorpay_result["success"]:
            result["status"] = "COMPLETED"
            result["transaction_id"] = razorpay_result["transaction_id"]
            result["utr"] = razorpay_result["utr"]
            result["gateway_response"] = razorpay_result["gateway_response"]
            print(f"✅ Razorpay payout successful: {result['transaction_id']}")
            return result
        else:
            print(f"⚠️ Razorpay failed: {razorpay_result['error']}. Falling back to UPI simulator...")
            result["error"] = f"Razorpay failed: {razorpay_result['error']}"

    # Fallback to UPI simulator
    print(f"🔄 Attempting UPI simulator payout for claim {claim_id}...")
    result["method"] = "upi_simulator"
    result["error"] = None  # Clear previous error

    upi_result = await simulate_upi_payout(
        worker_id=worker_id,
        upi_id=upi_id,
        amount=amount,
        claim_id=claim_id
    )

    if upi_result["success"]:
        result["status"] = "COMPLETED"
        result["transaction_id"] = upi_result["transaction_id"]
        result["utr"] = upi_result["utr"]
        result["gateway_response"] = upi_result["gateway_response"]
        print(f"✅ UPI payout successful: {result['transaction_id']} (UTR: {result['utr']})")
    else:
        result["status"] = "FAILED"
        result["error"] = upi_result["error"]
        result["gateway_response"] = upi_result["gateway_response"]
        print(f"❌ UPI payout failed: {result['error']}")

    return result


# API route for UPI simulator endpoint
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

class UPIPayoutRequest(BaseModel):
    worker_id: str
    upi_id: str
    amount: float
    claim_id: str

class UPIPayoutResponse(BaseModel):
    success: bool
    transaction_id: str
    utr: str
    amount: float
    status: str
    message: str
    processed_at: str

upi_router = APIRouter()

@upi_router.post("/simulate", response_model=UPIPayoutResponse)
async def upi_simulate_endpoint(req: UPIPayoutRequest):
    """
    Mock UPI endpoint for testing payout flows.
    Returns realistic UPI transaction response with fake UTR.
    """
    result = await simulate_upi_payout(
        worker_id=req.worker_id,
        upi_id=req.upi_id,
        amount=req.amount,
        claim_id=req.claim_id
    )

    if result["success"]:
        return UPIPayoutResponse(
            success=True,
            transaction_id=result["transaction_id"],
            utr=result["utr"],
            amount=req.amount,
            status="SUCCESS",
            message=f"₹{req.amount} transferred to {req.upi_id}",
            processed_at=datetime.utcnow().isoformat()
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=result["error"] or "UPI transaction failed"
        )
