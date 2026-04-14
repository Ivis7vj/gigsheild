from fastapi import APIRouter, HTTPException

from models import MLRiskRequest, MLFraudRequest, MLApprovalRequest
from services.ml_service import calculate_risk_score, detect_fraud, predict_approval


router = APIRouter()


@router.post("/calculate-risk-score")
async def calculate_risk(payload: MLRiskRequest):
    try:
        return calculate_risk_score(payload.model_dump())
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/fraud-detection")
async def fraud_detection(payload: MLFraudRequest):
    try:
        return detect_fraud(payload.model_dump())
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/predict-approval")
async def predict_claim_approval(payload: MLApprovalRequest):
    try:
        return predict_approval(payload.model_dump())
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
