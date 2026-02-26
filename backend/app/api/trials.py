from fastapi import APIRouter, Query
from app.services.clinicaltrials_api import fetch_trials
from app.services.nppes_api import fetch_physicians_near
from geopy.distance import geodesic
import asyncio

router = APIRouter()

def filter_physicians_by_distance(trial_coords: dict, physicians: list, max_km: float = 50):
    """Keep only physicians within max_km of trial site."""
    filtered = []
    trial_point = (trial_coords.get("lat"), trial_coords.get("lon"))
    for doc in physicians:
        if doc.get("lat") is not None and doc.get("lon") is not None:
            dist = geodesic(trial_point, (doc["lat"], doc["lon"])).km
            if dist <= max_km:
                filtered.append(doc)
    return filtered

@router.get("/")
async def get_trials_with_physicians(
    condition: str = Query(...),
    state: str = Query(...),
    specialty: str | None = Query(None),
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    max_distance_km: float = Query(50.0, ge=0),
):
    """
    Fetch trials and nearby physicians, merge them per trial, and apply distance filtering.
    Supports pagination via `limit` and `offset`.
    """

    # 1️⃣ Fetch trials asynchronously
    trials = await fetch_trials(condition, state, limit=limit, offset=offset)

    # 2️⃣ Fetch physicians asynchronously (run in executor to avoid blocking)
    loop = asyncio.get_running_loop()
    physicians = await loop.run_in_executor(None, fetch_physicians_near, state, specialty, 100)

    # 3️⃣ Merge and filter physicians per trial
    for trial in trials:
        # get first trial site location (geoPoint)
        locations = trial.get("contactsLocationsModule", {}).get("locations", [])
        if locations:
            trial_coords = locations[0].get("geoPoint", {})
            trial["physicians"] = filter_physicians_by_distance(trial_coords, physicians, max_distance_km)
        else:
            trial["physicians"] = []

    return {
        "condition": condition,
        "state": state,
        "trials": trials,
        "pagination": {
            "limit": limit,
            "offset": offset,
            "total": len(trials),
        }
    }