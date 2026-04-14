import httpx
import asyncio
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api"

async def run_integration_test():
    async with httpx.AsyncClient() as client:
        # 1. Register a test user
        phone = "8899776655"
        reg_payload = {
            "step1": {"full_name": "Integration Tester", "phone": phone, "aadhaar": "123412341234", "city": "Mumbai", "zone": "Zone 1"},
            "step2": {"platform": "Zomato", "weekly_earnings": 5000, "hours_per_day": 8, "days_per_week": 6, "experience_years": 2},
            "step3": {"upi_id": "testintegration@upi", "pin": "1234"}
        }
        print("Registering user...")
        resp = await client.post(f"{BASE_URL}/auth/register", json=reg_payload)
        if resp.status_code == 400 and "already" in resp.text:
            print("User already exists, logging in...")
            resp = await client.post(f"{BASE_URL}/auth/login", json={"phone": phone, "pin": "1234"})
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Add a mock civic event
        print("Adding mock civic event...")
        now = datetime.utcnow()
        event_payload = {
            "city": "Mumbai",
            "zone": "Zone 1",
            "event_name": "Test Public Protest",
            "start_time": (now - timedelta(hours=1)).isoformat(),
            "end_time": (now + timedelta(hours=1)).isoformat(),
            "created_by": "automation_tester"
        }
        await client.post(f"{BASE_URL}/mock/civic-events/", json=event_payload)
        
        # 3. Activate the policy
        print("Activating policy...")
        await client.post(f"{BASE_URL}/policy/toggle", headers=headers)
        
        # 4. Run all triggers
        print("Running triggers...")
        trigger_resp = await client.post(f"{BASE_URL}/triggers/run-all")
        print(f"Trigger logs: {trigger_resp.json().get('logs')}")
        
        # 5. Check claims
        print("Checking claims...")
        # Wait for potential background task
        await asyncio.sleep(2)
        claims_resp = await client.get(f"{BASE_URL}/claims/my-claims", headers=headers)
        claims = claims_resp.json()
        print(f"Total claims found: {len(claims)}")
        for c in claims:
            print(f"- Claim: {c['event_name']}, Status: {c['status']}, Payout: {c['payout_amount']}")

        # 6. Test Exclusion
        print("\nAdding EXCLUDED event (Terrorism)...")
        event_excluded = {
            "city": "Mumbai",
            "zone": "Zone 1",
            "event_name": "Simulated Terrorism Event",
            "start_time": (now - timedelta(hours=1)).isoformat(),
            "end_time": (now + timedelta(hours=1)).isoformat(),
            "created_by": "automation_tester"
        }
        await client.post(f"{BASE_URL}/mock/civic-events/", json=event_excluded)
        
        print("Running triggers again...")
        trigger_resp = await client.post(f"{BASE_URL}/triggers/run-all")
        print(f"Trigger logs: {trigger_resp.json().get('logs')}")
        
        print("Checking claims for exclusion...")
        await asyncio.sleep(2)
        claims_resp = await client.get(f"{BASE_URL}/claims/my-claims", headers=headers)
        claims = claims_resp.json()
        print(f"Total claims found: {len(claims)}")
        for c in claims:
            if "Terrorism" in c["event_name"]:
                print(f"- Excluded Claim: {c['event_name']}, Status: {c['status']} (Expected Flagged), Payout: {c['payout_amount']}")

if __name__ == "__main__":
    asyncio.run(run_integration_test())
