import os
import uvicorn
import asyncio
import json
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request

from database import create_indexes
from services.scheduler import start_scheduler
from routes import auth, workers, policy, claims, triggers, analytics, admin, mock, ml, ai_agent
from services.payment_service import upi_router

app = FastAPI(title="GigShield API")

def _debug_log(hypothesis_id: str, message: str, data: dict, run_id: str = "dashboard-unreachable"):
    # #region agent log
    try:
        payload = {
            "sessionId": "f473cf",
            "runId": run_id,
            "hypothesisId": hypothesis_id,
            "location": "backend/main.py",
            "message": message,
            "data": data,
            "timestamp": int(time.time() * 1000),
        }
        with open("debug-f473cf.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception:
        pass
    # #endregion

# CORS (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def debug_request_middleware(request: Request, call_next):
    # #region agent log
    _debug_log("H5", "Backend request received", {"path": request.url.path, "method": request.method})
    # #endregion
    response = await call_next(request)
    return response

# ✅ Safe startup
@app.on_event("startup")
async def startup_event():
    try:
        print("🔄 Starting up...")

        # Run DB setup
        await create_indexes()
        print("✅ Database indexes created")

        # Run scheduler in background (non-blocking)
        loop = asyncio.get_event_loop()
        loop.create_task(run_scheduler())

        print("✅ Scheduler started")

    except Exception as e:
        print("❌ Startup failed:", str(e))


# ✅ Wrap scheduler so it doesn't block or crash app
async def run_scheduler():
    try:
        start_scheduler()
    except Exception as e:
        print("❌ Scheduler error:", str(e))


# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(workers.router, prefix="/api/workers", tags=["workers"])
app.include_router(policy.router, prefix="/api/policy", tags=["policy"])
app.include_router(claims.router, prefix="/api/claims", tags=["claims"])
app.include_router(triggers.router, prefix="/api/triggers", tags=["triggers"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(mock.router, prefix="/api/mock/civic-events", tags=["mock"])
app.include_router(upi_router, prefix="/api/payments/upi", tags=["payments"])
app.include_router(ml.router, prefix="/api/ml", tags=["ml"])
app.include_router(ai_agent.router, prefix="/api/ai-agent", tags=["ai-agent"])


@app.get("/")
def read_root():
    return {"message": "Welcome to GigShield API"}


# ✅ REQUIRED for Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)