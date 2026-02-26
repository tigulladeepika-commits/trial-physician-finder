import httpx
import logging
from app.services.mapquest_api import geocode_address

logger = logging.getLogger(__name__)

NPPES_BASE_URL = "https://npiregistry.cms.hhs.gov/api/"

async def fetch_physicians_near(city: str, state: str, specialty: str | None = None, limit: int = 10):
    """
    Fetch physicians from NPPES API by city, state and optional specialty.
    Returns physicians with lat/lon for mapping and distance filtering.
    """
    params = {
        "city": city,
        "state": state,
        "limit": limit,
        "version": "2.1"
    }

    if specialty:
        params["taxonomy_description"] = specialty

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(NPPES_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"NPPES HTTP error: {e.response.status_code}")
        return []
    except httpx.RequestError as e:
        logger.error(f"NPPES request failed: {e}")
        return []

    raw_results = data.get("results", [])
    logger.info(f"NPPES returned {len(raw_results)} results for city={city}, state={state}")

    results = []

    for item in raw_results:
        basic = item.get("basic", {})
        addresses = item.get("addresses", [])

        practice_address = next(
            (a for a in addresses if a.get("address_purpose") == "LOCATION"), None
        )

        if not practice_address:
            logger.debug(f"No practice address found for NPI {item.get('number')} — skipping.")
            continue

        full_address = (
            f"{practice_address.get('address_1', '')}, "
            f"{practice_address.get('city', '')}, "
            f"{practice_address.get('state', '')} "
            f"{practice_address.get('postal_code', '')}"
        )

        geo = await geocode_address(full_address)
        lat = geo.get("lat")
        lon = geo.get("lon")

        if lat is None or lon is None:
            logger.debug(f"Could not geocode address '{full_address}' — physician will have no coordinates.")

        results.append({
            "npi": item.get("number"),
            "name": f"{basic.get('first_name', '')} {basic.get('last_name', '')}".strip(),
            "city": practice_address.get("city"),
            "state": practice_address.get("state"),
            "address": practice_address.get("address_1"),
            "postal_code": practice_address.get("postal_code"),
            "specialty": basic.get("credential"),
            "lat": lat,
            "lon": lon,
        })

    logger.info(f"Returning {len(results)} physicians with valid addresses.")
    return results