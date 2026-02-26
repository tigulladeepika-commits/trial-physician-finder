import requests

CLINICAL_TRIALS_BASE_URL = "https://clinicaltrials.gov/api/v2/studies"

HEADERS = {
    "User-Agent": "TrialPhysicianFinder/1.0 (contact@example.com)"
}

def fetch_trials(condition: str, state: str, limit: int = 10, offset: int = 0):
    params = {
        "query.cond": condition,
        "query.locn": state,
        "pageSize": limit,
        "format": "json",
    }

    response = requests.get(CLINICAL_TRIALS_BASE_URL, params=params, headers=HEADERS, timeout=15)
    response.raise_for_status()

    data = response.json()
    return data.get("studies", [])