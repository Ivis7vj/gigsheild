import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URL)

database = client["gigshield"]

# Collections
workers_collection = database["workers"]
policies_collection = database["policies"]
claims_collection = database["claims"]
disruption_events_collection = database["disruption_events"]
civic_events_mock_collection = database["civic_events_mock"]
premium_history_collection = database["premium_history"]
ai_agent_logs_collection = database["ai_agent_logs"]

# Setup Indexes (useful for queries later)
async def create_indexes():
    await workers_collection.create_index("phone", unique=True)
    await workers_collection.create_index("worker_id", unique=True)
    await policies_collection.create_index("worker_id")
    await claims_collection.create_index("worker_id")
    await ai_agent_logs_collection.create_index("created_at")
    await ai_agent_logs_collection.create_index("context_worker_id")
