from fastapi import APIRouter, Query
from app.services.nppes_api import fetch_physicians_near

router = APIRouter()

@router.get("/")
async def get_physicians(
    city: str = Query(...),
    state: str = Query(...),
    specialty: str = Query(...)
):
    physicians = await fetch_physicians_near(city, state, specialty)
    return {"count": len(physicians), "results": physicians}