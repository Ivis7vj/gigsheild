from apscheduler.schedulers.asyncio import AsyncIOScheduler
from services.trigger_engine import check_triggers
from services.pricing_engine import calculate_premium
from database import policies_collection, workers_collection, premium_history_collection
from datetime import datetime, timedelta
import asyncio

scheduler = AsyncIOScheduler()

async def recalculate_weekly_premiums():
    print("Recalculating weekly premiums...")
    active_policies = await policies_collection.find({"status": "Active"}).to_list(length=None)
    now = datetime.utcnow()
    # Next week runs from next Monday to Sunday
    days_ahead = 0 - now.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    next_week_start = now + timedelta(days=days_ahead)
    next_week_start = next_week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    next_week_end = next_week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

    for policy in active_policies:
        worker_id = policy["worker_id"]
        worker = await workers_collection.find_one({"worker_id": worker_id})
        if not worker:
            continue
            
        premium_data = await calculate_premium(worker)
        
        # Save to policy
        await policies_collection.update_one(
            {"worker_id": worker_id},
            {"$set": {
                "week_start": next_week_start,
                "week_end": next_week_end,
                "premium": premium_data["final_premium"]
            }}
        )
        # Store history
        await premium_history_collection.insert_one({
            "worker_id": worker_id,
            "week_start": next_week_start,
            "base_premium": premium_data["base_premium"],
            "final_premium": premium_data["final_premium"],
            "factors": premium_data["factors"]
        })

def start_scheduler():
    # Trigger check every 30 mins
    scheduler.add_job(check_triggers, "interval", minutes=30)
    
    # Weekly premium recalculation (Sunday at 23:50)
    scheduler.add_job(recalculate_weekly_premiums, "cron", day_of_week="sun", hour=23, minute=50)
    
    scheduler.start()
    print("APScheduler started.")
