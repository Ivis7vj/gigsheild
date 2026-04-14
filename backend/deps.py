from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth_utils import verify_token
from database import workers_collection

security = HTTPBearer()

async def get_current_worker(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = verify_token(token)
        worker_id = payload.get("sub")
        if worker_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        worker = await workers_collection.find_one({"worker_id": worker_id})
        if worker is None:
            raise HTTPException(status_code=401, detail="User not found")
            
        return worker
    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
