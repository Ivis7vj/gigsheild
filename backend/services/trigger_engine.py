import asyncio
import httpx
from datetime import datetime, timedelta
import uuid
import os
from database import policies_collection, workers_collection, claims_collection, disruption_events_collection, civic_events_mock_collection
from services.fraud_engine import calculate_fraud_score

OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY", "your_api_key_here")

# Define Mock Cities to fetch weather for
CITIES = {
    "Mumbai": {"lat": 19.0760, "lon": 72.8777},
    "Delhi": {"lat": 28.7041, "lon": 77.1025},
    "Bengaluru": {"lat": 12.9716, "lon": 77.5946},
    "Chennai": {"lat": 13.0827, "lon": 80.2707},
    "Hyderabad": {"lat": 17.3850, "lon": 78.4867},
}

async def process_claim_background(claim_id: str):
    """Zero-touch background claim processing."""
    try:
        # Move to Processing in 10 seconds (for quick demo, instead of 2 mins)
        await asyncio.sleep(10)
        claim = await claims_collection.find_one({"claim_id": claim_id})
        if claim and claim["status"] == "Initiated":
            await claims_collection.update_one({"claim_id": claim_id}, {"$set": {"status": "Processing"}})
            
            # Move to Paid in another 10 seconds (instead of 3 mins)
            await asyncio.sleep(10)
            await claims_collection.update_one({"claim_id": claim_id}, {"$set": {"status": "Paid"}})
    except Exception as e:
        print(f"Background claim task failed: {e}")

async def create_claims_for_trigger(trigger_name: str, city: str, zone: str, payout_pct: float, is_capped: bool = False):
    """Helper to generate claims matching a trigger event."""
    # Find all active policies in this city/zone
    now = datetime.utcnow()
    # for simplicity in this demo, zone affects worker
    query = {"status": "Active", "week_start": {"$lte": now}, "week_end": {"$gte": now}}
    
    active_policies = await policies_collection.find(query).to_list(length=1000)
    workers_affected = 0
    total_payout = 0
    
    for policy in active_policies:
        worker_id = policy["worker_id"]
        worker = await workers_collection.find_one({"worker_id": worker_id})
        if not worker or worker["city"] != city:
            continue
        if zone != "All" and worker["zone"] != zone:
            continue
            
        workers_affected += 1
        
        # Calculate daily earnings using hours/days based logic
        daily_earnings = worker.get("weekly_earnings", 0) / max(worker.get("days_per_week", 1), 1)
        payout_amount = daily_earnings * payout_pct
        
        if is_capped:
            payout_amount = min(payout_amount, policy.get("payout_cap", 500))
            
        # Check fraud
        fraud_result = await calculate_fraud_score(worker_id, zone, trigger_name)
        
        # Actuarial refinement: Check for standard exclusions
        # In a real system, the trigger source would provide the cause. 
        # For this demo, we check if the trigger name itself is an excluded category.
        is_excluded = any(ex in trigger_name for ex in ["War", "Pandemic", "Terrorism", "Nuclear"])
        
        claim_id = str(uuid.uuid4())
        status = "Flagged (Excluded)" if is_excluded else fraud_result["status"]
        
        claim_doc = {
            "claim_id": claim_id,
            "worker_id": worker_id,
            "trigger_type": trigger_name,
            "event_name": f"{trigger_name} in {city} ({zone})",
            "triggered_at": datetime.utcnow(),
            "payout_amount": round(payout_amount, 2) if not is_excluded else 0,
            "fraud_score": fraud_result["score"],
            "fraud_factors": fraud_result["factors"] + (["Standard Exclusion Match"] if is_excluded else []),
            "status": status,
            "upi_id": worker.get("upi_id")
        }
        await claims_collection.insert_one(claim_doc)
        total_payout += payout_amount
        
        # Kickoff background task unless flagged
        if fraud_result["status"] == "Initiated":
            asyncio.create_task(process_claim_background(claim_id))
            
    if workers_affected > 0:
        event_doc = {
            "trigger_name": trigger_name,
            "city": city,
            "zone": zone,
            "timestamp": datetime.utcnow(),
            "workers_affected": workers_affected,
            "total_payout": round(total_payout, 2)
        }
        await disruption_events_collection.insert_one(event_doc)

async def check_triggers():
    """Runs every 30 minutes to check 5 triggers."""
    print("Running automated trigger check...")
    trigger_status = []
    
    # Trigger 5: Civic Disruption Mock
    now = datetime.utcnow()
    active_civic_events = await civic_events_mock_collection.find({
        "start_time": {"$lte": now},
        "end_time": {"$gte": now}
    }).to_list(length=100)
    
    for event in active_civic_events:
        await create_claims_for_trigger("Civic Disruption", event["city"], event["zone"], 0.70)
        trigger_status.append(f"Civic Disruption fired for {event['city']} - {event['zone']}")

    # Skip real API if no key
    if not OPENWEATHERMAP_API_KEY or OPENWEATHERMAP_API_KEY == "your_api_key_here":
        print("Skipping OWM checks due to missing api key.")
        return {"status": "Triggers evaluated (Mock only).", "logs": trigger_status}

    for city, coords in CITIES.items():
        try:
            async with httpx.AsyncClient() as client:
                # 1. Weather info
                weather_resp = await client.get(
                    f"https://api.openweathermap.org/data/2.5/weather?lat={coords['lat']}&lon={coords['lon']}&appid={OPENWEATHERMAP_API_KEY}&units=metric"
                )
                if weather_resp.status_code == 200:
                    data = weather_resp.json()
                    temp = data.get("main", {}).get("temp", 0)
                    rain_1h = data.get("rain", {}).get("1h", 0)
                    
                    # Trigger 1: Heavy Rain
                    if rain_1h > 35:
                        await create_claims_for_trigger("Heavy Rainfall", city, "All", 0.60)
                        trigger_status.append(f"Heavy Rainfall triggered for {city}")
                        
                    # Trigger 2: Extreme Heat
                    if temp > 44:
                        await create_claims_for_trigger("Extreme Heat", city, "All", 0.40)
                        trigger_status.append(f"Extreme Heat triggered for {city}")
                
                # 3. AQI
                aqi_resp = await client.get(
                    f"http://api.openweathermap.org/data/2.5/air_pollution?lat={coords['lat']}&lon={coords['lon']}&appid={OPENWEATHERMAP_API_KEY}"
                )
                if aqi_resp.status_code == 200:
                    aqi_data = aqi_resp.json()
                    aqi = aqi_data["list"][0]["main"]["aqi"]
                    # Trigger 3: Severe Pollution
                    if aqi == 5:
                        await create_claims_for_trigger("Severe Air Pollution", city, "All", 0.50)
                        trigger_status.append(f"Severe Pollution triggered for {city}")
                        
                # 4. Severe Weather Alert (One Call API requires paid sub, mocking check based on normal weather description)
                # To simulate, if weather description has 'flood', 'cyclone', 'thunderstorm'
                if weather_resp.status_code == 200:
                    desc = data.get("weather", [{}])[0].get("description", "").lower()
                    if "flood" in desc or "cyclone" in desc or "thunderstorm" in desc or "red alert" in desc:
                        await create_claims_for_trigger("Severe Weather Alert", city, "All", 0.80, is_capped=True)
                        trigger_status.append(f"Severe Weather Alert triggered for {city}")

        except Exception as e:
            print(f"Error fetching API for {city}: {e}")

    return {"status": "Triggers evaluated.", "logs": trigger_status}
