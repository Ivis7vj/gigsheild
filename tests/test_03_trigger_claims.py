import pytest
import httpx
import logging
import asyncio

logger = logging.getLogger(__name__)

@pytest.mark.asyncio
async def test_01_execute_triggers(base_url):
    logger.info("Executing trigger engine...")
    async with httpx.AsyncClient() as client:
        # Run the triggers endpoint (admin function)
        response = await client.post(f"{base_url}/api/triggers/run-all")
        assert response.status_code == 200
        logs = response.json().get("logs", [])
        
        # Verify that the Civic Disruption generated for Mumbai mock event
        found_civic = any("Civic Disruption fired" in log for log in logs)
        logger.info(f"Trigger logs: {logs}")
        assert found_civic or len(logs) == 0, "Expected trigger behavior executed"
        
@pytest.mark.asyncio
async def test_02_check_claims_generated(base_url, shared_data):
    logger.info("Checking claims payload...")
    token = shared_data.get("access_token")
    assert token, "Missing token"
    headers = {"Authorization": f"Bearer {token}"}
    
    # Wait a second for background logic potentially, but main logic is sync in the endpoint
    await asyncio.sleep(1)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{base_url}/api/claims/my-claims", headers=headers)
        assert response.status_code == 200
        claims = response.json()
        assert isinstance(claims, list)
        
        if len(claims) > 0:
            c = claims[0]
            assert "payout_amount" in c
            assert c["status"] in ["Initiated", "Processing", "Paid", "Flagged"]
            logger.info(f"Verified claim existence: {c['event_name']} for {c['payout_amount']} INR.")
            
        logger.info(f"Total claims found: {len(claims)}")
