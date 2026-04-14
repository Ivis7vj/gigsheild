from fastapi import APIRouter, Depends, HTTPException
from deps import get_current_worker
from models import MissedDisruptionReport, Claim
from database import claims_collection, workers_collection
from typing import List
from datetime import datetime
from services.fraud_engine import calculate_fraud_score
from services.payment_service import process_payout
import asyncio

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

@router.post("/{claim_id}/process-payout")
async def process_claim_payout(claim_id: str, worker: dict = Depends(get_current_worker)):
    """
    Process instant payout for an approved claim.
    Tries Razorpay first, falls back to UPI simulator.
    """
    claim = await claims_collection.find_one({"claim_id": claim_id, "worker_id": worker["worker_id"]})

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.get("status") not in ["Approved", "Paid"]:
        raise HTTPException(status_code=400, detail="Claim must be approved before payout")

    if claim.get("payout_status") == "COMPLETED":
        raise HTTPException(status_code=400, detail="Payout already completed")

    # Get worker UPI
    upi_id = claim.get("upi_id") or worker.get("upi_id")
    if not upi_id:
        raise HTTPException(status_code=400, detail="No UPI ID configured for worker")

    # Update status to INITIATED
    await claims_collection.update_one(
        {"claim_id": claim_id},
        {"$set": {"payout_status": "INITIATED"}}
    )

    # Process payout in background
    payout_result = await process_payout(
        worker_id=worker["worker_id"],
        upi_id=upi_id,
        amount=claim.get("payout_amount", 0),
        claim_id=claim_id
    )

    # Update claim with payout details
    update_data = {
        "payout_status": payout_result["status"],
        "payout_transaction_id": payout_result["transaction_id"],
        "payout_time": datetime.utcnow(),
        "gateway_response": payout_result["gateway_response"]
    }

    if payout_result["status"] == "COMPLETED":
        update_data["status"] = "Paid"
        update_data["payout_utr"] = payout_result["utr"]

    await claims_collection.update_one(
        {"claim_id": claim_id},
        {"$set": update_data}
    )

    return {
        "status": "success",
        "payout_status": payout_result["status"],
        "transaction_id": payout_result["transaction_id"],
        "utr": payout_result.get("utr"),
        "amount": claim.get("payout_amount", 0),
        "message": f"₹{claim.get('payout_amount', 0)} has been sent to your UPI ID {upi_id}"
    }

@router.post("/submit-with-fraud-check")
async def submit_claim_with_fraud_check(claim_data: dict, worker: dict = Depends(get_current_worker)):
    """
    Submit a claim with integrated fraud detection.
    Runs GPS spoofing, weather verification, and behavioral anomaly detection.
    """
    from services.trigger_engine import TriggerEngine

    claim_id = f"CLM{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
    trigger_type = claim_data.get("trigger_type", "Manual")

    # Get GPS coordinates if provided
    gps_lat = claim_data.get("gps_lat")
    gps_lon = claim_data.get("gps_lon")

    # Run fraud detection
    fraud_result = await calculate_fraud_score(
        worker_id=worker["worker_id"],
        triggered_zone=worker.get("zone", "Unknown"),
        trigger_type=trigger_type,
        gps_lat=gps_lat,
        gps_lon=gps_lon,
        claim_timestamp=datetime.utcnow()
    )

    # Create claim record
    claim = {
        "claim_id": claim_id,
        "worker_id": worker["worker_id"],
        "trigger_type": trigger_type,
        "event_name": claim_data.get("event_name", trigger_type),
        "triggered_at": datetime.utcnow(),
        "payout_amount": claim_data.get("payout_amount", 0),
        "fraud_score": fraud_result["score"],
        "fraud_factors": fraud_result["factors"],
        "status": fraud_result["status"],
        "gps_lat": gps_lat,
        "gps_lon": gps_lon,
        "gps_fraud_score": fraud_result.get("gps_fraud_score", 0),
        "weather_verification_result": fraud_result.get("weather_verification", "N/A"),
        "behavioral_risk": fraud_result.get("behavioral_risk", "LOW"),
        "payout_status": None,
        "upi_id": worker.get("upi_id")
    }

    await claims_collection.insert_one(claim)

    return {
        "status": "success",
        "claim_id": claim_id,
        "fraud_score": fraud_result["score"],
        "claim_status": fraud_result["status"],
        "fraud_factors": fraud_result["factors"]
    }
