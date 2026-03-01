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

# Only these credentials are considered actual physicians
PHYSICIAN_CREDENTIALS = {
    "MD", "DO", "MBBS", "MBChB", "DPM", "DMD", "DDS", "OD",
    "MD PHD", "DO FACP", "MD FACP", "MD FACS", "MD PHD FACP",
}

# Maps condition keywords to prioritized NPPES taxonomy_description values.
# NPPES does partial substring matching on taxonomy_description.
# Order matters: most relevant first.
CONDITION_TO_TAXONOMY_QUERIES = {
    "breast cancer": ["Oncology", "Hematology", "Radiation Oncology", "Surgical Oncology"],
    "cancer":        ["Oncology", "Hematology", "Radiation Oncology", "Surgical Oncology"],
    "tumor":         ["Oncology", "Hematology", "Radiation Oncology", "Surgical Oncology"],
    "lymphoma":      ["Hematology", "Oncology"],
    "leukemia":      ["Hematology", "Oncology"],
    "melanoma":      ["Oncology", "Dermatology"],
    "carcinoma":     ["Oncology", "Hematology", "Radiation Oncology", "Surgical Oncology"],
    "neoplasm":      ["Oncology", "Hematology"],
    "prostate":      ["Oncology", "Urology", "Radiation Oncology"],
    "colorectal":    ["Oncology", "Colon & Rectal Surgery", "Gastroenterology"],
    "lung cancer":   ["Oncology", "Pulmonary", "Thoracic Surgery"],
    "sarcoma":       ["Oncology", "Orthopedic Surgery"],
    "myeloma":       ["Hematology", "Oncology"],
    "renal":         ["Oncology", "Nephrology", "Urology"],
    "kidney":        ["Nephrology", "Urology", "Oncology"],
    # Cardiovascular
    "heart":         ["Cardiovascular Disease", "Cardiac Electrophysiology", "Interventional Cardiology"],
    "cardiac":       ["Cardiovascular Disease", "Cardiac Electrophysiology"],
    "cardiovascular":["Cardiovascular Disease", "Interventional Cardiology"],
    "hypertension":  ["Cardiovascular Disease", "Internal Medicine", "Nephrology"],
    "arrhythmia":    ["Cardiac Electrophysiology", "Cardiovascular Disease"],
    "stroke":        ["Neurology", "Vascular Neurology", "Cardiovascular Disease"],
    "coronary":      ["Cardiovascular Disease", "Interventional Cardiology"],
    # Endocrine
    "diabetes":      ["Endocrinology", "Internal Medicine"],
    "thyroid":       ["Endocrinology"],
    "obesity":       ["Endocrinology", "Internal Medicine"],
    "metabolic":     ["Endocrinology", "Internal Medicine"],
    # Neurology
    "alzheimer":     ["Neurology", "Geriatric Medicine"],
    "parkinson":     ["Neurology"],
    "epilepsy":      ["Neurology"],
    "seizure":       ["Neurology"],
    "migraine":      ["Neurology"],
    "multiple sclerosis": ["Neurology"],
    "neuropathy":    ["Neurology"],
    # Pulmonology
    "asthma":        ["Pulmonary", "Allergy & Immunology"],
    "copd":          ["Pulmonary", "Internal Medicine"],
    "lung":          ["Pulmonary", "Thoracic Surgery"],
    "respiratory":   ["Pulmonary", "Internal Medicine"],
    # Gastroenterology
    "crohn":         ["Gastroenterology", "Internal Medicine"],
    "colitis":       ["Gastroenterology", "Internal Medicine"],
    "hepatitis":     ["Gastroenterology", "Hepatology"],
    "liver":         ["Gastroenterology", "Hepatology"],
    "pancreatic":    ["Gastroenterology", "Oncology"],
    # Rheumatology
    "arthritis":     ["Rheumatology", "Internal Medicine"],
    "lupus":         ["Rheumatology"],
    "rheumatoid":    ["Rheumatology"],
    "fibromyalgia":  ["Rheumatology", "Pain Medicine"],
    # Psychiatry
    "depression":    ["Psychiatry", "Psychology"],
    "anxiety":       ["Psychiatry", "Psychology"],
    "schizophrenia": ["Psychiatry"],
    "bipolar":       ["Psychiatry"],
    "ptsd":          ["Psychiatry", "Psychology"],
    "adhd":          ["Psychiatry", "Pediatrics"],
    # Orthopedics
    "spine":         ["Orthopedic Surgery", "Neurological Surgery", "Physical Medicine"],
    "fracture":      ["Orthopedic Surgery"],
    "joint":         ["Orthopedic Surgery", "Rheumatology"],
    # Infectious Disease
    "hiv":           ["Infectious Disease", "Internal Medicine"],
    "aids":          ["Infectious Disease", "Internal Medicine"],
    "infection":     ["Infectious Disease", "Internal Medicine"],
    # Urology
    "bladder":       ["Urology"],
    "urothelial":    ["Urology", "Oncology"],
    # Ophthalmology
    "retina":        ["Ophthalmology"],
    "macular":       ["Ophthalmology"],
    "glaucoma":      ["Ophthalmology"],
    "eye":           ["Ophthalmology"],
}


def map_condition_to_taxonomy_queries(condition: str) -> list[str]:
    """Returns ordered list of NPPES taxonomy_description values to query."""
    if not condition:
        return []
    condition_lower = condition.lower().strip()
    for keyword in sorted(CONDITION_TO_TAXONOMY_QUERIES.keys(), key=len, reverse=True):
        if keyword in condition_lower:
            queries = CONDITION_TO_TAXONOMY_QUERIES[keyword]
            logger.info(f"Mapped condition '{condition}' → taxonomy queries {queries}")
            return queries
    logger.info(f"No taxonomy mapping for '{condition}' — will fetch without specialty filter.")
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


def _is_physician(basic: dict) -> bool:
    """Return True only if the provider's credential indicates an actual physician."""
    raw = basic.get("credential", "") or ""
    # Normalize: uppercase, remove dots and extra spaces
    credential = raw.strip().upper().replace(".", "").replace(",", "").strip()
    # Direct match
    if credential in PHYSICIAN_CREDENTIALS:
        return True
    # Starts-with match to handle suffixes like "MD FACC", "DO MPH", etc.
    for valid in PHYSICIAN_CREDENTIALS:
        if credential.startswith(valid):
            return True
    return False


async def _query_nppes(
    city: str | None,
    state: str | None,
    limit: int,
    taxonomy_description: str | None = None,
) -> list:
    """Query NPPES API. taxonomy_description is matched as a partial substring by NPPES."""
    params = {
        "version": "2.1",
        "enumeration_type": "NPI-1",
        "limit": limit,
    }
    if city:
        params["city"] = city.strip()
    if state:
        params["state"] = state
    if taxonomy_description:
        params["taxonomy_description"] = taxonomy_description

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
    logger.info(
        f"NPPES returned {len(raw)} results "
        f"(city={city}, state={state}, taxonomy={taxonomy_description})"
    )
    return raw


def _parse_physician(
    item: dict,
    expected_city: str | None = None,
) -> dict | None:
    """
    Extract structured physician info from a raw NPPES result.
    Returns None if:
      - provider is not a physician (MD/DO/etc.)
      - practice address is missing
      - city doesn't match expected_city (when provided)
    """
    basic = item.get("basic", {})
    addresses = item.get("addresses", [])
    taxonomies = item.get("taxonomies", [])

    # ✅ Only include actual physicians
    if not _is_physician(basic):
        logger.debug(
            f"Skipping non-physician: {basic.get('first_name')} {basic.get('last_name')} "
            f"(credential={basic.get('credential')})"
        )
        return None

    practice_address = next(
        (a for a in addresses if a.get("address_purpose") == "LOCATION"), None
    )
    if not practice_address:
        return None

    # ✅ Only include physicians in the expected city
    if expected_city:
        provider_city = (practice_address.get("city") or "").strip().lower()
        if provider_city != expected_city.strip().lower():
            logger.debug(
                f"Skipping out-of-area physician: "
                f"{basic.get('first_name')} {basic.get('last_name')} "
                f"(city={provider_city}, expected={expected_city})"
            )
            return None

    primary_taxonomy = next(
        (t for t in taxonomies if t.get("primary")),
        taxonomies[0] if taxonomies else {}
    )
    specialty_desc = primary_taxonomy.get("desc") or basic.get("credential") or "Unknown"

    full_address = (
        f"{practice_address.get('address_1', '')}, "
        f"{practice_address.get('city', '')}, "
        f"{practice_address.get('state', '')} "
        f"{practice_address.get('postal_code', '')}"
    )

    return {
        "npi": item.get("number"),
        "name": f"{basic.get('first_name', '')} {basic.get('last_name', '')}".strip(),
        "credential": basic.get("credential", ""),
        "city": practice_address.get("city"),
        "state": practice_address.get("state"),
        "address": practice_address.get("address_1"),
        "postal_code": practice_address.get("postal_code"),
        "specialty": specialty_desc,
        "full_address": full_address,
    }


async def fetch_physicians_near(
    city: str | None = None,
    state: str | None = None,
    condition: str | None = None,
    limit: int = 10,
) -> list:
    state_code = normalize_state(state) if state else None
    taxonomy_queries = map_condition_to_taxonomy_queries(condition) if condition else []

    logger.info(
        f"Fetching physicians: city={city}, state={state_code}, "
        f"condition={condition}, taxonomy_queries={taxonomy_queries}"
    )

    seen_npis: set = set()
    physicians_to_geocode: list = []

    if taxonomy_queries:
        # Query NPPES once per taxonomy, filtering at API level.
        # Fetch extra to account for non-physician and out-of-area filtering.
        for taxonomy in taxonomy_queries:
            if len(physicians_to_geocode) >= limit:
                break
            raw_results = await _query_nppes(city, state_code, limit * 4, taxonomy)
            for item in raw_results:
                npi = item.get("number")
                if npi in seen_npis:
                    continue
                seen_npis.add(npi)
                parsed = _parse_physician(item, expected_city=city)
                if parsed:
                    physicians_to_geocode.append(parsed)
                if len(physicians_to_geocode) >= limit:
                    break

        # Fallback 1: relax city filter — search by state only
        if not physicians_to_geocode and state_code:
            logger.warning(
                f"No physicians found in city={city}. "
                f"Falling back to state={state_code} search."
            )
            for taxonomy in taxonomy_queries:
                if len(physicians_to_geocode) >= limit:
                    break
                raw_results = await _query_nppes(None, state_code, limit * 4, taxonomy)
                for item in raw_results:
                    npi = item.get("number")
                    if npi in seen_npis:
                        continue
                    seen_npis.add(npi)
                    parsed = _parse_physician(item, expected_city=None)
                    if parsed:
                        physicians_to_geocode.append(parsed)
                    if len(physicians_to_geocode) >= limit:
                        break

        # Fallback 2: drop specialty filter entirely
        if not physicians_to_geocode:
            logger.warning(
                f"No physicians found with taxonomy filter. "
                f"Falling back to unfiltered search."
            )
            raw_results = await _query_nppes(city, state_code, limit * 4)
            for item in raw_results:
                parsed = _parse_physician(item, expected_city=city)
                if parsed:
                    physicians_to_geocode.append(parsed)
                if len(physicians_to_geocode) >= limit:
                    break

    else:
        raw_results = await _query_nppes(city, state_code, limit * 4)
        for item in raw_results:
            parsed = _parse_physician(item, expected_city=city)
            if parsed:
                physicians_to_geocode.append(parsed)
            if len(physicians_to_geocode) >= limit:
                break

    logger.info(f"Found {len(physicians_to_geocode)} physicians before geocoding.")

    if not physicians_to_geocode:
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