from fastapi import APIRouter, Query
from app.services.clinicaltrials_api import fetch_trials
import asyncio

router = APIRouter()


@router.get("/")
async def get_trials(
    condition: str = Query(...),
    city: str = Query(""),
    state: str = Query(""),
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
):
    # Build combined location string e.g. "Dallas, TX" or just "TX"
    location = ", ".join(filter(None, [city.strip(), state.strip()]))

    loop = asyncio.get_running_loop()

    # ✅ fetch_trials now returns (results, total_count)
    trials, total_count = await loop.run_in_executor(
        None, fetch_trials, condition, location, limit, offset
    )

    return {
        "condition": condition,
        "city": city,
        "state": state,
        "trials": trials,
        "pagination": {
            "limit": limit,
            "offset": offset,
            # ✅ Real total from API, not just current page length
            "total": total_count,
            "page": (offset // limit) + 1 if limit > 0 else 1,
            "has_more": (offset + limit) < total_count,
        },
    }
