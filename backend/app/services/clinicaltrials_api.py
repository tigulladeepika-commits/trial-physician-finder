import requests

CLINICAL_TRIALS_BASE_URL = "https://clinicaltrials.gov/api/v2/studies"


def fetch_trials(condition: str, state: str):
    """
    Fetch clinical trials by condition and state from ClinicalTrials.gov API.
    """
    params = {
        "query.cond": condition,
        "query.locn": state,
        "pageSize": 20,
    }

    response = requests.get(CLINICAL_TRIALS_BASE_URL, params=params, timeout=15)
    response.raise_for_status()

    data = response.json()
    return data.get("studies", [])