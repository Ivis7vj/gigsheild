import asyncio
import os
import sys

# Add parent to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import workers_collection, policies_collection, claims_collection, civic_events_mock_collection
from auth_utils import get_password_hash
from datetime import datetime, timedelta
import uuid

async def seed_db():
    print("Emptying existing data...")
    for coll in [workers_collection, policies_collection, claims_collection, civic_events_mock_collection]:
        await coll.delete_many({})

    print("Seeding dummy workers...")
    workers = [
        {
            "worker_id": "WID-TEST01",
            "full_name": "Ramesh Kumar",
            "phone": "9999999991",
            "aadhaar_masked": "XXXX-XXXX-1234",
            "city": "Mumbai",
            "zone": "Zone 1",
            "platform": "Zomato",
            "weekly_earnings": 4500,
            "hours_per_day": 8,
            "days_per_week": 6,
            "upi_id": "ramesh@upi",
            "pin_hash": get_password_hash("1234"),
            "tier": "Standard",
            "risk_score": 60,
            "created_at": datetime.utcnow() - timedelta(days=30)
        },
        {
            "worker_id": "WID-TEST02",
            "full_name": "Suresh Raina",
            "phone": "9999999992",
            "aadhaar_masked": "XXXX-XXXX-5678",
            "city": "Bengaluru",
            "zone": "Zone 2",
            "platform": "Swiggy",
            "weekly_earnings": 7000,
            "hours_per_day": 10,
            "days_per_week": 7,
            "upi_id": "suresh@okicici",
            "pin_hash": get_password_hash("1234"),
            "tier": "Premium",
            "risk_score": 45,
            "created_at": datetime.utcnow() - timedelta(days=15)
        },
        {
            "worker_id": "WID-TEST03",
            "full_name": "Amit Sharma",
            "phone": "9999999993",
            "aadhaar_masked": "XXXX-XXXX-9999",
            "city": "Delhi",
            "zone": "Zone 4",
            "platform": "Zepto",
            "weekly_earnings": 2500,
            "hours_per_day": 5,
            "days_per_week": 4,
            "upi_id": "amit@ybl",
            "pin_hash": get_password_hash("1234"),
            "tier": "Basic",
            "risk_score": 30,
            "created_at": datetime.utcnow() - timedelta(days=5)
        }
    ]
    await workers_collection.insert_many(workers)

    print("Seeding dummy policies...")
    policies = []
    now = datetime.utcnow()
    for w in workers:
        payout_cap = 500 if w["tier"] == "Basic" else 800 if w["tier"] == "Standard" else 1200
        policies.append({
            "worker_id": w["worker_id"],
            "week_start": now - timedelta(days=now.weekday()), # Monday
            "week_end": now + timedelta(days=6-now.weekday()), # Sunday
            "premium": w["weekly_earnings"] * 0.02, # Basic mock 2%
            "tier": w["tier"],
            "status": "Active",
            "payout_cap": payout_cap
        })
    await policies_collection.insert_many(policies)

    print("Seeding past claims...")
    claims = []
    trigger_types = ["Heavy Rainfall", "Extreme Heat", "Severe Air Pollution", "Severe Weather Alert", "Civic Disruption"]
    for i in range(10):
        worker = workers[i % 3]
        ctype = trigger_types[i % 5]
        status = "Paid" if i != 9 else "Flagged"
        claims.append({
            "claim_id": str(uuid.uuid4()),
            "worker_id": worker["worker_id"],
            "trigger_type": ctype,
            "event_name": f"{ctype} in {worker['city']}",
            "triggered_at": now - timedelta(days=i*2 + 1),
            "payout_amount": round((worker["weekly_earnings"] / worker["days_per_week"]) * 0.5, 2),
            "fraud_score": 10 if status == "Paid" else 65,
            "fraud_factors": ["Some factor"] if status == "Flagged" else [],
            "status": status,
            "upi_id": worker["upi_id"]
        })
    await claims_collection.insert_many(claims)
    
    print("Seeding mock civic events...")
    await civic_events_mock_collection.insert_one({
        "city": "Mumbai",
        "zone": "Zone 1",
        "event_name": "Bandh Protest",
        "start_time": now - timedelta(hours=1),
        "end_time": now + timedelta(hours=2),
        "created_by": "admin"
    })
    
    print("Database seeding completed.")

if __name__ == "__main__":
    asyncio.run(seed_db())
