import requests
import logging

logger = logging.getLogger(__name__)

CLINICAL_TRIALS_BASE_URL = "https://clinicaltrials.gov/api/v2/studies"

HEADERS = {
    "User-Agent": "TrialPhysicianFinder/1.0 (contact@example.com)"
}

def fetch_trials(condition: str, state: str, limit: int = 10, offset: int = 0):
    params = {
        "query.cond": condition,
        "query.locn": state,
        "pageSize": limit,
        "countTotal": "true",
        "format": "json",
        "fields": (
            "NCTId,BriefTitle,OverallStatus,"
            "ContactsLocationsModule,DescriptionModule,"
            "ConditionsModule,SponsorCollaboratorsModule,"
            "EligibilityModule,DesignModule"
        ),
    }

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
    logger.info(f"ClinicalTrials returned {len(studies)} studies for condition={condition}, state={state}")

    results = []
    for study in studies:
        protocol = study.get("protocolSection", {})

        # Locations
        locations_module = protocol.get("contactsLocationsModule", {})
        locations = [
            {
                "facility": loc.get("facility"),
                "city": loc.get("city"),
                "state": loc.get("state"),
                "country": loc.get("country"),
                "status": loc.get("recruitmentStatus"),
            }
            for loc in locations_module.get("locations", [])
        ]

        # Point of contact
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

        # Eligibility criteria
        eligibility = protocol.get("eligibilityModule", {})
        criteria_text = eligibility.get("eligibilityCriteria", "")
        inclusion_criteria = ""
        exclusion_criteria = ""
        if "Inclusion Criteria:" in criteria_text:
            parts = criteria_text.split("Exclusion Criteria:")
            inclusion_criteria = parts[0].replace("Inclusion Criteria:", "").strip()
            exclusion_criteria = parts[1].strip() if len(parts) > 1 else ""

        # Phases
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