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
