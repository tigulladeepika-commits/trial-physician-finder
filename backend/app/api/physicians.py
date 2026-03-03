from fastapi import APIRouter, Query
from typing import Optional
from app.services.nppes_api import fetch_physicians_accurate

router = APIRouter()

@router.get("/")
async def get_physicians(
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    condition: Optional[str] = Query(None),
    specialty: Optional[str] = Query(None),
):
    """
    ✅ NEW: Get physicians with 100% ACCURATE filtering
    
    All filters use AND logic (must match ALL filters applied)
    - city: Physician's practice city (case-insensitive substring match)
    - state: Physician's practice state (case-insensitive match)
    - condition: Maps to specialty taxonomy codes
    - specialty: Filter by specific specialty description
    """
    physicians = await fetch_physicians_accurate(
        city=city,
        state=state,
        condition=condition,
        specialty=specialty,
    )
    return {
        "filters": {
            "city": city,
            "state": state,
            "condition": condition,
            "specialty": specialty,
        },
        "count": len(physicians),
        "results": physicians
    }