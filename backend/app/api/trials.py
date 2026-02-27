from fastapi import APIRouter, Query
from app.services.clinicaltrials_api import fetch_trials
from app.services.nppes_api import fetch_physicians_near
from geopy.distance import geodesic
import asyncio

router = APIRouter()


def filter_physicians_by_distance(trial_coords: dict, physicians: list, max_km: float = 50):
    trial_lat = trial_coords.get("lat")
    trial_lon = trial_coords.get("lon")

    if trial_lat is None or trial_lon is None:
        return []

    trial_point = (trial_lat, trial_lon)
    filtered = []

    for doc in physicians:
        if doc.get("lat") is not None and doc.get("lon") is not None:
            dist = geodesic(trial_point, (doc["lat"], doc["lon"])).km
            if dist <= max_km:
                filtered.append({**doc, "distance_km": round(dist, 2)})

    return filtered


@router.get("/")
async def get_trials_with_physicians(
    condition: str = Query(...),
    city: str = Query(""),
    state: str = Query(""),
    specialty: str | None = Query(None),
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    max_distance_km: float = Query(50.0, ge=0),
):
    # Build combined location string e.g. "Dallas, TX" or just "TX"
    location = ", ".join(filter(None, [city.strip(), state.strip()]))

    loop = asyncio.get_running_loop()
    trials = await loop.run_in_executor(
        None, fetch_trials, condition, location, limit, offset
    )

    physicians = await fetch_physicians_near(city, state, specialty, 100)

    for trial in trials:
        locations = trial.get("locations", [])
        if locations:
            first_loc = locations[0]
            trial_coords = {
                "lat": first_loc.get("lat"),
                "lon": first_loc.get("lon"),
            }
            trial["physicians"] = filter_physicians_by_distance(
                trial_coords, physicians, max_distance_km
            )
        else:
            trial["physicians"] = []

    return {
        "condition": condition,
        "city": city,
        "state": state,
        "trials": trials,
        "pagination": {
            "limit": limit,
            "offset": offset,
            "total": len(trials),
        },
    }