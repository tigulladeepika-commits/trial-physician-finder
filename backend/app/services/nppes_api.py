import requests
from app.services.mapquest_api import geocode_address

NPPES_BASE_URL = "https://npiregistry.cms.hhs.gov/api/"

def fetch_physicians_near(state: str, specialty: str | None = None, limit: int = 10):
    """
    Fetch physicians from NPPES API by state and optional specialty.
    Returns physicians with lat/lon for mapping and distance filtering.
    """
    params = {
        "state": state,
        "limit": limit,
        "version": "2.1"
    }

    if specialty:
        params["taxonomy_description"] = specialty

    response = requests.get(NPPES_BASE_URL, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    results = []

    for item in data.get("results", []):
        basic = item.get("basic", {})
        addresses = item.get("addresses", [])

        # Get the practice location address
        practice_address = next((a for a in addresses if a.get("address_purpose") == "LOCATION"), None)

        if practice_address:
            # Combine address components for geocoding
            full_address = f"{practice_address.get('address_1','')}, " \
                           f"{practice_address.get('city','')}, " \
                           f"{practice_address.get('state','')} {practice_address.get('postal_code','')}"
            # Get lat/lon from MapQuest
            geo = geocode_address(full_address)
            lat, lon = geo.get("lat"), geo.get("lon")
        else:
            lat, lon = None, None

        results.append({
            "npi": item.get("number"),
            "name": f"{basic.get('first_name', '')} {basic.get('last_name', '')}".strip(),
            "state": practice_address.get("state") if practice_address else None,
            "city": practice_address.get("city") if practice_address else None,
            "specialty": basic.get("credential"),
            "lat": lat,
            "lon": lon,
        })

    return results