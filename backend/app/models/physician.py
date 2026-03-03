from fastapi import APIRouter, Query
from typing import Optional

# Use relative imports to avoid module resolution issues regardless of
# how/where the app is launched (uvicorn app.main, python -m app, etc.)
from app.services.nppes_api import fetch_physicians_near

router = APIRouter()


@router.get("/")
async def get_physicians(
    city: Optional[str] = Query(None, description="City to search in"),
    state: Optional[str] = Query(None, description="State (full name or abbreviation)"),
    condition: Optional[str] = Query(None, description="Medical condition — mapped to specialty internally"),
    specialty: Optional[str] = Query(None, description="Explicit specialty filter (overrides condition mapping)"),
    radius: Optional[int] = Query(None, ge=0, le=1000, description="Search radius in km"),
    limit: Optional[int] = Query(10, ge=1, le=50, description="Max number of results"),
):
    physicians = await fetch_physicians_near(
        city=city,
        state=state,
        condition=condition,
        specialty=specialty,
        radius=radius,
        limit=limit,
    )
    return {"count": len(physicians), "results": physicians}