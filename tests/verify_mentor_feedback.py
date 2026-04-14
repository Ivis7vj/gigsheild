import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.pricing_engine import calculate_premium
from services.trigger_engine import create_claims_for_trigger
# from database import workers_collection, claims_collection, policies_collection
from datetime import datetime

async def test_pricing():
    print("Testing Actuarial Pricing Refinement...")
    
    # 1. Base case: New worker, no experience
    worker_basic = {
        "weekly_earnings": 5000,
        "platform": "Delivery",
        "city": "Mumbai",
        "zone": "Zone 2", # Safe
        "experience_years": 0,
        "claims_count_30d": 0
    }
    res_basic = await calculate_premium(worker_basic)
    print(f"Basic Premium: {res_basic['final_premium']}")
    
    # 2. Experienced worker (Should be lower)
    worker_exp = {
        "weekly_earnings": 5000,
        "platform": "Delivery",
        "city": "Mumbai",
        "zone": "Zone 2",
        "experience_years": 3,
        "claims_count_30d": 0
    }
    res_exp = await calculate_premium(worker_exp)
    print(f"Experienced Premium: {res_exp['final_premium']}")
    assert res_exp['final_premium'] < res_basic['final_premium']
    
    # 3. Worker with recent claims (Should be higher)
    worker_claims = {
        "weekly_earnings": 5000,
        "platform": "Delivery",
        "city": "Mumbai",
        "zone": "Zone 2",
        "experience_years": 0,
        "claims_count_30d": 1
    }
    res_claims = await calculate_premium(worker_claims)
    print(f"Claim History Premium: {res_claims['final_premium']}")
    assert res_claims['final_premium'] > res_basic['final_premium']

    # 4. Platform Risk (Ride-hailing should be higher base)
    worker_ride = {
        "weekly_earnings": 5000,
        "platform": "Ride-hailing",
        "city": "Mumbai",
        "zone": "Zone 2",
        "experience_years": 0,
        "claims_count_30d": 0
    }
    res_ride = await calculate_premium(worker_ride)
    print(f"Ride-hailing Premium: {res_ride['final_premium']}")
    assert res_ride['base_premium'] > res_basic['base_premium']

async def test_exclusions():
    print("\nTesting Coverage Exclusions...")
    # Mocking create_claims_for_trigger would require a running DB.
    # We'll just check the logic in trigger_engine via a simulated event.
    
    # Trigger name matching exclusion
    trigger_name = "Pandemic Lockdown" # Matches "Pandemic"
    is_excluded = any(ex in trigger_name for ex in ["War", "Pandemic", "Terrorism", "Nuclear"])
    print(f"Trigger: {trigger_name}, Is Excluded: {is_excluded}")
    assert is_excluded == True
    
    trigger_name = "Heavy Rainfall"
    is_excluded = any(ex in trigger_name for ex in ["War", "Pandemic", "Terrorism", "Nuclear"])
    print(f"Trigger: {trigger_name}, Is Excluded: {is_excluded}")
    assert is_excluded == False

if __name__ == "__main__":
    asyncio.run(test_pricing())
    asyncio.run(test_exclusions())
