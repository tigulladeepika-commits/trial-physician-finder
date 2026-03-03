from fastapi import APIRouter, Query
from app.services.clinicaltrials_api import fetch_trials_accurate
import asyncio

router = APIRouter()


@router.get("/")
async def get_trials(
    condition: str = Query(""),
    city: str = Query(""),
    state: str = Query(""),
    specialty: str = Query(""),
    status: str = Query(""),
    phase: str = Query(""),
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
):
    """
    Get clinical trials with 100% accurate filtering
    
    All filters use AND logic (must match ALL filters applied)
    """
    
    # Build filters dict - only include non-empty filters
    filters = {}
    
    if condition.strip():
        filters['condition'] = condition.strip()
    
    if city.strip():
        filters['city'] = city.strip()
    
    if state.strip():
        filters['state'] = state.strip()
    
    if specialty.strip():
        filters['specialty'] = specialty.strip()
    
    if status.strip():
        filters['status'] = status.strip()
    
    if phase.strip():
        filters['phase'] = phase.strip()

    loop = asyncio.get_running_loop()

    # Call service with all filters
    trials, total_count = await loop.run_in_executor(
        None, fetch_trials_accurate, filters, limit, offset
    )

    return {
        "filters": {
            "condition": condition,
            "city": city,
            "state": state,
            "specialty": specialty,
            "status": status,
            "phase": phase,
        },
        "trials": trials,
        "pagination": {
            "limit": limit,
            "offset": offset,
            "total": total_count,
            "page": (offset // limit) + 1 if limit > 0 else 1,
            "has_more": (offset + limit) < total_count,
        },
    }