import requests
import logging

logger = logging.getLogger(__name__)

CLINICAL_TRIALS_BASE_URL = "https://clinicaltrials.gov/api/v2/studies"

HEADERS = {
    "User-Agent": "TrialPhysicianFinder/1.0 (contact@example.com)"
}

STATE_MAP = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
}

# Maps broad user-entered terms to precise ClinicalTrials condition keywords
CONDITION_SYNONYMS = {
    "oncology": "cancer OR tumor OR carcinoma OR malignancy OR neoplasm OR sarcoma OR lymphoma OR leukemia OR melanoma",
    "heart disease": "cardiac OR cardiovascular OR coronary OR heart failure OR arrhythmia",
    "diabetes": "diabetes mellitus OR diabetic OR hyperglycemia",
    "obesity": "obesity OR overweight OR bariatric",
    "mental health": "depression OR anxiety OR bipolar OR schizophrenia OR PTSD OR psychiatric",
}


def _expand_condition(condition: str) -> str:
    """Map common broad terms to more precise condition search strings."""
    if not condition or not condition.strip():
        return condition
    lower = condition.lower().strip()
    return CONDITION_SYNONYMS.get(lower, condition)


def _expand_location(location: str) -> str | None:
    if not location or not location.strip():
        return None
    parts = [p.strip() for p in location.split(",")]
    expanded_parts = []
    for part in parts:
        expanded_parts.append(STATE_MAP.get(part.upper(), part))
    result = ", ".join(expanded_parts)
    if "united states" not in result.lower():
        result = f"{result}, United States"
    return result


def fetch_trials(condition: str, location: str = "", limit: int = 10, offset: int = 0):
    location_query = _expand_location(location)
    condition_query = _expand_condition(condition)

    params = {
        # ✅ Use query.cond to restrict search to condition/disease field only
        "query.cond": condition_query,
        "pageSize": limit,
        "countTotal": "true",
        "format": "json",
    }

    if location_query:
        params["query.locn"] = location_query

    if offset > 0:
        page_token = _get_page_token(params, offset)
        if page_token:
            params["pageToken"] = page_token

    try:
        response = requests.get(
            CLINICAL_TRIALS_BASE_URL, params=params, headers=HEADERS, timeout=15
        )
        response.raise_for_status()
        data = response.json()
    except requests.HTTPError as e:
        logger.error(f"ClinicalTrials HTTP error: {e.response.status_code}")
        return []
    except requests.RequestException as e:
        logger.error(f"ClinicalTrials request failed: {e}")
        return []

    studies = data.get("studies", [])
    logger.info(f"ClinicalTrials returned {len(studies)} studies | condition={condition_query} | location={location_query}")

    # ✅ Post-filter: ensure at least one returned condition loosely matches the search term
    filtered_studies = []
    search_keywords = _get_filter_keywords(condition)
    for study in studies:
        protocol = study.get("protocolSection", {})
        study_conditions = [
            c.lower()
            for c in protocol.get("conditionsModule", {}).get("conditions", [])
        ]
        if search_keywords and not any(
            kw in cond
            for kw in search_keywords
            for cond in study_conditions
        ):
            logger.debug(f"Filtered out study with conditions: {study_conditions}")
            continue
        filtered_studies.append(study)

    logger.info(f"After post-filter: {len(filtered_studies)} studies remain")

    results = []
    for study in filtered_studies:
        protocol = study.get("protocolSection", {})

        locations_module = protocol.get("contactsLocationsModule", {})
        locations = [
            {
                "facility": loc.get("facility"),
                "city": loc.get("city"),
                "state": loc.get("state"),
                "country": loc.get("country"),
                "status": loc.get("recruitmentStatus"),
                "lat": loc.get("geoPoint", {}).get("lat"),
                "lon": loc.get("geoPoint", {}).get("lon"),
            }
            for loc in locations_module.get("locations", [])
        ]

        central_contacts = locations_module.get("centralContacts", [])
        point_of_contact = None
        if central_contacts:
            c = central_contacts[0]
            point_of_contact = {
                "name": c.get("name"),
                "role": c.get("role"),
                "phone": c.get("phone"),
                "email": c.get("email"),
            }

        eligibility = protocol.get("eligibilityModule", {})
        criteria_text = eligibility.get("eligibilityCriteria", "")
        inclusion_criteria = ""
        exclusion_criteria = ""
        if "Inclusion Criteria:" in criteria_text:
            parts = criteria_text.split("Exclusion Criteria:")
            inclusion_criteria = parts[0].replace("Inclusion Criteria:", "").strip()
            exclusion_criteria = parts[1].strip() if len(parts) > 1 else ""

        design_module = protocol.get("designModule", {})
        phases = design_module.get("phases", [])

        results.append({
            "nctId": protocol.get("identificationModule", {}).get("nctId"),
            "title": protocol.get("identificationModule", {}).get("briefTitle"),
            "status": protocol.get("statusModule", {}).get("overallStatus"),
            "description": protocol.get("descriptionModule", {}).get("briefSummary"),
            "conditions": protocol.get("conditionsModule", {}).get("conditions", []),
            "sponsor": protocol.get("sponsorCollaboratorsModule", {}).get("leadSponsor", {}).get("name"),
            "phases": phases,
            "locations": locations,
            "inclusionCriteria": inclusion_criteria,
            "exclusionCriteria": exclusion_criteria,
            "pointOfContact": point_of_contact,
        })

    return results


def _get_filter_keywords(condition: str) -> list[str]:
    """
    Returns a list of lowercase keywords that at least one study condition must contain.
    For broad terms like 'oncology', returns cancer-related keywords.
    For specific terms, returns the term itself.
    """
    if not condition:
        return []
    lower = condition.lower().strip()

    KEYWORD_MAP = {
        "oncology": ["cancer", "tumor", "carcinoma", "malignancy", "neoplasm",
                     "sarcoma", "lymphoma", "leukemia", "melanoma", "glioma",
                     "myeloma", "adenocarcinoma", "blastoma"],
        "heart disease": ["cardiac", "cardiovascular", "coronary", "heart", "arrhythmia"],
        "diabetes": ["diabet", "hyperglycemi", "insulin"],
        "obesity": ["obes", "overweight", "adipos", "bariatric"],
        "mental health": ["depress", "anxiety", "bipolar", "schizophreni", "ptsd", "psychiat"],
    }

    if lower in KEYWORD_MAP:
        return KEYWORD_MAP[lower]

    # For any other term, just use the term itself as the filter keyword
    return [lower]


def _get_page_token(base_params: dict, offset: int) -> str | None:
    params = {**base_params, "pageSize": offset}
    try:
        response = requests.get(
            CLINICAL_TRIALS_BASE_URL, params=params, headers=HEADERS, timeout=15
        )
        response.raise_for_status()
        return response.json().get("nextPageToken")
    except Exception as e:
        logger.warning(f"Could not retrieve page token for offset {offset}: {e}")
        return None