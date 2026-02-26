import httpx
import os
import logging

logger = logging.getLogger(__name__)

MAPQUEST_API_KEY = os.getenv("MAPQUEST_API_KEY")
GEOCODE_URL = "http://www.mapquestapi.com/geocoding/v1/address"

async def geocode_address(address: str):
    """Return latitude and longitude for a given address using MapQuest API."""
    if not MAPQUEST_API_KEY:
        logger.warning("MAPQUEST_API_KEY is not set — skipping geocoding.")
        return {"lat": None, "lon": None}

    params = {
        "key": MAPQUEST_API_KEY,
        "location": address
    }

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(GEOCODE_URL, params=params)
            r.raise_for_status()
            data = r.json()
            loc = data["results"][0]["locations"][0]["latLng"]

            # MapQuest returns 0,0 for unresolved addresses
            if loc["lat"] == 0.0 and loc["lng"] == 0.0:
                logger.warning(f"MapQuest could not geocode address: {address}")
                return {"lat": None, "lon": None}

            return {"lat": loc["lat"], "lon": loc["lng"]}

    except (KeyError, IndexError) as e:
        logger.warning(f"Unexpected MapQuest response structure for '{address}': {e}")
        return {"lat": None, "lon": None}
    except httpx.HTTPStatusError as e:
        logger.error(f"MapQuest HTTP error for '{address}': {e.response.status_code}")
        return {"lat": None, "lon": None}
    except httpx.RequestError as e:
        logger.error(f"MapQuest request failed for '{address}': {e}")
        return {"lat": None, "lon": None}