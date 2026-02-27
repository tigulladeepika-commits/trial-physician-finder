# In trials.py, replace the import and filter function:

from app.utils.distance import haversine_distance

def filter_physicians_by_distance(trial_coords: dict, physicians: list, max_km: float = 50):
    trial_lat = trial_coords.get("lat")
    trial_lon = trial_coords.get("lon")

    if trial_lat is None or trial_lon is None:
        return []

    filtered = []
    for doc in physicians:
        if doc.get("lat") is not None and doc.get("lon") is not None:
            dist = haversine_distance(trial_lat, trial_lon, doc["lat"], doc["lon"])
            if dist <= max_km:
                filtered.append({**doc, "distance_km": round(dist, 2)})

    return filtered