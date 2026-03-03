import httpx
import os
import logging

logger = logging.getLogger(__name__)

GEOAPIFY_API_KEY = os.getenv("GEOAPIFY_API_KEY")
GEOCODE_URL = "https://api.geoapify.com/v1/geocode/search"

async def geocode_address(address: str):
    """Return latitude and longitude for a given address using Geoapify API."""
    if not GEOAPIFY_API_KEY:
        logger.warning("GEOAPIFY_API_KEY is not set — skipping geocoding.")
        return {"lat": None, "lon": None}

    params = {
        "text": address,
        "limit": 1,
        "filter": "countrycode:us",
        "apiKey": GEOAPIFY_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(GEOCODE_URL, params=params)
            r.raise_for_status()
            data = r.json()

            features = data.get("features", [])
            if not features:
                logger.warning(f"Geoapify returned no results for address: {address}")
                return {"lat": None, "lon": None}

            # Geoapify returns GeoJSON: coordinates are [longitude, latitude]
            coords = features[0]["geometry"]["coordinates"]
            lon, lat = coords[0], coords[1]

            return {"lat": lat, "lon": lon}

    except (KeyError, IndexError) as e:
        logger.warning(f"Unexpected Geoapify response structure for '{address}': {e}")
        return {"lat": None, "lon": None}
    except httpx.HTTPStatusError as e:
        logger.error(f"Geoapify HTTP error for '{address}': {e.response.status_code}")
        return {"lat": None, "lon": None}
    except httpx.RequestError as e:
        logger.error(f"Geoapify request failed for '{address}': {e}")
        return {"lat": None, "lon": None}