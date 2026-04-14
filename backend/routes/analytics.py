from fastapi import APIRouter, Depends
from deps import get_current_worker
from database import premium_history_collection, claims_collection, disruption_events_collection, policies_collection
from datetime import datetime

router = APIRouter()

@router.get("/worker")
async def worker_analytics(worker: dict = Depends(get_current_worker)):
    worker_id = worker["worker_id"]
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0)

    # Total premium paid this month
    premiums = await premium_history_collection.find({"worker_id": worker_id, "week_start": {"$gte": month_start}}).to_list(100)
    total_premium = sum(p.get("final_premium", 0) for p in premiums)
    
    # Total payouts received this month
    claims = await claims_collection.find({"worker_id": worker_id, "status": "Paid", "triggered_at": {"$gte": month_start}}).to_list(100)
    total_payout = sum(c.get("payout_amount", 0) for c in claims)
    
    # Number of disruption events in city this month
    disruptions = await disruption_events_collection.count_documents({"city": worker["city"], "timestamp": {"$gte": month_start}})
    
    # Zone risk score matching (mock trends)
    risk_trends = [
        {"week": "Week 1", "score": worker.get("risk_score", 40) - 5},
        {"week": "Week 2", "score": worker.get("risk_score", 40) + 2},
        {"week": "Week 3", "score": worker.get("risk_score", 40) - 1},
        {"week": "Week 4", "score": worker.get("risk_score", 40)}
    ]
    
    # Days with active disruptions calendar heat map (Mock)
    calendar_map = [{"date": "2024-05-10", "disruption": "Heavy Rainfall"}, {"date": "2024-05-15", "disruption": "Severe Air Pollution"}]
    
    return {
        "total_premium": total_premium, 
        "total_payout": total_payout, 
        "disruptions_count": disruptions, 
        "risk_trends": risk_trends,
        "calendar_map": calendar_map
    }

@router.get("/admin")
async def admin_analytics():
    total_policies = await policies_collection.count_documents({"status": "Active"})
    
    claims = await claims_collection.find({}).to_list(1000)
    total_payouts = sum(c.get("payout_amount", 0) for c in claims if c.get("status") == "Paid")
    
    # Claims by trigger type
    trigger_counts = {}
    flagged_count = 0
    for c in claims:
        t = c.get("trigger_type")
        trigger_counts[t] = trigger_counts.get(t, 0) + 1
        if c.get("status") == "Flagged":
            flagged_count += 1
            
    donut_chart = [{"name": k, "value": v} for k, v in trigger_counts.items()]
    
    # Fraud percentage
    total_claims = len(claims)
    fraud_pct = (flagged_count / total_claims * 100) if total_claims > 0 else 0
    
    top_risk_zones = [
        {"name": "Mumbai - Zone 1", "risk": 85},
        {"name": "Bengaluru - Zone 2", "risk": 78},
        {"name": "Chennai - Zone 1", "risk": 75},
        {"name": "Delhi - Zone 2", "risk": 60},
        {"name": "Hyderabad - Zone 5", "risk": 55}
    ]
    
    return {
        "total_policies": total_policies,
        "total_payouts": round(total_payouts, 2),
        "donut_chart": donut_chart,
        "top_risk_zones": top_risk_zones,
        "flagged_count": flagged_count,
        "fraud_pct": round(fraud_pct, 1)
    }

@router.get("/risk-insights")
async def risk_insights(worker: dict = Depends(get_current_worker)):
    city = worker.get("city", "Mumbai")

    # Mock dynamic risk pulse data based on city
    # In a real app, this would query a weather/traffic API
    risk_pulse = {
        "city_score": 24,
        "zones": [
            {"name": f"{city} Central", "score": 12, "level": "Low"},
            {"name": f"{city} West", "score": 42, "level": "Medium"},
            {"name": f"{city} North", "score": 65, "level": "High"}
        ],
        "insight": "High humidity today may slightly affect rider performance."
    }

    # 7-day projection mock
    projections = [
        {"day": "Mon", "risk": 20},
        {"day": "Tue", "risk": 85},
        {"day": "Wed", "risk": 40},
        {"day": "Thu", "risk": 15},
        {"day": "Fri", "risk": 30},
        {"day": "Sat", "risk": 50},
        {"day": "Sun", "risk": 25}
    ]

    # Safety Score breakdown
    safety_score = {
        "current": 850,
        "max": 1000,
        "tier": "Silver Tier",
        "next_threshold": 900,
        "weekly_change": 15
    }

    return {
        "risk_pulse": risk_pulse,
        "projections": projections,
        "safety_score": safety_score
    }

@router.get("/worker-trust")
async def worker_trust_score(worker: dict = Depends(get_current_worker)):
    """
    Calculate worker's trust score based on:
    - No fraud flags on claims
    - Consistent check-ins
    - Claim history patterns
    - Account age
    """
    from datetime import timedelta

    worker_id = worker["worker_id"]

    # Get all claims for this worker
    all_claims = await claims_collection.find({"worker_id": worker_id}).to_list(100)

    # Base score starts at 75
    base_score = 75

    # Bonus for no fraud flags
    clean_claims = sum(1 for c in all_claims if c.get("fraud_score", 0) < 30)
    if len(all_claims) > 0:
        clean_ratio = clean_claims / len(all_claims)
        base_score += int(clean_ratio * 15)  # Up to +15 for clean claims

    # Bonus for account age (up to +5)
    created_at = worker.get("created_at")
    if created_at:
        account_age_days = (datetime.utcnow() - created_at).days
        base_score += min(account_age_days // 30, 5)  # +1 per month, max +5

    # Penalty for high fraud scores
    high_risk_claims = sum(1 for c in all_claims if c.get("fraud_score", 0) > 60)
    base_score -= high_risk_claims * 5  # -5 per high-risk claim

    # Bonus for consistent check-ins (mock - would be real in production)
    base_score += 5  # Consistent check-in bonus

    # Clamp to 0-100
    trust_score = max(0, min(100, base_score))

    return {
        "trust_score": trust_score,
        "clean_claims": clean_claims,
        "total_claims": len(all_claims),
        "factors": {
            "clean_claims_bonus": int(clean_ratio * 15) if len(all_claims) > 0 else 0,
            "account_age_bonus": min(account_age_days // 30, 5) if created_at else 0,
            "high_risk_penalty": high_risk_claims * 5,
            "consistency_bonus": 5
        }
    }
