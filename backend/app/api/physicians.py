from fastapi import APIRouter, Query
from typing import Optional
from app.services.nppes_api import fetch_physicians_near

router = APIRouter()

@router.get("/")
async def get_physicians(
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    condition: Optional[str] = Query(None),  # replaces specialty — mapped internally
):
    physicians = await fetch_physicians_near(
        city=city,
        state=state,
        condition=condition,
    )
    return {"count": len(physicians), "results": physicians}