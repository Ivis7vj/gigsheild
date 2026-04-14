from fastapi import APIRouter, HTTPException, Depends
from models import WorkerRegistration, LoginRequest, Token
from database import workers_collection, policies_collection
from auth_utils import get_password_hash, verify_password, create_access_token
import uuid
import random
from datetime import datetime
from services.pricing_engine import calculate_premium

router = APIRouter()

def determine_tier(earnings: float) -> str:
    if earnings < 3000:
        return "Basic"
    elif earnings <= 6000:
        return "Standard"
    else:
        return "Premium"

def get_payout_cap(tier: str) -> float:
    if tier == "Basic": return 500.0
    if tier == "Standard": return 800.0
    return 1200.0

@router.post("/register", response_model=Token)
async def register(req: WorkerRegistration):
    # Check if phone exists
    existing = await workers_collection.find_one({"phone": req.step1.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Phone already registered")
        
    worker_id = f"WID-{str(uuid.uuid4())[:8].upper()}"
    hashed_pin = get_password_hash(req.step3.pin)
    
    tier = determine_tier(req.step2.weekly_earnings)
    
    # Calculate initial risk score locally
    risk_score = random.uniform(20.0, 80.0) # Mock computation
    
    worker_doc = {
        "worker_id": worker_id,
        "full_name": req.step1.full_name,
        "phone": req.step1.phone,
        "aadhaar_masked": "XXXX-XXXX-" + req.step1.aadhaar[-4:],
        "city": req.step1.city,
        "zone": req.step1.zone,
        "pincode": req.step1.pincode,  # Hyper-local pincode for precise location tracking
        "platform": req.step2.platform,
        "weekly_earnings": req.step2.weekly_earnings,
        "hours_per_day": req.step2.hours_per_day,
        "days_per_week": req.step2.days_per_week,
        "experience_years": req.step2.experience_years,
        "claims_count_30d": 0,
        "upi_id": req.step3.upi_id,
        "pin_hash": hashed_pin,
        "tier": tier,
        "risk_score": round(risk_score, 1),
        "created_at": datetime.utcnow()
    }
    
    await workers_collection.insert_one(worker_doc)
    
    # Pre-calculate first week premium
    premium_data = await calculate_premium(worker_doc)
    
    policy_doc = {
        "worker_id": worker_id,
        "week_start": datetime.utcnow(),
        "week_end": datetime.utcnow(), # To be properly adjusted by scheduler / activation
        "premium": premium_data["final_premium"],
        "tier": tier,
        "status": "Inactive",
        "payout_cap": get_payout_cap(tier)
    }
    await policies_collection.insert_one(policy_doc)
    
    access_token = create_access_token(data={"sub": worker_id})
    return {"access_token": access_token, "token_type": "bearer", "worker_id": worker_id}

@router.post("/login", response_model=Token)
async def login(req: LoginRequest):
    worker = await workers_collection.find_one({"phone": req.phone})
    if not worker or not verify_password(req.pin, worker["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid phone or PIN")
        
    access_token = create_access_token(data={"sub": worker["worker_id"]})
    return {"access_token": access_token, "token_type": "bearer", "worker_id": worker["worker_id"]}
