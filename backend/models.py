from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

# --- Constants ---
STANDARD_EXCLUSIONS = [
    "War and Civil Unrest",
    "Pandemic Outbreaks",
    "Acts of Terrorism",
    "Nuclear Hazards",
    "Pre-existing intentional damage"
]

# --- Auth Models ---
class WorkerRegisterStep1(BaseModel):
    full_name: str
    phone: str
    aadhaar: str
    city: str
    zone: str
    pincode: str  # 6-digit Indian postal code for hyper-local granularity

class WorkerRegisterStep2(BaseModel):
    platform: str
    weekly_earnings: float
    hours_per_day: float
    days_per_week: float
    experience_years: float = 0 # Added for actuarial refinement

class WorkerRegisterStep3(BaseModel):
    upi_id: str
    pin: str

class WorkerRegistration(BaseModel):
    step1: WorkerRegisterStep1
    step2: WorkerRegisterStep2
    step3: WorkerRegisterStep3

class LoginRequest(BaseModel):
    phone: str
    pin: str


class MLRiskRequest(BaseModel):
    worker_age: float = 30
    delivery_distance: float = 6
    weather_risk_score: float = 30
    claim_frequency_past_30_days: float = 0
    average_earnings_per_week: float = 4500
    zone_safety_rating: float = 70
    pincode: Optional[str] = None


class MLFraudRequest(BaseModel):
    gps_anomaly_score: float
    weather_verification_mismatch: float
    claim_regularity_flag: float
    payout_amount_anomaly: float
    claim_frequency_burst: float


class MLApprovalRequest(BaseModel):
    worker_trust_score: float
    claim_amount: float
    weather_verification_status: float
    gps_validation_status: float


class MLResponse(BaseModel):
    score: float
    confidence: float
    reasoning: List[str]
    risk_level: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    worker_id: str

# --- Worker Models ---
class WorkerProfile(BaseModel):
    worker_id: str
    full_name: str
    phone: str
    aadhaar_masked: str
    city: str
    zone: str
    pincode: str  # 6-digit Indian postal code for hyper-local granularity
    platform: str
    weekly_earnings: float
    hours_per_day: float
    days_per_week: float
    upi_id: str
    tier: str # Basic, Standard, Premium
    risk_score: float # Computed during registration
    experience_years: float = 0 # Years of gig work experience
    claims_count_30d: int = 0 # Claims in last 30 days for actuarial pricing
    created_at: datetime

# --- Policy Models ---
class Policy(BaseModel):
    worker_id: str
    week_start: datetime
    week_end: datetime
    premium: float
    tier: str
    status: str # Active, Inactive
    payout_cap: float
    exclusions: List[str] = Field(default=STANDARD_EXCLUSIONS)

# --- Claim Models ---
class Claim(BaseModel):
    claim_id: str
    worker_id: str
    trigger_type: str
    event_name: str
    triggered_at: datetime
    payout_amount: float
    fraud_score: int
    fraud_factors: List[str]
    status: str # Initiated, Processing, Paid, Flagged, Review
    upi_id: str
    # New fraud detection fields
    gps_lat: float = None
    gps_lon: float = None
    gps_fraud_score: int = 0
    weather_verification_result: str = None  # VERIFIED, MISMATCH, UNVERIFIABLE
    behavioral_risk: str = None  # LOW, MEDIUM, HIGH
    payout_status: str = None  # INITIATED, PROCESSING, COMPLETED, FAILED
    payout_transaction_id: str = None
    payout_utr: str = None  # Unique Transaction Reference for UPI payouts
    payout_time: datetime = None
    gateway_response: dict = None
    ml_fraud_risk_score: float = 0
    ml_fraud_confidence: float = 0
    ml_fraud_reasoning: List[str] = []
    ml_approval_probability: float = 0
    ml_approval_reasoning: List[str] = []
    requires_manual_review: bool = False

# --- Missed Disruption Models ---
class MissedDisruptionReport(BaseModel):
    date: str
    description: str
    trigger_type: str

# --- Trigger Event Models ---
class DisruptionEvent(BaseModel):
    trigger_name: str
    city: str
    zone: str
    timestamp: datetime
    workers_affected: int
    total_payout: float

class CivicEventMock(BaseModel):
    city: str
    zone: str
    event_name: str
    start_time: datetime
    end_time: datetime
    created_by: str

class PremiumFactor(BaseModel):
    name: str
    impact: float
    type: str # addition, subtraction

class PremiumHistory(BaseModel):
    worker_id: str
    week_start: datetime
    base_premium: float
    final_premium: float
    factors: List[PremiumFactor]
