from pathlib import Path
from typing import List, Tuple
import json
import time

import numpy as np

def _debug_log(hypothesis_id: str, message: str, data: dict, run_id: str = "backend-import-check"):
    # #region agent log
    try:
        payload = {
            "sessionId": "f473cf",
            "runId": run_id,
            "hypothesisId": hypothesis_id,
            "location": "backend/services/ml_service.py",
            "message": message,
            "data": data,
            "timestamp": int(time.time() * 1000),
        }
        with open(Path(__file__).resolve().parents[2] / "debug-f473cf.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception:
        pass
    # #endregion

try:
    import joblib
    # #region agent log
    _debug_log("H1", "joblib import succeeded", {"import_ok": True})
    # #endregion
except Exception as exc:
    # #region agent log
    _debug_log("H1", "joblib import failed", {"import_ok": False, "error_type": type(exc).__name__, "error": str(exc)})
    # #endregion
    raise


MODELS_DIR = Path(__file__).resolve().parents[1] / "ml_models"
RISK_MODEL_PATH = MODELS_DIR / "risk_score_model.pkl"
FRAUD_MODEL_PATH = MODELS_DIR / "fraud_detection_model.pkl"
APPROVAL_MODEL_PATH = MODELS_DIR / "claim_approval_predictor.pkl"

RISK_FEATURES = [
    "worker_age",
    "delivery_distance",
    "weather_risk_score",
    "claim_frequency_past_30_days",
    "average_earnings_per_week",
    "zone_safety_rating",
]
FRAUD_FEATURES = [
    "gps_anomaly_score",
    "weather_verification_mismatch",
    "claim_regularity_flag",
    "payout_amount_anomaly",
    "claim_frequency_burst",
]
APPROVAL_FEATURES = [
    "worker_trust_score",
    "claim_amount",
    "weather_verification_status",
    "gps_validation_status",
]

_models = {"risk": None, "fraud": None, "approval": None}


def _ensure_models():
    if _models["risk"] is not None:
        return
    if not (RISK_MODEL_PATH.exists() and FRAUD_MODEL_PATH.exists() and APPROVAL_MODEL_PATH.exists()):
        raise RuntimeError("ML model artifacts are missing. Run backend/scripts/train_models.py")
    _models["risk"] = joblib.load(RISK_MODEL_PATH)
    _models["fraud"] = joblib.load(FRAUD_MODEL_PATH)
    _models["approval"] = joblib.load(APPROVAL_MODEL_PATH)


def _top_features(model, features: List[str], vector: np.ndarray) -> List[str]:
    if hasattr(model, "feature_importances_"):
        weights = model.feature_importances_
    elif hasattr(model, "coef_"):
        weights = np.abs(model.coef_[0])
    else:
        weights = np.ones(len(features))
    impacts: List[Tuple[str, float]] = []
    for idx, name in enumerate(features):
        impacts.append((name, float(weights[idx]) * float(vector[idx])))
    impacts.sort(key=lambda x: abs(x[1]), reverse=True)
    return [f"{name}: impact {impact:.2f}" for name, impact in impacts[:3]]


def calculate_risk_score(payload: dict) -> dict:
    _ensure_models()
    vector = np.array([payload.get(f, 0) for f in RISK_FEATURES], dtype=float)
    prediction = float(_models["risk"].predict([vector])[0])
    prediction = max(0.0, min(100.0, prediction))
    confidence = max(0.5, min(0.99, 1 - np.std(vector / 100)))
    return {
        "score": round(prediction, 2),
        "confidence": round(float(confidence), 2),
        "reasoning": _top_features(_models["risk"], RISK_FEATURES, vector),
        "risk_level": "high" if prediction >= 70 else "medium" if prediction >= 40 else "low",
    }


def detect_fraud(payload: dict) -> dict:
    _ensure_models()
    vector = np.array([payload.get(f, 0) for f in FRAUD_FEATURES], dtype=float)
    model = _models["fraud"]
    fraud_probability = float(model.predict_proba([vector])[0][1]) * 100
    confidence = float(np.max(model.predict_proba([vector])[0]))
    return {
        "score": round(fraud_probability, 2),
        "confidence": round(confidence, 2),
        "reasoning": _top_features(model, FRAUD_FEATURES, vector),
        "risk_level": "high" if fraud_probability >= 75 else "medium" if fraud_probability >= 35 else "low",
    }


def predict_approval(payload: dict) -> dict:
    _ensure_models()
    vector = np.array([payload.get(f, 0) for f in APPROVAL_FEATURES], dtype=float)
    model = _models["approval"]
    approval_probability = float(model.predict_proba([vector])[0][1]) * 100
    confidence = float(np.max(model.predict_proba([vector])[0]))
    return {
        "score": round(approval_probability, 2),
        "confidence": round(confidence, 2),
        "reasoning": _top_features(model, APPROVAL_FEATURES, vector),
        "risk_level": "high_approval" if approval_probability >= 75 else "uncertain" if approval_probability >= 40 else "low_approval",
    }
