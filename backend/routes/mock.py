from fastapi import APIRouter
from models import CivicEventMock
from database import civic_events_mock_collection
from typing import List

router = APIRouter()

@router.get("/", response_model=List[CivicEventMock])
async def list_mock_events():
    events = await civic_events_mock_collection.find({}).to_list(100)
    for e in events:
        e.pop("_id", None)
    return events

@router.post("/")
async def add_mock_event(event: CivicEventMock):
    doc = event.dict()
    await civic_events_mock_collection.insert_one(doc)
    doc.pop("_id", None)
    return doc
