import os
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LogisticRegression


MODELS_DIR = Path(__file__).resolve().parents[1] / "ml_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def train_risk_model():
    rng = np.random.default_rng(42)
    x = rng.uniform(
        low=[18, 1, 0, 0, 1500, 20],
        high=[60, 25, 100, 10, 15000, 100],
        size=(800, 6),
    )
    score = (
        0.15 * (x[:, 0] - 18)
        + 1.4 * x[:, 1]
        + 0.45 * x[:, 2]
        + 6.5 * x[:, 3]
        + 0.0025 * x[:, 4]
        + 0.3 * (100 - x[:, 5])
    )
    y = np.clip(score, 0, 100)
    model = RandomForestRegressor(n_estimators=160, random_state=42)
    model.fit(x, y)
    joblib.dump(model, MODELS_DIR / "risk_score_model.pkl")


def train_fraud_model():
    rng = np.random.default_rng(7)
    x = rng.uniform(low=[0, 0, 0, 0, 0], high=[100, 1, 1, 1, 1], size=(1200, 5))
    weighted = (
        0.55 * x[:, 0]
        + 26 * x[:, 1]
        + 12 * x[:, 2]
        + 8 * x[:, 3]
        + 20 * x[:, 4]
    )
    y = (weighted > 60).astype(int)
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(x, y)
    joblib.dump(model, MODELS_DIR / "fraud_detection_model.pkl")


def train_approval_model():
    rng = np.random.default_rng(21)
    x = rng.uniform(low=[0, 100, 0, 0], high=[100, 15000, 1, 1], size=(1000, 4))
    linear = 0.06 * x[:, 0] - 0.00028 * x[:, 1] + 2.0 * x[:, 2] + 1.6 * x[:, 3] - 2.4
    p = 1 / (1 + np.exp(-linear))
    y = (p > 0.52).astype(int)
    model = LogisticRegression(max_iter=400)
    model.fit(x, y)
    joblib.dump(model, MODELS_DIR / "claim_approval_predictor.pkl")


if __name__ == "__main__":
    train_risk_model()
    train_fraud_model()
    train_approval_model()
    print(f"Saved model artifacts in {MODELS_DIR}")
