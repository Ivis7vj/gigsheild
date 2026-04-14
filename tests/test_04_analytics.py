import pytest
import httpx
import logging

logger = logging.getLogger(__name__)

@pytest.mark.asyncio
async def test_01_worker_analytics(base_url, shared_data):
    logger.info("Verifying worker analytics endpoint...")
    token = shared_data.get("access_token")
    assert token, "Missing token"
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{base_url}/api/analytics/worker", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "total_premium" in data
        assert "total_payout" in data
        assert "risk_trends" in data
        assert isinstance(data["risk_trends"], list)
        logger.info("Worker analytics fully verified.")

@pytest.mark.asyncio
async def test_02_admin_analytics(base_url):
    logger.info("Verifying admin analytics dashboard...")
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{base_url}/api/analytics/admin")
        assert res.status_code == 200
        data = res.json()
        assert "total_policies" in data
        assert "fraud_pct" in data
        assert "donut_chart" in data
        assert isinstance(data["donut_chart"], list)
        logger.info("Admin analytics fully verified.")

@pytest.mark.asyncio
async def test_03_admin_data_lists(base_url):
    logger.info("Verifying admin comprehensive tables...")
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{base_url}/api/admin/workers")
        assert res.status_code == 200
        workers = res.json()
        assert isinstance(workers, list)
        
        res_claims = await client.get(f"{base_url}/api/admin/claims")
        assert res_claims.status_code == 200
        claims = res_claims.json()
        assert isinstance(claims, list)
        logger.info(f"Verified {len(workers)} workers and {len(claims)} claims tracked.")
