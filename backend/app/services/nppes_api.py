import httpx
import logging
import asyncio
from app.services.mapquest_api import geocode_address

logger = logging.getLogger(__name__)

NPPES_BASE_URL = "https://npiregistry.cms.hhs.gov/api/"

STATE_ABBR = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
    "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
    "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
    "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
    "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV",
    "wisconsin": "WI", "wyoming": "WY", "district of columbia": "DC", "puerto rico": "PR",
}

CONDITION_TO_SPECIALTY = {
    # Endocrine
    "diabetes": "Endocrinology", "thyroid": "Endocrinology", "obesity": "Endocrinology",
    "metabolic": "Endocrinology", "hormonal": "Endocrinology",
    # Cardiovascular
    "heart": "Cardiology", "cardiac": "Cardiology", "cardiovascular": "Cardiology",
    "hypertension": "Cardiology", "arrhythmia": "Cardiology", "stroke": "Cardiology",
    "coronary": "Cardiology",
    # Oncology
    "cancer": "Oncology", "tumor": "Oncology", "lymphoma": "Oncology",
    "leukemia": "Oncology", "melanoma": "Oncology", "carcinoma": "Oncology",
    "neoplasm": "Oncology",
    # Neurology
    "alzheimer": "Neurology", "parkinson": "Neurology", "epilepsy": "Neurology",
    "seizure": "Neurology", "migraine": "Neurology", "cluster headache": "Neurology",
    "multiple sclerosis": "Neurology", "neuropathy": "Neurology", "dystonia": "Neurology",
    # Pulmonology
    "asthma": "Pulmonology", "copd": "Pulmonology", "lung": "Pulmonology",
    "respiratory": "Pulmonology",
    # Gastroenterology
    "crohn": "Gastroenterology", "colitis": "Gastroenterology", "ibd": "Gastroenterology",
    "hepatitis": "Gastroenterology", "liver": "Gastroenterology",
    "gastrointestinal": "Gastroenterology", "esophageal": "Gastroenterology",
    "colorectal": "Gastroenterology", "pancreatic": "Gastroenterology",
    "gallbladder": "Gastroenterology",
    # Rheumatology
    "arthritis": "Rheumatology", "lupus": "Rheumatology",
    "rheumatoid": "Rheumatology", "fibromyalgia": "Rheumatology",
    # Psychiatry
    "depression": "Psychiatry", "anxiety": "Psychiatry", "schizophrenia": "Psychiatry",
    "bipolar": "Psychiatry", "ptsd": "Psychiatry", "adhd": "Psychiatry",
    "mental": "Psychiatry",
    # Orthopedics
    "disc": "Orthopedic Surgery", "spine": "Orthopedic Surgery",
    "spondylolisthesis": "Orthopedic Surgery", "degenerative": "Orthopedic Surgery",
    "fracture": "Orthopedic Surgery", "joint": "Orthopedic Surgery",
    # Infectious Disease
    "hiv": "Infectious Disease", "aids": "Infectious Disease",
    "hepatitis c": "Infectious Disease", "infection": "Infectious Disease",
    # Urology
    "urothelial": "Urology", "bladder": "Urology", "renal": "Urology",
    "kidney": "Urology", "prostate": "Urology",
    # Ophthalmology
    "retina": "Ophthalmology", "macular": "Ophthalmology", "glaucoma": "Ophthalmology",
    "ocular": "Ophthalmology", "eye": "Ophthalmology",
}


def map_condition_to_specialty(condition: str) -> str | None:
    if not condition:
        return None
    condition_lower = condition.lower().strip()
    # Sort by length descending so "hepatitis c" matches before "hepatitis"
    for keyword in sorted(CONDITION_TO_SPECIALTY.keys(), key=len, reverse=True):
        if keyword in condition_lower:
            specialty = CONDITION_TO_SPECIALTY[keyword]
            logger.info(f"Mapped condition '{condition}' → specialty '{specialty}'")
            return specialty
    logger.info(f"No specialty mapping found for '{condition}' — fetching all specialties.")
    return None


def normalize_state(state: str) -> str | None:
    if not state:
        return None
    s = state.strip()
    if not s:
        return None
    if len(s) == 2:
        return s.upper()
    return STATE_ABBR.get(s.lower(), s.upper())


async def _query_nppes(city: str | None, state: str | None, limit: int) -> list:
    params = {
        "version": "2.1",
        "enumeration_type": "NPI-1",
        "limit": limit,
    }
    if city:
        params["city"] = city.strip()
    if state:
        params["state"] = state

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(NPPES_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"NPPES HTTP error: {e.response.status_code} — {e.response.text}")
        return []
    except httpx.RequestError as e:
        logger.error(f"NPPES request failed: {e}")
        return []

    raw = data.get("results", [])
    logger.info(f"NPPES returned {len(raw)} results (city={city}, state={state})")
    if not raw:
        logger.warning(f"Empty NPPES response. Full payload: {data}")
    return raw


async def fetch_physicians_near(
    city: str | None = None,
    state: str | None = None,
    condition: str | None = None,
    limit: int = 10,
) -> list:
    state_code = normalize_state(state) if state else None
    specialty = map_condition_to_specialty(condition) if condition else None

    logger.info(f"Fetching physicians: city={city}, state={state_code}, condition={condition}, specialty={specialty}")

    raw_results = await _query_nppes(city, state_code, limit)
    if not raw_results:
        return []

    specialty_lower = specialty.lower().strip() if specialty else None
    physicians_to_geocode = []

    for item in raw_results:
        basic = item.get("basic", {})
        addresses = item.get("addresses", [])
        taxonomies = item.get("taxonomies", [])

        if specialty_lower:
            taxonomy_descs = [(t.get("desc") or "").lower() for t in taxonomies]
            if not any(specialty_lower in desc for desc in taxonomy_descs):
                continue

        primary_taxonomy = next(
            (t for t in taxonomies if t.get("primary")),
            taxonomies[0] if taxonomies else {}
        )
        specialty_desc = primary_taxonomy.get("desc") or basic.get("credential") or "Unknown"

        practice_address = next(
            (a for a in addresses if a.get("address_purpose") == "LOCATION"), None
        )
        if not practice_address:
            continue

        full_address = (
            f"{practice_address.get('address_1', '')}, "
            f"{practice_address.get('city', '')}, "
            f"{practice_address.get('state', '')} "
            f"{practice_address.get('postal_code', '')}"
        )

        physicians_to_geocode.append({
            "npi": item.get("number"),
            "name": f"{basic.get('first_name', '')} {basic.get('last_name', '')}".strip(),
            "city": practice_address.get("city"),
            "state": practice_address.get("state"),
            "address": practice_address.get("address_1"),
            "postal_code": practice_address.get("postal_code"),
            "specialty": specialty_desc,
            "full_address": full_address,
        })

    # Geocode all concurrently instead of serially
    async def geocode_physician(p: dict) -> dict:
        try:
            geo = await geocode_address(p["full_address"])
        except Exception as e:
            logger.warning(f"Geocoding failed for '{p['full_address']}': {e}")
            geo = {}
        return {
            **{k: v for k, v in p.items() if k != "full_address"},
            "lat": geo.get("lat"),
            "lon": geo.get("lon"),
        }

    results = await asyncio.gather(*[geocode_physician(p) for p in physicians_to_geocode])
    logger.info(f"Returning {len(results)} physicians.")
    return list(results)