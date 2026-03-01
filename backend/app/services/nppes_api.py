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

# Maps condition keywords to a list of NPPES taxonomy description substrings to match against.
# Broader lists = more physicians returned.
CONDITION_TO_SPECIALTY_KEYWORDS = {
    # Oncology — many specialists treat cancer patients
    "cancer": ["oncol", "hematol", "radiation", "surgical oncol", "gynecologic oncol", "neuro-oncol", "breast"],
    "tumor": ["oncol", "hematol", "radiation", "neurosurg", "surgical oncol"],
    "lymphoma": ["oncol", "hematol"],
    "leukemia": ["oncol", "hematol"],
    "melanoma": ["oncol", "dermatol"],
    "carcinoma": ["oncol", "hematol", "radiation", "surgical oncol"],
    "neoplasm": ["oncol", "hematol"],
    "breast cancer": ["oncol", "hematol", "breast", "radiation", "surgical oncol"],
    "prostate": ["oncol", "urol", "radiation"],
    "lung cancer": ["oncol", "pulmon", "radiation", "thoracic"],
    # Cardiovascular
    "heart": ["cardiol", "cardiovascular", "cardiac", "internal medicine", "electrophysiol"],
    "cardiac": ["cardiol", "cardiovascular", "cardiac", "electrophysiol"],
    "cardiovascular": ["cardiol", "cardiovascular", "cardiac"],
    "hypertension": ["cardiol", "internal medicine", "nephrol"],
    "arrhythmia": ["cardiol", "electrophysiol"],
    "stroke": ["neurol", "cardiol", "vascular"],
    "coronary": ["cardiol", "cardiovascular"],
    # Endocrine
    "diabetes": ["endocrinol", "internal medicine", "metabolic"],
    "thyroid": ["endocrinol"],
    "obesity": ["endocrinol", "internal medicine", "bariatric"],
    "metabolic": ["endocrinol", "internal medicine"],
    "hormonal": ["endocrinol", "reproductive"],
    # Neurology
    "alzheimer": ["neurol", "geriatric", "psychiatr"],
    "parkinson": ["neurol"],
    "epilepsy": ["neurol"],
    "seizure": ["neurol"],
    "migraine": ["neurol"],
    "multiple sclerosis": ["neurol"],
    "neuropathy": ["neurol"],
    # Pulmonology
    "asthma": ["pulmon", "allerg", "internal medicine"],
    "copd": ["pulmon", "internal medicine"],
    "lung": ["pulmon", "thoracic", "internal medicine"],
    "respiratory": ["pulmon", "internal medicine"],
    # Gastroenterology
    "crohn": ["gastroenterol", "internal medicine"],
    "colitis": ["gastroenterol", "internal medicine"],
    "hepatitis": ["gastroenterol", "hepatol", "internal medicine"],
    "liver": ["gastroenterol", "hepatol"],
    "colorectal": ["gastroenterol", "colorectal", "surgical"],
    "pancreatic": ["gastroenterol", "oncol", "surgical"],
    # Rheumatology
    "arthritis": ["rheumatol", "internal medicine", "orthop"],
    "lupus": ["rheumatol", "internal medicine"],
    "rheumatoid": ["rheumatol"],
    "fibromyalgia": ["rheumatol", "pain"],
    # Psychiatry
    "depression": ["psychiatr", "psychol", "mental health"],
    "anxiety": ["psychiatr", "psychol", "mental health"],
    "schizophrenia": ["psychiatr"],
    "bipolar": ["psychiatr"],
    "ptsd": ["psychiatr", "psychol"],
    "adhd": ["psychiatr", "psychol", "pediatr"],
    # Orthopedics
    "spine": ["orthop", "neurosurg", "physical medicine"],
    "fracture": ["orthop", "trauma"],
    "joint": ["orthop", "rheumatol"],
    # Infectious Disease
    "hiv": ["infectious", "internal medicine"],
    "aids": ["infectious", "internal medicine"],
    "infection": ["infectious", "internal medicine"],
    # Urology
    "bladder": ["urol"],
    "renal": ["nephrol", "urol"],
    "kidney": ["nephrol", "urol"],
    # Ophthalmology
    "retina": ["ophthal"],
    "macular": ["ophthal"],
    "glaucoma": ["ophthal"],
    "eye": ["ophthal"],
}


def map_condition_to_specialty_keywords(condition: str) -> list[str]:
    """
    Returns a list of lowercase substrings to match against NPPES taxonomy descriptions.
    Broader matching = more physicians returned.
    """
    if not condition:
        return []
    condition_lower = condition.lower().strip()
    # Sort by length descending so "breast cancer" matches before "cancer"
    for keyword in sorted(CONDITION_TO_SPECIALTY_KEYWORDS.keys(), key=len, reverse=True):
        if keyword in condition_lower:
            keywords = CONDITION_TO_SPECIALTY_KEYWORDS[keyword]
            logger.info(f"Mapped condition '{condition}' → specialty keywords {keywords}")
            return keywords
    logger.info(f"No specialty mapping for '{condition}' — returning all physicians.")
    return []


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
    """Query NPPES API and return raw results."""
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
    logger.info(f"NPPES returned {len(raw)} raw results (city={city}, state={state})")
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
    specialty_keywords = map_condition_to_specialty_keywords(condition) if condition else []

    logger.info(
        f"Fetching physicians: city={city}, state={state_code}, "
        f"condition={condition}, specialty_keywords={specialty_keywords}"
    )

    # Fetch more from NPPES than needed so filtering doesn't leave us empty
    fetch_limit = min(limit * 5, 200)
    raw_results = await _query_nppes(city, state_code, fetch_limit)

    if not raw_results:
        return []

    physicians_to_geocode = []

    for item in raw_results:
        basic = item.get("basic", {})
        addresses = item.get("addresses", [])
        taxonomies = item.get("taxonomies", [])

        # Filter by specialty keywords if we have them
        if specialty_keywords:
            taxonomy_descs = [(t.get("desc") or "").lower() for t in taxonomies]
            all_descs = " ".join(taxonomy_descs)
            if not any(kw in all_descs for kw in specialty_keywords):
                logger.debug(f"Skipping physician — no specialty match. Taxonomies: {taxonomy_descs}")
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

        # Stop once we have enough
        if len(physicians_to_geocode) >= limit:
            break

    logger.info(f"After specialty filter: {len(physicians_to_geocode)} physicians to geocode.")

    if not physicians_to_geocode:
        logger.warning(
            f"No physicians matched specialty keywords {specialty_keywords} "
            f"in {len(raw_results)} NPPES results for city={city}, state={state_code}."
        )
        return []

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
