from fastapi import APIRouter, Query
from app.services.nppes_api import fetch_physicians_near

router = APIRouter()

@router.get("/")
def get_physicians(
    state: str = Query(..., description="US state code, e.g. TX"),
    specialty: str | None = Query(None),
    limit: int = 10
):
    return fetch_physicians_near(state=state, specialty=specialty, limit=limit)