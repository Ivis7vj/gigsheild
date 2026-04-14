from fastapi import APIRouter, HTTPException
from database import workers_collection, claims_collection, policies_collection
from datetime import datetime, timedelta
from typing import List

router = APIRouter()

@router.get("/workers")
async def get_all_workers():
    workers = await workers_collection.find({}).to_list(1000)
    for w in workers:
        w.pop("_id", None)
    return workers

@router.get("/claims")
async def get_all_claims():
    claims = await claims_collection.find({}).sort("triggered_at", -1).to_list(1000)
    for c in claims:
        c.pop("_id", None)
    return claims

@router.get("/fraud-dashboard")
async def get_fraud_dashboard():
    """
    Admin Fraud Dashboard:
    - Fraud risk leaderboard (top 10 high-risk claims)
    - Claims by fraud status
    - Recent flagged claims with detailed signals
    """
    # Get all claims with fraud scores
    all_claims = await claims_collection.find({}).sort("fraud_score", -1).to_list(1000)

    # Top 10 high-risk claims
    high_risk_claims = []
    for claim in all_claims[:10]:
        worker = await workers_collection.find_one({"worker_id": claim.get("worker_id")})
        high_risk_claims.append({
            "claim_id": claim.get("claim_id"),
            "worker_id": claim.get("worker_id"),
            "worker_name": worker.get("full_name") if worker else "Unknown",
            "trigger_type": claim.get("trigger_type"),
            "fraud_score": claim.get("fraud_score", 0),
            "gps_fraud_score": claim.get("gps_fraud_score", 0),
            "weather_verification": claim.get("weather_verification_result", "N/A"),
            "behavioral_risk": claim.get("behavioral_risk", "LOW"),
            "fraud_factors": claim.get("fraud_factors", []),
            "status": claim.get("status"),
            "payout_amount": claim.get("payout_amount", 0),
            "triggered_at": claim.get("triggered_at")
        })

    # Claims by status
    status_counts = {}
    for claim in all_claims:
        status = claim.get("status", "Unknown")
        status_counts[status] = status_counts.get(status, 0) + 1

    # Fraud score distribution
    score_distribution = {
        "low_risk": 0,      # 0-30
        "medium_risk": 0,   # 31-60
        "high_risk": 0      # 61-100
    }
    for claim in all_claims:
        score = claim.get("fraud_score", 0)
        if score <= 30:
            score_distribution["low_risk"] += 1
        elif score <= 60:
            score_distribution["medium_risk"] += 1
        else:
            score_distribution["high_risk"] += 1

    # Claims under review / escalated
    under_review = await claims_collection.count_documents({"status": "Review"})
    escalated = await claims_collection.count_documents({"status": "Escalated"})

    return {
        "high_risk_claims": high_risk_claims,
        "status_counts": status_counts,
        "score_distribution": score_distribution,
        "under_review": under_review,
        "escalated": escalated,
        "total_claims": len(all_claims)
    }

@router.post("/claims/{claim_id}/review")
async def update_claim_review(claim_id: str, action: str):
    """
    Update claim review status.
    Actions: reviewed, escalated, approved, rejected
    """
    valid_actions = ["reviewed", "escalated", "approved", "rejected"]
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {valid_actions}")

    status_map = {
        "reviewed": "Reviewed",
        "escalated": "Escalated",
        "approved": "Approved",
        "rejected": "Rejected"
    }

    result = await claims_collection.update_one(
        {"claim_id": claim_id},
        {"$set": {
            "status": status_map[action],
            "reviewed_at": datetime.utcnow(),
            "reviewed_by": "admin"
        }}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Claim not found")

    return {"status": "success", "new_status": status_map[action]}

@router.get("/analytics/deep")
async def get_deep_analytics():
    """
    Enhanced admin analytics with loss ratio, portfolio health, and predictions.
    """
    # Get all policies and claims
    all_policies = await policies_collection.find({"status": "Active"}).to_list(1000)
    all_claims = await claims_collection.find({}).to_list(1000)

    # Total premiums collected
    total_premiums = sum(p.get("premium", 0) for p in all_policies)

    # Total payouts (paid claims)
    total_payouts = sum(
        c.get("payout_amount", 0)
        for c in all_claims
        if c.get("status") == "Paid"
    )

    # Loss ratio
    loss_ratio = (total_payouts / total_premiums * 100) if total_premiums > 0 else 0

    # Claim frequency (claims per policy)
    claim_frequency = len(all_claims) / len(all_policies) if all_policies else 0

    # Fraud rate
    flagged_claims = sum(1 for c in all_claims if c.get("status") in ["Flagged", "Review", "Escalated"])
    fraud_rate = (flagged_claims / len(all_claims) * 100) if all_claims else 0

    # Portfolio Health Score (0-100)
    # Based on: loss ratio (40%), fraud rate (30%), claim frequency (30%)
    loss_score = max(0, 100 - loss_ratio)  # Lower loss ratio = better
    fraud_score = max(0, 100 - fraud_rate * 2)  # Lower fraud = better
    frequency_score = max(0, 100 - claim_frequency * 10)  # Lower frequency = better

    portfolio_health = round(
        loss_score * 0.4 +
        fraud_score * 0.3 +
        frequency_score * 0.3
    )

    # Claims by pincode (for heatmap)
    pincode_claims = {}
    for claim in all_claims:
        worker = await workers_collection.find_one({"worker_id": claim.get("worker_id")})
        if worker:
            pincode = worker.get("pincode", "Unknown")
            pincode_claims[pincode] = pincode_claims.get(pincode, 0) + 1

    # Top 10 claim locations
    top_pincodes = sorted(
        [{"pincode": k, "count": v} for k, v in pincode_claims.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:10]

    # Predictive analytics: next week's likely claims
    # Simple model: average of last 4 weeks
    four_weeks_ago = datetime.utcnow() - timedelta(days=28)
    recent_claims = [
        c for c in all_claims
        if c.get("triggered_at") and c["triggered_at"] >= four_weeks_ago
    ]
    weekly_average = len(recent_claims) / 4 if recent_claims else 0

    return {
        "loss_ratio": round(loss_ratio, 2),
        "total_premiums": round(total_premiums, 2),
        "total_payouts": round(total_payouts, 2),
        "claim_frequency": round(claim_frequency, 2),
        "fraud_rate": round(fraud_rate, 2),
        "portfolio_health": portfolio_health,
        "top_pincodes": top_pincodes,
        "predicted_claims_next_week": round(weekly_average),
        "active_policies": len(all_policies),
        "total_claims": len(all_claims)
    }
