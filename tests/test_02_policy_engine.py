import pytest
import httpx
import logging

logger = logging.getLogger(__name__)

@pytest.mark.asyncio
async def test_01_get_current_policy(base_url, shared_data):
    logger.info("Executing get policy flow...")
    token = shared_data.get("access_token")
    assert token, "Missing token - ensure auth_flow ran first"
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{base_url}/api/policy/current", headers=headers)
        assert response.status_code == 200
        policy = response.json()
        assert policy["worker_id"] == shared_data["worker_id"]
        assert "premium" in policy
        assert policy["status"] in ["Active", "Inactive"]
        
        # Test premium limits logic
        assert policy["premium"] >= 49
        assert policy["premium"] <= 299
        logger.info(f"Verified policy logic. Premium is {policy['premium']} INR")

@pytest.mark.asyncio
async def test_02_toggle_policy_status(base_url, shared_data):
    logger.info("Executing toggle policy flow...")
    token = shared_data.get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient() as client:
        # First check current
        curr_res = await client.get(f"{base_url}/api/policy/current", headers=headers)
        initial_status = curr_res.json()["status"]
        
        # Toggle
        res = await client.post(f"{base_url}/api/policy/toggle", headers=headers)
        assert res.status_code == 200
        new_status = res.json()["status"]
        
        assert initial_status != new_status
        logger.info(f"Policy toggled successfully. {initial_status} -> {new_status}")
        
        # We need the policy to be 'Active' for claims tests. If it became Inactive, toggle it back
        if new_status == "Inactive":
            await client.post(f"{base_url}/api/policy/toggle", headers=headers)
            logger.info("Restored policy to Active for upcoming trigger tests.")
