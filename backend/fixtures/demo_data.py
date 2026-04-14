from datetime import datetime, timedelta


DEMO_WORKERS = [
    {"worker_id": "WID-DEMO001", "full_name": "Ravi Kumar", "phone": "9000000001", "city": "Bengaluru", "zone": "Koramangala", "pincode": "560034", "platform": "Zomato", "weekly_earnings": 5200, "claims_count_30d": 1, "risk_score": 42},
    {"worker_id": "WID-DEMO002", "full_name": "Anand S", "phone": "9000000002", "city": "Bengaluru", "zone": "MG Road", "pincode": "560001", "platform": "Swiggy", "weekly_earnings": 4800, "claims_count_30d": 2, "risk_score": 55},
    {"worker_id": "WID-DEMO003", "full_name": "Imran A", "phone": "9000000003", "city": "Mumbai", "zone": "Fort", "pincode": "400001", "platform": "Amazon", "weekly_earnings": 6100, "claims_count_30d": 0, "risk_score": 35},
]


def make_claim(worker_id: str, idx: int, status: str, fraud_score: int, pincode: str):
    now = datetime.utcnow()
    return {
        "claim_id": f"CLM-DEMO-{idx:03d}",
        "worker_id": worker_id,
        "trigger_type": "Heavy Rainfall",
        "event_name": "Heavy Rainfall",
        "triggered_at": now - timedelta(days=idx),
        "payout_amount": 1000 + idx * 120,
        "status": status,
        "fraud_score": fraud_score,
        "fraud_factors": ["GPS jump anomaly", "Weather mismatch"] if fraud_score > 70 else ["Verified weather"],
        "gps_fraud_score": min(100, fraud_score + 5),
        "weather_verification_result": "MISMATCH" if fraud_score > 70 else "VERIFIED",
        "behavioral_risk": "HIGH" if fraud_score > 70 else "LOW",
        "ml_fraud_risk_score": fraud_score,
        "ml_approval_probability": max(5, 100 - fraud_score),
        "requires_manual_review": fraud_score > 75,
        "payout_status": "COMPLETED" if status == "Paid" else None,
        "upi_id": "demo@upi",
        "pincode": pincode,
    }


DEMO_CLAIMS = [
    make_claim("WID-DEMO001", 1, "Paid", 22, "560034"),
    make_claim("WID-DEMO001", 2, "Review", 82, "560034"),
    make_claim("WID-DEMO002", 3, "Approved", 44, "560001"),
    make_claim("WID-DEMO003", 4, "Rejected", 88, "400001"),
]
