import pytest
import httpx
import logging

logger = logging.getLogger(__name__)

# Shared details for registration
TEST_PHONE = "9876543210"
TEST_PIN = "5678"

@pytest.mark.asyncio
async def test_01_register_worker(base_url, shared_data):
    logger.info("Executing registration test flow...")
    payload = {
        "step1": {
            "full_name": "Test User Automator",
            "phone": TEST_PHONE,
            "aadhaar": "123456781234",
            "city": "Mumbai",
            "zone": "Zone 1"
        },
        "step2": {
            "platform": "Zomato",
            "weekly_earnings": 4500,
            "hours_per_day": 8,
            "days_per_week": 6
        },
        "step3": {
            "upi_id": "test@upi",
            "pin": TEST_PIN
        }
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{base_url}/api/auth/register", json=payload)
        
        # If it returns 400 with "Phone already registered" from previous runs, we capture the token anyway via login
        if response.status_code == 400 and "already registered" in response.text:
            logger.info("Test user already exists. Progressing...")
            pass
        else:
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert "worker_id" in data
            logger.info(f"Successfully registered. ID: {data['worker_id']}")

@pytest.mark.asyncio
async def test_02_login_worker(base_url, shared_data):
    logger.info("Executing login test flow...")
    payload = {
        "phone": TEST_PHONE,
        "pin": TEST_PIN
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{base_url}/api/auth/login", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        shared_data["access_token"] = data["access_token"]
        shared_data["worker_id"] = data["worker_id"]
        logger.info("Successfully logged in.")

@pytest.mark.asyncio
async def test_03_get_profile(base_url, shared_data):
    token = shared_data.get("access_token")
    assert token, "Token must be available from login test"
    
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{base_url}/api/workers/profile", headers=headers)
        assert response.status_code == 200
        profile = response.json()
        assert profile["phone"] == TEST_PHONE
        assert profile["tier"] == "Standard" # 4500 earnings = Standard Tier
        logger.info("Successfully fetched and validated profile.")
