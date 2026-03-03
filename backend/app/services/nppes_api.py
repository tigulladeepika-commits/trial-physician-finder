import httpx
import logging
import asyncio
from app.services.mapquest_api import geocode_address

logger = logging.getLogger(__name__)

NPPES_BASE_URL = "https://npiregistry.cms.hhs.gov/api/"

PHYSICIAN_TAXONOMY_CODES = {
    "207R00000X", "207RB0002X", "207RC0000X", "207RC0001X", "207RE0101X",
    "207RG0100X", "207RG0300X", "207RH0000X", "207RH0003X", "207RI0001X",
    "207RI0008X", "207RI0200X", "207RK0002X", "207RM1200X", "207RN0300X",
    "207RP1001X", "207RR0500X", "207RT0003X", "207RX0202X", "207K00000X",
    "207KI0005X", "208600000X", "2086S0102X", "2086S0127X", "2086S0129X",
    "2086S0120X", "2086X0206X", "2086H0002X", "208G00000X", "204F00000X",
    "2084A0401X", "2085R0001X", "2085R0202X", "2085U0001X", "2084N0400X",
    "2084N0402X", "2084B0040X", "2084D0003X", "2084E0001X", "2084F0202X",
    "2084H0002X", "2084N0600X", "2084N0008X", "2084P0005X", "2084P0800X",
    "2084P0802X", "2084P0804X", "2084P2900X", "2084S0010X", "2084V0102X",
    "207RC0200X", "208800000X", "2088F0040X", "2088P0231X", "207V00000X",
    "207VG0400X", "207VX0201X", "207N00000X", "207NI0002X", "207ND0101X",
    "207ND0900X", "207NP0225X", "207NS0135X", "207ZP0101X", "207ZP0102X",
    "207ZP0104X", "207ZP0105X", "207ZH0000X", "207ZI0100X", "207ZM0300X",
    "207ZN0500X", "207ZP0007X", "207ZP0213X", "207X00000X", "207XS0106X",
    "207XS0114X", "207XS0117X", "207XX0004X", "207XP3100X", "207XT0100X",
    "207P00000X", "207PE0004X", "207PP0204X", "207Q00000X", "207QA0401X",
    "207QG0300X", "207QS0010X", "208000000X", "2080A0000X", "2080I0007X",
    "2080P0006X", "2080P0201X", "2080P0202X", "2080P0203X", "2080P0204X",
    "2080P0205X", "2080P0206X", "2080P0207X", "2080P0208X", "2080P0210X",
    "2080P0214X", "2080P0216X", "2080T0002X", "208100000X", "2081H0002X",
    "2081P2900X", "208200000X", "2082S0099X", "208D00000X", "208M00000X",
    "208VP0000X", "208VP0014X", "207L00000X", "207LA0401X", "207LC0200X",
    "207LH0002X", "207LP2900X", "207LP3000X", "207W00000X", "208C00000X",
    "2083A0100X", "2083A0300X", "2083B0002X", "2083C0008X", "2083P0011X",
    "2083P0500X", "2083P0901X", "2083S0010X", "2083T0002X", "2083X0100X",
    "2085B0100X", "2085D0003X", "2085H0002X", "2085N0700X", "2085N0904X",
    "2085P0229X", "2085R0203X", "2085R0204X", "2085V0002X",
}

NON_PHYSICIAN_TAXONOMY_CODES = {
    "363A00000X", "363AM0700X", "363AS0400X", "363L00000X", "363LA2100X",
    "363LA2200X", "363LC0200X", "363LC1500X", "363LE0002X", "363LF0000X",
    "363LG0600X", "363LN0000X", "363LN0005X", "363LP0200X", "363LP0222X",
    "363LP1700X", "363LP2300X", "363LP0808X", "363LS0200X", "363LW0102X",
    "363LX0001X", "363LX0106X", "367500000X", "367A00000X", "367H00000X",
    "183500000X", "163W00000X", "101Y00000X", "106H00000X", "111N00000X",
    "122300000X", "133N00000X", "133V00000X", "225100000X", "225200000X",
    "225400000X", "333600000X", "3040P0500X",
}

CONDITION_TO_TAXONOMY_CODES = {
    "breast cancer":  ["207RH0003X", "207RX0202X", "2085R0001X", "2086S0102X", "207VG0400X"],
    "cancer":         ["207RH0003X", "207RX0202X", "2085R0001X", "2086S0102X"],
    "tumor":          ["207RH0003X", "207RX0202X", "2085R0001X", "2086S0102X"],
    "lymphoma":       ["207RH0003X", "207RH0000X", "207RX0202X"],
    "leukemia":       ["207RH0003X", "207RH0000X", "207RX0202X"],
    "melanoma":       ["207RH0003X", "207RX0202X", "207N00000X"],
    "carcinoma":      ["207RH0003X", "207RX0202X", "2085R0001X", "2086S0102X"],
    "neoplasm":       ["207RH0003X", "207RX0202X"],
    "prostate":       ["207RH0003X", "207RX0202X", "208800000X", "2085R0001X"],
    "colorectal":     ["207RH0003X", "207RX0202X", "208C00000X", "207RG0100X"],
    "lung cancer":    ["207RH0003X", "207RX0202X", "207RP1001X", "208G00000X"],
    "sarcoma":        ["207RH0003X", "207RX0202X", "207X00000X"],
    "myeloma":        ["207RH0003X", "207RH0000X", "207RX0202X"],
    "renal":          ["207RH0003X", "207RX0202X", "207RN0300X", "208800000X"],
    "kidney":         ["207RN0300X", "208800000X", "207RH0003X"],
    "heart":          ["207RC0000X", "207RC0001X"],
    "cardiac":        ["207RC0000X", "207RC0001X"],
    "cardiovascular": ["207RC0000X"],
    "hypertension":   ["207RC0000X", "207R00000X", "207RN0300X"],
    "arrhythmia":     ["207RC0001X", "207RC0000X"],
    "stroke":         ["2084N0400X", "2084V0102X", "207RC0000X"],
    "coronary":       ["207RC0000X"],
    "diabetes":       ["207RE0101X", "207R00000X"],
    "thyroid":        ["207RE0101X"],
    "obesity":        ["207RE0101X", "207R00000X"],
    "alzheimer":      ["2084N0400X", "207QG0300X"],
    "parkinson":      ["2084N0400X"],
    "epilepsy":       ["2084N0400X", "2084E0001X"],
    "migraine":       ["2084N0400X", "2084H0002X"],
    "multiple sclerosis": ["2084N0400X"],
    "asthma":         ["207RP1001X", "207K00000X"],
    "copd":           ["207RP1001X", "207R00000X"],
    "crohn":          ["207RG0100X", "207R00000X"],
    "colitis":        ["207RG0100X", "207R00000X"],
    "hepatitis":      ["207RG0100X", "207RI0008X"],
    "arthritis":      ["207RR0500X", "207R00000X"],
    "lupus":          ["207RR0500X"],
    "rheumatoid":     ["207RR0500X"],
    "depression":     ["2084P0800X", "2084P0804X"],
    "anxiety":        ["2084P0800X", "2084P0804X"],
    "schizophrenia":  ["2084P0800X"],
    "bipolar":        ["2084P0800X"],
    "ptsd":           ["2084P0800X"],
    "adhd":           ["2084P0800X", "2084P0804X", "208000000X"],
    "hiv":            ["207RI0200X", "207R00000X"],
    "bladder":        ["208800000X"],
}

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

# Full taxonomy code → display description
CODE_TO_DESCRIPTION = {
    "207R00000X": "Internal Medicine",
    "207RB0002X": "Obesity Medicine",
    "207RC0000X": "Cardiovascular Disease",
    "207RC0001X": "Clinical Cardiac Electrophysiology",
    "207RE0101X": "Endocrinology, Diabetes & Metabolism",
    "207RG0100X": "Gastroenterology",
    "207RG0300X": "Geriatric Medicine",
    "207RH0000X": "Hematology",
    "207RH0003X": "Hematology & Oncology",
    "207RI0001X": "Interventional Cardiology",
    "207RI0008X": "Hepatology",
    "207RI0200X": "Infectious Disease",
    "207RN0300X": "Nephrology",
    "207RP1001X": "Pulmonary Disease",
    "207RR0500X": "Rheumatology",
    "207RT0003X": "Transplant Hepatology",
    "207RX0202X": "Medical Oncology",
    "207K00000X": "Allergy & Immunology",
    "207KI0005X": "Clinical & Laboratory Immunology",
    "208600000X": "Surgery",
    "2086S0102X": "Surgical Oncology",
    "2086S0127X": "Surgical Critical Care",
    "2086S0129X": "Vascular Surgery",
    "2086S0120X": "Pediatric Surgery",
    "208G00000X": "Thoracic Surgery",
    "204F00000X": "Transplant Surgery",
    "2085R0001X": "Radiation Oncology",
    "2085R0202X": "Radiological Physics",
    "2085R0203X": "Diagnostic Radiology",
    "2085R0204X": "Interventional Radiology",
    "2085U0001X": "Nuclear Medicine",
    "2085N0700X": "Neuroradiology",
    "2085V0002X": "Vascular & Interventional Radiology",
    "2084N0400X": "Neurology",
    "2084N0402X": "Child Neurology",
    "2084A0401X": "Neurological Surgery",
    "2084B0040X": "Behavioral Neurology & Neuropsychiatry",
    "2084E0001X": "Epilepsy",
    "2084H0002X": "Headache Medicine",
    "2084N0600X": "NeuroCritical Care",
    "2084P0005X": "Pain Medicine (Neurology)",
    "2084P0800X": "Psychiatry",
    "2084P0802X": "Addiction Psychiatry",
    "2084P0804X": "Child & Adolescent Psychiatry",
    "2084P2900X": "Neuropsychiatry",
    "2084V0102X": "Vascular Neurology",
    "207RC0200X": "Critical Care Medicine",
    "208800000X": "Urology",
    "2088F0040X": "Female Pelvic Medicine & Reconstructive Surgery",
    "2088P0231X": "Pediatric Urology",
    "207V00000X": "Obstetrics & Gynecology",
    "207VG0400X": "Gynecologic Oncology",
    "207VX0201X": "Gynecology",
    "207N00000X": "Dermatology",
    "207ND0101X": "MOHS-Micrographic Surgery",
    "207ND0900X": "Dermatopathology",
    "207NP0225X": "Pediatric Dermatology",
    "207ZP0101X": "Anatomic Pathology",
    "207ZP0102X": "Anatomic & Clinical Pathology",
    "207ZP0105X": "Clinical Pathology",
    "207ZH0000X": "Hematology Pathology",
    "207ZN0500X": "Neuropathology",
    "207ZP0007X": "Molecular Genetic Pathology",
    "207X00000X": "Orthopaedic Surgery",
    "207XS0106X": "Orthopaedic Surgery of the Spine",
    "207XS0114X": "Adult Reconstructive Orthopaedic Surgery",
    "207XS0117X": "Foot and Ankle Surgery",
    "207XP3100X": "Pediatric Orthopaedic Surgery",
    "207XT0100X": "Orthopaedic Trauma",
    "207P00000X": "Emergency Medicine",
    "207PP0204X": "Pediatric Emergency Medicine",
    "207Q00000X": "Family Medicine",
    "207QA0401X": "Addiction Medicine",
    "207QG0300X": "Geriatric Medicine",
    "207QS0010X": "Sports Medicine",
    "208000000X": "Pediatrics",
    "2080P0207X": "Pediatric Hematology-Oncology",
    "2080P0202X": "Pediatric Cardiology",
    "2080P0205X": "Pediatric Endocrinology",
    "2080P0206X": "Pediatric Gastroenterology",
    "2080P0208X": "Pediatric Infectious Diseases",
    "208100000X": "Physical Medicine & Rehabilitation",
    "2081P2900X": "Pain Medicine (PM&R)",
    "208200000X": "Plastic Surgery",
    "208C00000X": "Colon & Rectal Surgery",
    "208D00000X": "General Practice",
    "208M00000X": "Hospitalist",
    "208VP0000X": "Pain Medicine",
    "208VP0014X": "Interventional Pain Medicine",
    "207L00000X": "Anesthesiology",
    "207LC0200X": "Critical Care Medicine (Anesthesiology)",
    "207LP2900X": "Pain Medicine (Anesthesiology)",
    "207LP3000X": "Pediatric Anesthesiology",
    "207W00000X": "Ophthalmology",
    "2083X0100X": "Occupational Medicine",
    "2083T0002X": "Medical Toxicology",
    "2083P0901X": "Public Health & General Preventive Medicine",
    "2083B0002X": "Obesity Medicine (Prev Med)",
    "2083C0008X": "Clinical Informatics",
}


def get_taxonomy_codes_for_condition(condition: str) -> list[str]:
    if not condition:
        return []
    condition_lower = condition.lower().strip()
    for keyword in sorted(CONDITION_TO_TAXONOMY_CODES.keys(), key=len, reverse=True):
        if keyword in condition_lower:
            codes = CONDITION_TO_TAXONOMY_CODES[keyword]
            logger.info(f"Mapped condition '{condition}' → taxonomy codes {codes}")
            return codes
    logger.info(f"No code mapping for '{condition}' — using general physician codes.")
    return ["207R00000X", "207RH0003X", "207RX0202X"]


def normalize_state(state: str) -> str | None:
    if not state:
        return None
    s = state.strip()
    if not s:
        return None
    if len(s) == 2:
        return s.upper()
    return STATE_ABBR.get(s.lower(), s.upper())


def _is_physician(taxonomies: list) -> bool:
    if not taxonomies:
        return False
    codes = {t.get("code", "") for t in taxonomies}
    if codes & NON_PHYSICIAN_TAXONOMY_CODES:
        return False
    return bool(codes & PHYSICIAN_TAXONOMY_CODES)


async def _query_nppes(
    city: str | None,
    state: str | None,
    limit: int,
    taxonomy_description: str | None = None,
) -> list:
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
        logger.error(f"NPPES HTTP error: {e.response.status_code}")
        return []
    except httpx.RequestError as e:
        logger.error(f"NPPES request failed: {e}")
        return []

    raw = data.get("results", [])
    logger.info(f"NPPES returned {len(raw)} raw results (city={city}, state={state}, taxonomy={taxonomy_description})")
    return raw


def _parse_physician(item: dict, expected_city: str | None = None) -> dict | None:
    basic = item.get("basic", {})
    addresses = item.get("addresses", [])
    taxonomies = item.get("taxonomies", [])

    if not _is_physician(taxonomies):
        return None

    practice_address = next(
        (a for a in addresses if a.get("address_purpose") == "LOCATION"), None
    )
    if not practice_address:
        return None

    if expected_city:
        provider_city = (practice_address.get("city") or "").strip().lower()
        if provider_city != expected_city.strip().lower():
            return None

    primary_taxonomy = next(
        (t for t in taxonomies if t.get("primary")),
        taxonomies[0] if taxonomies else {}
    )
    taxonomy_code = primary_taxonomy.get("code", "")
    taxonomy_description = (
        CODE_TO_DESCRIPTION.get(taxonomy_code)
        or primary_taxonomy.get("desc")
        or "Unknown"
    )

    credential = (basic.get("credential") or "").strip()
    full_address = (
        f"{practice_address.get('address_1', '')}, "
        f"{practice_address.get('city', '')}, "
        f"{practice_address.get('state', '')} "
        f"{practice_address.get('postal_code', '')}"
    )

    return {
        "npi": item.get("number"),
        "name": f"{basic.get('first_name', '')} {basic.get('last_name', '')}".strip(),
        "credential": credential,
        "city": practice_address.get("city"),
        "state": practice_address.get("state"),
        "address": practice_address.get("address_1"),
        "postal_code": practice_address.get("postal_code"),
        "specialty": taxonomy_description,
        "taxonomyCode": taxonomy_code,               # ← NEW
        "taxonomyDescription": taxonomy_description, # ← NEW
        "full_address": full_address,
    }


async def fetch_physicians_near(
    city: str | None = None,
    state: str | None = None,
    condition: str | None = None,
    limit: int = 10,
) -> list:
    state_code = normalize_state(state) if state else None
    taxonomy_codes = get_taxonomy_codes_for_condition(condition) if condition else []

    logger.info(
        f"Fetching physicians: city={city}, state={state_code}, "
        f"condition={condition}, taxonomy_codes={taxonomy_codes}"
    )

    seen_npis: set = set()
    physicians_to_geocode: list = []

    async def collect(query_city, query_state, strict_city, codes):
        for code in codes:
            if len(physicians_to_geocode) >= limit:
                break
            desc = CODE_TO_DESCRIPTION.get(code, "Internal Medicine")
            raw_results = await _query_nppes(query_city, query_state, limit * 5, desc)
            for item in raw_results:
                npi = item.get("number")
                if npi in seen_npis:
                    continue
                seen_npis.add(npi)
                parsed = _parse_physician(item, expected_city=strict_city)
                if parsed:
                    physicians_to_geocode.append(parsed)
                if len(physicians_to_geocode) >= limit:
                    break

    if taxonomy_codes:
        await collect(city, state_code, strict_city=city, codes=taxonomy_codes)
        if not physicians_to_geocode and state_code:
            logger.warning(f"No results in city={city}. Trying state={state_code}.")
            await collect(None, state_code, strict_city=None, codes=taxonomy_codes)
        if not physicians_to_geocode:
            logger.warning("No specialty matches. Falling back to unfiltered physician search.")
            raw_results = await _query_nppes(city, state_code, limit * 5)
            for item in raw_results:
                parsed = _parse_physician(item, expected_city=city)
                if parsed:
                    physicians_to_geocode.append(parsed)
                if len(physicians_to_geocode) >= limit:
                    break
    else:
        raw_results = await _query_nppes(city, state_code, limit * 5)
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
    return list(results)[:5]