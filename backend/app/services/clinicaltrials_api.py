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
            "ConditionsModule,SponsorCollaboratorsModule"
        ),
    }

    # ClinicalTrials v2 uses page tokens for pagination, not numeric offset
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

    # Flatten each study so trials.py can access modules directly
    results = []
    for study in studies:
        protocol = study.get("protocolSection", {})
        results.append({
            "nctId": protocol.get("identificationModule", {}).get("nctId"),
            "title": protocol.get("identificationModule", {}).get("briefTitle"),
            "status": protocol.get("statusModule", {}).get("overallStatus"),
            "description": protocol.get("descriptionModule", {}).get("briefSummary"),
            "contactsLocationsModule": protocol.get("contactsLocationsModule", {}),
            "conditions": protocol.get("conditionsModule", {}).get("conditions", []),
            "sponsor": protocol.get("sponsorCollaboratorsModule", {}).get("leadSponsor", {}).get("name"),
        })

    return results


def _get_page_token(base_params: dict, offset: int) -> str | None:
    """
    ClinicalTrials v2 paginates via nextPageToken, not numeric offset.
    Walk pages until we reach the right one.
    """
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