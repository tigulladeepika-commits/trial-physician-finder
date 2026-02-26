import requests
import os

MAPQUEST_API_KEY = os.getenv("MAPQUEST_API_KEY")
GEOCODE_URL = "http://www.mapquestapi.com/geocoding/v1/address"

def geocode_address(address: str):
    """Return latitude and longitude for a given address using MapQuest API."""
    if not MAPQUEST_API_KEY:
        return {"lat": None, "lon": None}

    params = {
        "key": MAPQUEST_API_KEY,
        "location": address
    }

    try:
        r = requests.get(GEOCODE_URL, params=params, timeout=5)
        r.raise_for_status()
        data = r.json()
        loc = data["results"][0]["locations"][0]["latLng"]
        return {"lat": loc["lat"], "lon": loc["lng"]}
    except Exception:
        return {"lat": None, "lon": None}