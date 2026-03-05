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

# Reverse lookup: full state name (lowercase) -> abbreviation
STATE_NAME_TO_ABBR = {v.lower(): k for k, v in STATE_MAP.items()}

CONDITION_SYNONYMS = {
    "oncology":         "cancer OR tumor OR carcinoma OR malignancy OR neoplasm OR sarcoma OR lymphoma OR leukemia OR melanoma OR myeloma OR glioma OR blastoma",
    "cancer":           "cancer OR tumor OR carcinoma OR malignancy OR neoplasm OR sarcoma OR lymphoma OR leukemia OR melanoma OR myeloma OR glioma OR blastoma",
    "breast cancer":    "breast cancer OR breast neoplasm OR breast carcinoma OR breast tumor OR HER2 OR triple negative breast",
    "lung cancer":      "lung cancer OR lung carcinoma OR NSCLC OR non-small cell lung OR small cell lung OR pulmonary neoplasm",
    "prostate cancer":  "prostate cancer OR prostate carcinoma OR prostate neoplasm OR castration resistant prostate",
    "colon cancer":     "colon cancer OR colorectal cancer OR colorectal carcinoma OR rectal cancer OR colon neoplasm",
    "ovarian cancer":   "ovarian cancer OR ovarian carcinoma OR ovarian neoplasm OR fallopian tube cancer",
    "cervical cancer":  "cervical cancer OR cervical carcinoma OR cervical neoplasm OR HPV cancer",
    "skin cancer":      "skin cancer OR melanoma OR basal cell carcinoma OR squamous cell carcinoma OR merkel cell",
    "leukemia":         "leukemia OR AML OR CML OR ALL OR CLL OR acute myeloid OR chronic lymphocytic OR myelodysplastic",
    "lymphoma":         "lymphoma OR hodgkin OR non-hodgkin OR diffuse large B-cell OR follicular lymphoma",
    "brain tumor":      "brain tumor OR glioma OR glioblastoma OR meningioma OR brain cancer OR CNS tumor",
    "pancreatic cancer":"pancreatic cancer OR pancreatic carcinoma OR pancreatic ductal adenocarcinoma",
    "liver cancer":     "liver cancer OR hepatocellular carcinoma OR HCC OR hepatic neoplasm",
    "kidney cancer":    "kidney cancer OR renal cell carcinoma OR RCC OR renal neoplasm",
    "bladder cancer":   "bladder cancer OR urothelial carcinoma OR bladder neoplasm",
    "thyroid cancer":   "thyroid cancer OR thyroid carcinoma OR papillary thyroid OR follicular thyroid",
    "stomach cancer":   "stomach cancer OR gastric cancer OR gastric carcinoma OR gastroesophageal",
    "myeloma":          "multiple myeloma OR myeloma OR plasma cell neoplasm OR bone marrow cancer",
    "colorectal cancer":"colorectal cancer OR colon cancer OR rectal cancer OR colorectal carcinoma OR CRC",
    "cardiology":       "heart disease OR coronary artery disease OR heart failure OR hypertension OR atrial fibrillation OR cardiomyopathy OR arrhythmia OR myocardial infarction OR angina",
    "heart disease":    "heart disease OR coronary artery disease OR myocardial infarction OR angina OR cardiomyopathy OR ischemic heart disease",
    "heart failure":    "heart failure OR cardiac failure OR congestive heart failure OR cardiomyopathy",
    "coronary artery disease": "coronary artery disease OR CAD OR angina OR atherosclerosis OR myocardial infarction",
    "hypertension":     "hypertension OR high blood pressure OR arterial hypertension",
    "atrial fibrillation": "atrial fibrillation OR AFib OR atrial flutter OR cardiac arrhythmia",
    "arrhythmia":       "arrhythmia OR cardiac arrhythmia OR atrial fibrillation OR ventricular OR dysrhythmia",
    "stroke":           "stroke OR cerebrovascular OR ischemic stroke OR hemorrhagic stroke OR TIA OR transient ischemic",
    "diabetes":         "diabetes mellitus OR diabetic OR hyperglycemia OR insulin resistance OR type 2 diabetes OR type 1 diabetes",
    "type 1 diabetes":  "type 1 diabetes OR T1D OR juvenile diabetes OR insulin dependent diabetes",
    "type 2 diabetes":  "type 2 diabetes OR T2D OR adult onset diabetes OR non-insulin dependent diabetes",
    "obesity":          "obesity OR overweight OR bariatric OR adiposity OR metabolic syndrome OR weight loss",
    "thyroid disease":  "thyroid OR hypothyroidism OR hyperthyroidism OR Hashimoto OR Graves disease",
    "hypothyroidism":   "hypothyroidism OR underactive thyroid OR Hashimoto OR thyroid deficiency",
    "hyperthyroidism":  "hyperthyroidism OR overactive thyroid OR Graves disease OR thyrotoxicosis",
    # Alzheimer: use only condition-level terms, NOT generic phrases like
    # "memory loss" or "cognitive decline" — those match unrelated trials
    # (insomnia, alcohol, brain injury) that merely mention these as endpoints.
    "alzheimer":        "Alzheimer OR Alzheimer's disease OR Alzheimer disease OR amyloid OR tau pathology",
    "alzheimers":       "Alzheimer OR Alzheimer's disease OR Alzheimer disease OR amyloid OR tau pathology",
    "dementia":         "dementia OR Alzheimer OR Lewy body dementia OR vascular dementia OR frontotemporal dementia",
    "parkinson":        "Parkinson OR Parkinson's disease OR parkinsonism OR Lewy body OR alpha-synuclein",
    "parkinsons":       "Parkinson OR Parkinson's disease OR parkinsonism OR Lewy body OR alpha-synuclein",
    "multiple sclerosis": "multiple sclerosis OR MS OR demyelinating OR relapsing remitting",
    "epilepsy":         "epilepsy OR seizure OR convulsion OR anticonvulsant",
    "migraine":         "migraine OR headache OR cluster headache",
    "als":              "ALS OR amyotrophic lateral sclerosis OR motor neuron disease OR Lou Gehrig",
    "mental health":    "depression OR anxiety OR bipolar OR schizophrenia OR PTSD OR psychiatric OR psychological",
    "depression":       "depression OR major depressive disorder OR MDD OR depressive episode",
    "anxiety":          "anxiety OR generalized anxiety disorder OR GAD OR panic disorder OR social anxiety",
    "schizophrenia":    "schizophrenia OR psychosis OR schizoaffective OR antipsychotic",
    "bipolar":          "bipolar disorder OR bipolar depression OR manic depression OR mania",
    "ptsd":             "PTSD OR post-traumatic stress OR trauma OR post traumatic",
    "adhd":             "ADHD OR attention deficit OR hyperactivity disorder OR ADD",
    "autism":           "autism OR ASD OR autism spectrum disorder OR Asperger",
    "asthma":           "asthma OR bronchial asthma OR reactive airway disease",
    "copd":             "COPD OR chronic obstructive pulmonary OR emphysema OR chronic bronchitis",
    "covid":            "COVID OR SARS-CoV-2 OR coronavirus OR post-COVID OR long COVID",
    "pneumonia":        "pneumonia OR respiratory infection OR lung infection",
    "arthritis":        "arthritis OR rheumatoid arthritis OR osteoarthritis OR joint inflammation",
    "rheumatoid arthritis": "rheumatoid arthritis OR RA OR rheumatoid OR synovitis",
    "lupus":            "lupus OR SLE OR systemic lupus erythematosus OR autoimmune",
    "crohn":            "Crohn OR inflammatory bowel disease OR IBD OR Crohn's disease",
    "ulcerative colitis": "ulcerative colitis OR IBD OR inflammatory bowel OR colitis",
    "ibd":              "inflammatory bowel disease OR IBD OR Crohn OR ulcerative colitis",
    "irritable bowel":  "irritable bowel syndrome OR IBS OR functional bowel disorder",
    "gerd":             "GERD OR gastroesophageal reflux OR acid reflux OR reflux disease",
    "psoriasis":        "psoriasis OR psoriatic arthritis OR plaque psoriasis",
    "hiv":              "HIV OR AIDS OR antiretroviral OR human immunodeficiency virus",
    "hepatitis":        "hepatitis OR hepatitis B OR hepatitis C OR HBV OR HCV OR liver inflammation",
    "tuberculosis":     "tuberculosis OR TB OR mycobacterium tuberculosis",
    "kidney disease":   "kidney disease OR renal disease OR chronic kidney disease OR CKD OR renal failure OR nephropathy",
    "renal disease":    "renal disease OR kidney disease OR CKD OR chronic kidney OR nephropathy OR renal failure",
    "ckd":              "chronic kidney disease OR CKD OR renal insufficiency OR kidney failure OR nephropathy",
    "endometriosis":    "endometriosis OR endometrial OR uterine",
    "menopause":        "menopause OR menopausal OR postmenopausal OR hormone replacement",
    "chronic pain":     "chronic pain OR neuropathic pain OR fibromyalgia OR pain management",
    "fibromyalgia":     "fibromyalgia OR chronic widespread pain OR fibromyalgia syndrome",
    "melanoma":         "melanoma OR skin cancer OR cutaneous melanoma OR malignant melanoma",
    "pediatric":        "pediatric OR childhood OR children OR juvenile OR neonatal",
    "childhood":        "childhood OR pediatric OR children OR juvenile",
}

PHASE_NORMALIZE: dict[str, str] = {
    "phase1": "PHASE1", "phase 1": "PHASE1", "1": "PHASE1", "phase i": "PHASE1",
    "phase2": "PHASE2", "phase 2": "PHASE2", "2": "PHASE2", "phase ii": "PHASE2",
    "phase3": "PHASE3", "phase 3": "PHASE3", "3": "PHASE3", "phase iii": "PHASE3",
    "phase4": "PHASE4", "phase 4": "PHASE4", "4": "PHASE4", "phase iv": "PHASE4",
    "early phase 1": "EARLY_PHASE1", "early_phase1": "EARLY_PHASE1",
    "na": "NA", "n/a": "NA",
}

STATUS_NORMALIZE: dict[str, str] = {
    "recruiting":               "RECRUITING",
    "not yet recruiting":       "NOT_YET_RECRUITING",
    "not_yet_recruiting":       "NOT_YET_RECRUITING",
    "notyetrecruiting":         "NOT_YET_RECRUITING",
    "active, not recruiting":   "ACTIVE_NOT_RECRUITING",
    "active not recruiting":    "ACTIVE_NOT_RECRUITING",
    "active_not_recruiting":    "ACTIVE_NOT_RECRUITING",
    "completed":                "COMPLETED",
    "terminated":               "TERMINATED",
    "withdrawn":                "WITHDRAWN",
    "unknown":                  "UNKNOWN",
    "enrolling by invitation":  "ENROLLING_BY_INVITATION",
}


# ─────────────────────────────────────────────────────────────────────────────
# CONDITION RELEVANCE KEYWORDS
#
# The ClinicalTrials.gov query.cond field searches the entire trial record
# (title, description, keywords, interventions) — not just the conditions[].
# This means broad synonyms like "cognitive decline" or "neurodegenerative"
# pull in unrelated trials that merely mention these terms as endpoints.
#
# This map defines what must appear in a trial's actual conditions[] array
# for it to be considered relevant to the user's search. If ANY keyword here
# matches any condition string, the trial is kept. Otherwise it's dropped.
#
# Rules for good keyword sets:
#   - Match the condition name itself and close clinical synonyms
#   - Do NOT include generic endpoint words ("cognitive", "memory", "pain")
#   - Use lowercase — all comparisons are lowercased
# ─────────────────────────────────────────────────────────────────────────────
CONDITION_RELEVANCE_KEYWORDS: dict[str, list[str]] = {
    "alzheimer":         ["alzheimer", "alzheimer's"],
    "alzheimers":        ["alzheimer", "alzheimer's"],
    "dementia":          ["dementia", "alzheimer", "lewy body", "frontotemporal", "vascular dementia"],
    "parkinson":         ["parkinson", "parkinson's", "parkinsonism"],
    "parkinsons":        ["parkinson", "parkinson's", "parkinsonism"],
    "multiple sclerosis":["multiple sclerosis", "ms "],
    "als":               ["amyotrophic lateral sclerosis", "als", "motor neuron disease"],
    "epilepsy":          ["epilepsy", "epileptic", "seizure"],
    "migraine":          ["migraine", "headache"],
    "stroke":            ["stroke", "cerebrovascular", "ischemic stroke", "hemorrhagic stroke", "tia"],
    "breast cancer":     ["breast cancer", "breast neoplasm", "breast carcinoma", "breast tumor"],
    "lung cancer":       ["lung cancer", "nsclc", "small cell lung", "pulmonary neoplasm"],
    "prostate cancer":   ["prostate cancer", "prostate carcinoma", "prostate neoplasm"],
    "colon cancer":      ["colon cancer", "colorectal", "rectal cancer"],
    "colorectal cancer": ["colorectal", "colon cancer", "rectal cancer"],
    "leukemia":          ["leukemia", "aml", "cml", "all ", "cll"],
    "lymphoma":          ["lymphoma", "hodgkin", "non-hodgkin"],
    "pancreatic cancer": ["pancreatic cancer", "pancreatic carcinoma"],
    "liver cancer":      ["liver cancer", "hepatocellular", "hcc"],
    "melanoma":          ["melanoma"],
    "myeloma":           ["myeloma", "multiple myeloma"],
    "diabetes":          ["diabetes", "diabetic", "hyperglycemia"],
    "type 1 diabetes":   ["type 1 diabetes", "t1d", "juvenile diabetes"],
    "type 2 diabetes":   ["type 2 diabetes", "t2d"],
    "hypertension":      ["hypertension", "high blood pressure"],
    "heart failure":     ["heart failure", "cardiac failure", "cardiomyopathy"],
    "atrial fibrillation":["atrial fibrillation", "afib", "atrial flutter"],
    "coronary artery disease":["coronary artery disease", "cad", "angina", "atherosclerosis"],
    "asthma":            ["asthma", "bronchial asthma"],
    "copd":              ["copd", "chronic obstructive", "emphysema"],
    "rheumatoid arthritis":["rheumatoid arthritis", "ra "],
    "lupus":             ["lupus", "sle", "systemic lupus"],
    "psoriasis":         ["psoriasis", "psoriatic"],
    "crohn":             ["crohn", "crohn's", "inflammatory bowel"],
    "ulcerative colitis":["ulcerative colitis", "inflammatory bowel"],
    "hiv":               ["hiv", "aids", "human immunodeficiency"],
    "hepatitis":         ["hepatitis", "hbv", "hcv"],
    "depression":        ["depression", "major depressive", "mdd"],
    "anxiety":           ["anxiety", "generalized anxiety", "panic disorder"],
    "schizophrenia":     ["schizophrenia", "psychosis", "schizoaffective"],
    "bipolar":           ["bipolar", "manic", "bipolar disorder"],
    "ptsd":              ["ptsd", "post-traumatic stress", "post traumatic"],
    "adhd":              ["adhd", "attention deficit"],
    "autism":            ["autism", "asd", "autism spectrum"],
    "kidney disease":    ["kidney disease", "renal disease", "chronic kidney", "ckd", "nephropathy"],
    "obesity":           ["obesity", "obese", "overweight", "bariatric"],
}


def _condition_is_relevant(
    trial_conditions: list[str],
    user_condition: str,
    trial_title: str = "",
) -> bool:
    """
    Check whether a trial is relevant to the user's condition search.

    Checks in priority order:
      1. No keywords defined → always keep (safe default)
      2. conditions[] contains user term or clinical synonym → keep
      3. Trial title contains user term or clinical synonym → keep
         (catches trials listed under a broad condition like "Neurodegenerative
          Disease" but whose title clearly names the specific disease)
      4. None matched → drop

    Title check uses only the core keywords (not the full synonym string) to
    avoid re-introducing off-topic noise from broad text matches.
    """
    key = user_condition.lower().strip()
    keywords = CONDITION_RELEVANCE_KEYWORDS.get(key)

    if not keywords:
        return True

    # Pass 1: check conditions[] array
    for cond in trial_conditions:
        cond_lower = cond.lower()
        if key in cond_lower:
            return True
        if any(kw in cond_lower for kw in keywords):
            return True

    # Pass 2: check trial title as fallback
    if trial_title:
        title_lower = trial_title.lower()
        if key in title_lower:
            return True
        if any(kw in title_lower for kw in keywords):
            return True

    return False


def _normalize_phase(phase: str) -> str:
    return PHASE_NORMALIZE.get(phase.lower().strip(), phase.upper().replace(" ", ""))


def _normalize_status(status: str) -> str | None:
    if not status or not status.strip():
        return None
    return STATUS_NORMALIZE.get(status.lower().strip(), status.upper().replace(" ", "_"))


def _expand_condition(condition: str) -> str:
    if not condition or not condition.strip():
        return condition
    return CONDITION_SYNONYMS.get(condition.lower().strip(), condition)


def _is_state_input(value: str) -> bool:
    """Returns True if the value looks like a state name or abbreviation."""
    return value.upper() in STATE_MAP or value.lower() in STATE_NAME_TO_ABBR


def _expand_location(location: str, us_only: bool = True) -> str | None:
    if not location or not location.strip():
        return "United States" if us_only else None
    parts = [p.strip() for p in location.split(",")]
    expanded = []
    for part in parts:
        if part.upper() in STATE_MAP:
            expanded.append(STATE_MAP[part.upper()])
        else:
            expanded.append(part.title() if part.lower() in STATE_NAME_TO_ABBR else part)
    result = ", ".join(expanded)
    if "united states" not in result.lower():
        result = f"{result}, United States"
    return result


def fetch_trials(
    condition: str,
    location: str = "",
    specialty: str = "",
    status: str = "",
    phase: str = "",
    limit: int = 20,
    offset: int = 0,
    us_only: bool = True,
) -> tuple[list, int]:
    location_query = _expand_location(location, us_only=us_only)
    condition_query = _expand_condition(condition)

    params = {
        "query.cond": condition_query,
        "pageSize": min(limit, 1000),
        "countTotal": "true",
        "format": "json",
    }

    if location_query:
        params["query.locn"] = location_query

    if specialty and specialty.strip():
        params["query.term"] = specialty.strip()

    # Send status directly to API — avoids broken post-fetch substring matching
    if status and status.strip():
        normalized_status = _normalize_status(status)
        if normalized_status:
            params["filter.overallStatus"] = normalized_status

    # Send phase directly to API via filter.advanced
    # Previously phase was only checked post-fetch and never reached the API
    if phase and phase.strip():
        normalized_phase = _normalize_phase(phase)
        if normalized_phase and normalized_phase not in ("ALL", ""):
            params["filter.advanced"] = f"AREA[Phase]{normalized_phase}"

    if offset > 0:
        page_token = _get_page_token(params, offset)
        if page_token:
            params["pageToken"] = page_token

    try:
        response = requests.get(CLINICAL_TRIALS_BASE_URL, params=params, headers=HEADERS, timeout=15)
        response.raise_for_status()
        data = response.json()
    except requests.HTTPError as e:
        logger.error(f"ClinicalTrials HTTP error: {e.response.status_code} — params: {params}")
        return [], 0
    except requests.RequestException as e:
        logger.error(f"ClinicalTrials request failed: {e}")
        return [], 0

    studies = data.get("studies", [])
    total_count = data.get("totalCount", len(studies))
    logger.info(f"ClinicalTrials API: {len(studies)} studies (total={total_count}) params={params}")

    results = []
    for study in studies:
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

        criteria_text = protocol.get("eligibilityModule", {}).get("eligibilityCriteria", "")
        inclusion_criteria = ""
        exclusion_criteria = ""
        if "Inclusion Criteria:" in criteria_text:
            parts = criteria_text.split("Exclusion Criteria:")
            inclusion_criteria = parts[0].replace("Inclusion Criteria:", "").strip()
            exclusion_criteria = parts[1].strip() if len(parts) > 1 else ""

        results.append({
            "nctId": protocol.get("identificationModule", {}).get("nctId"),
            "title": protocol.get("identificationModule", {}).get("briefTitle"),
            "status": protocol.get("statusModule", {}).get("overallStatus"),
            "description": protocol.get("descriptionModule", {}).get("briefSummary"),
            "conditions": protocol.get("conditionsModule", {}).get("conditions", []),
            "sponsor": protocol.get("sponsorCollaboratorsModule", {}).get("leadSponsor", {}).get("name"),
            "phases": protocol.get("designModule", {}).get("phases", []),
            "locations": locations,
            "inclusionCriteria": inclusion_criteria,
            "exclusionCriteria": exclusion_criteria,
            "pointOfContact": point_of_contact,
        })

    return results, total_count


def fetch_trials_with_filters(
    filters: dict,
    limit: int = 10,
    offset: int = 0,
) -> tuple[list, int]:
    city  = (filters.get("city")  or "").strip()
    state = (filters.get("state") or "").strip()

    # If user typed a state name/abbr into the City field, treat it as state
    if city and _is_state_input(city):
        if not state:
            state = city
        city = ""

    location_str = ", ".join(filter(None, [city, state]))

    api_results, api_total = fetch_trials(
        condition=filters.get("condition", ""),
        location=location_str,
        specialty=filters.get("specialty", ""),
        status=filters.get("status", ""),
        phase=filters.get("phase", ""),
        limit=limit * 5,
        offset=offset,
        us_only=filters.get("us_only", True),
    )

    # Post-fetch filter loop
    filtered = []
    user_condition = filters.get("condition", "").strip()

    for trial in api_results:
        # ── Condition relevance check ────────────────────────────────────────
        # The API's query.cond searches full trial text, not just the conditions
        # field. Broad synonyms like "cognitive decline" or "neurodegenerative"
        # pull in trials that mention these terms in descriptions/endpoints but
        # are actually about Parkinson's, insomnia, alcohol use, etc.
        # This check verifies the trial's actual conditions[] are on-topic.
        if user_condition:
            if not _condition_is_relevant(trial.get("conditions", []), user_condition, trial.get("title", "")):
                continue

        if city or state:
            match = False
            for loc in trial.get("locations", []):
                loc_city  = (loc.get("city",  "") or "").lower()
                loc_state = (loc.get("state", "") or "").lower()
                city_ok  = not city  or city.lower() in loc_city
                # Match state by name OR abbreviation
                state_full = STATE_MAP.get(state.upper(), state).lower()
                state_ok = not state or state.lower() in loc_state or state_full in loc_state
                if city_ok and state_ok:
                    match = True
                    break
            if not match:
                continue

        filtered.append(trial)
        if len(filtered) >= limit:
            break

    logger.info(f"fetch_trials_with_filters: {len(filtered)} results (api_total={api_total}) filters={filters}")
    return filtered, api_total


# Alias so both trials.py import names work
fetch_trials_accurate = fetch_trials_with_filters


def _get_filter_keywords(condition: str) -> list[str]:
    return []


def _get_page_token(base_params: dict, offset: int) -> str | None:
    params = {**base_params, "pageSize": offset}
    try:
        r = requests.get(CLINICAL_TRIALS_BASE_URL, params=params, headers=HEADERS, timeout=15)
        r.raise_for_status()
        return r.json().get("nextPageToken")
    except Exception as e:
        logger.warning(f"Could not retrieve page token: {e}")
        return None