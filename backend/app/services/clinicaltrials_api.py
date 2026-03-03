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

CONDITION_SYNONYMS = {
    "oncology": "cancer OR tumor OR carcinoma OR malignancy OR neoplasm OR sarcoma OR lymphoma OR leukemia OR melanoma OR myeloma OR glioma OR blastoma",
    "cancer": "cancer OR tumor OR carcinoma OR malignancy OR neoplasm OR sarcoma OR lymphoma OR leukemia OR melanoma OR myeloma OR glioma OR blastoma",
    "breast cancer": "breast cancer OR breast neoplasm OR breast carcinoma OR breast tumor OR HER2 OR triple negative breast",
    "lung cancer": "lung cancer OR lung carcinoma OR NSCLC OR non-small cell lung OR small cell lung OR pulmonary neoplasm",
    "prostate cancer": "prostate cancer OR prostate carcinoma OR prostate neoplasm OR castration resistant prostate",
    "colon cancer": "colon cancer OR colorectal cancer OR colorectal carcinoma OR rectal cancer OR colon neoplasm",
    "ovarian cancer": "ovarian cancer OR ovarian carcinoma OR ovarian neoplasm OR fallopian tube cancer",
    "cervical cancer": "cervical cancer OR cervical carcinoma OR cervical neoplasm OR HPV cancer",
    "skin cancer": "skin cancer OR melanoma OR basal cell carcinoma OR squamous cell carcinoma OR merkel cell",
    "leukemia": "leukemia OR AML OR CML OR ALL OR CLL OR acute myeloid OR chronic lymphocytic OR myelodysplastic",
    "lymphoma": "lymphoma OR hodgkin OR non-hodgkin OR diffuse large B-cell OR follicular lymphoma",
    "brain tumor": "brain tumor OR glioma OR glioblastoma OR meningioma OR brain cancer OR CNS tumor",
    "pancreatic cancer": "pancreatic cancer OR pancreatic carcinoma OR pancreatic ductal adenocarcinoma",
    "liver cancer": "liver cancer OR hepatocellular carcinoma OR HCC OR hepatic neoplasm",
    "kidney cancer": "kidney cancer OR renal cell carcinoma OR RCC OR renal neoplasm",
    "bladder cancer": "bladder cancer OR urothelial carcinoma OR bladder neoplasm",
    "thyroid cancer": "thyroid cancer OR thyroid carcinoma OR papillary thyroid OR follicular thyroid",
    "stomach cancer": "stomach cancer OR gastric cancer OR gastric carcinoma OR gastroesophageal",
    "cardiology": "cardiac OR cardiovascular OR coronary OR heart failure OR arrhythmia OR myocardial OR heart disease",
    "heart disease": "cardiac OR cardiovascular OR coronary OR heart failure OR arrhythmia OR myocardial",
    "heart failure": "heart failure OR cardiac failure OR congestive heart failure OR cardiomyopathy",
    "coronary artery disease": "coronary artery disease OR CAD OR angina OR atherosclerosis OR myocardial infarction",
    "hypertension": "hypertension OR high blood pressure OR arterial hypertension",
    "atrial fibrillation": "atrial fibrillation OR AFib OR atrial flutter OR cardiac arrhythmia",
    "stroke": "stroke OR cerebrovascular OR ischemic stroke OR hemorrhagic stroke OR TIA OR transient ischemic",
    "diabetes": "diabetes mellitus OR diabetic OR hyperglycemia OR insulin resistance OR type 2 diabetes OR type 1 diabetes",
    "type 1 diabetes": "type 1 diabetes OR T1D OR juvenile diabetes OR insulin dependent diabetes",
    "type 2 diabetes": "type 2 diabetes OR T2D OR adult onset diabetes OR non-insulin dependent diabetes",
    "obesity": "obesity OR overweight OR bariatric OR adiposity OR metabolic syndrome OR weight loss",
    "thyroid disease": "thyroid OR hypothyroidism OR hyperthyroidism OR Hashimoto OR Graves disease",
    "alzheimer": "Alzheimer OR dementia OR cognitive decline OR memory loss OR neurodegenerative",
    "alzheimers": "Alzheimer OR dementia OR cognitive decline OR memory loss OR neurodegenerative",
    "parkinson": "Parkinson OR parkinsonism OR Lewy body OR dopaminergic",
    "parkinsons": "Parkinson OR parkinsonism OR Lewy body OR dopaminergic",
    "multiple sclerosis": "multiple sclerosis OR MS OR demyelinating OR relapsing remitting",
    "epilepsy": "epilepsy OR seizure OR convulsion OR anticonvulsant",
    "migraine": "migraine OR headache OR cluster headache",
    "als": "ALS OR amyotrophic lateral sclerosis OR motor neuron disease OR Lou Gehrig",
    "mental health": "depression OR anxiety OR bipolar OR schizophrenia OR PTSD OR psychiatric OR psychological",
    "depression": "depression OR major depressive disorder OR MDD OR depressive episode",
    "anxiety": "anxiety OR generalized anxiety disorder OR GAD OR panic disorder OR social anxiety",
    "schizophrenia": "schizophrenia OR psychosis OR schizoaffective OR antipsychotic",
    "bipolar": "bipolar disorder OR bipolar depression OR manic depression OR mania",
    "ptsd": "PTSD OR post-traumatic stress OR trauma OR post traumatic",
    "adhd": "ADHD OR attention deficit OR hyperactivity disorder OR ADD",
    "autism": "autism OR ASD OR autism spectrum disorder OR Asperger",
    "asthma": "asthma OR bronchial asthma OR reactive airway disease",
    "copd": "COPD OR chronic obstructive pulmonary OR emphysema OR chronic bronchitis",
    "covid": "COVID OR SARS-CoV-2 OR coronavirus OR post-COVID OR long COVID",
    "pneumonia": "pneumonia OR respiratory infection OR lung infection",
    "arthritis": "arthritis OR rheumatoid arthritis OR osteoarthritis OR joint inflammation",
    "rheumatoid arthritis": "rheumatoid arthritis OR RA OR rheumatoid OR synovitis",
    "lupus": "lupus OR SLE OR systemic lupus erythematosus OR autoimmune",
    "crohn": "Crohn OR inflammatory bowel disease OR IBD OR Crohn's disease",
    "ulcerative colitis": "ulcerative colitis OR IBD OR inflammatory bowel OR colitis",
    "psoriasis": "psoriasis OR psoriatic arthritis OR plaque psoriasis",
    "hiv": "HIV OR AIDS OR antiretroviral OR human immunodeficiency virus",
    "hepatitis": "hepatitis OR hepatitis B OR hepatitis C OR HBV OR HCV OR liver inflammation",
    "tuberculosis": "tuberculosis OR TB OR mycobacterium tuberculosis",
    "kidney disease": "kidney disease OR renal disease OR chronic kidney disease OR CKD OR renal failure OR nephropathy",
    "endometriosis": "endometriosis OR endometrial OR uterine",
    "menopause": "menopause OR menopausal OR postmenopausal OR hormone replacement",
    "chronic pain": "chronic pain OR neuropathic pain OR fibromyalgia OR pain management",
    "fibromyalgia": "fibromyalgia OR chronic widespread pain OR fibromyalgia syndrome",
}


def _expand_condition(condition: str) -> str:
    if not condition or not condition.strip():
        return condition
    return CONDITION_SYNONYMS.get(condition.lower().strip(), condition)


def _expand_location(location: str) -> str | None:
    if not location or not location.strip():
        return None
    parts = [p.strip() for p in location.split(",")]
    expanded = [STATE_MAP.get(p.upper(), p) for p in parts]
    result = ", ".join(expanded)
    if "united states" not in result.lower():
        result = f"{result}, United States"
    return result


def fetch_trials(
    condition: str,
    location: str = "",
    limit: int = 20,
    offset: int = 0,
) -> tuple[list, int]:
    location_query = _expand_location(location)
    condition_query = _expand_condition(condition)

    params = {
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
        response = requests.get(CLINICAL_TRIALS_BASE_URL, params=params, headers=HEADERS, timeout=15)
        response.raise_for_status()
        data = response.json()
    except requests.HTTPError as e:
        logger.error(f"ClinicalTrials HTTP error: {e.response.status_code}")
        return [], 0
    except requests.RequestException as e:
        logger.error(f"ClinicalTrials request failed: {e}")
        return [], 0

    studies = data.get("studies", [])
    total_count = data.get("totalCount", len(studies))
    logger.info(f"ClinicalTrials returned {len(studies)} studies (total={total_count})")

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
    location_str = ", ".join(filter(None, [filters.get("city"), filters.get("state")]))
    condition_str = filters.get("condition", "")

    api_results, _ = fetch_trials(
        condition=condition_str,
        location=location_str,
        limit=limit * 3,
        offset=offset,
    )

    filtered = []
    for trial in api_results:
        if filters.get("condition"):
            trial_conds = [c.lower() for c in trial.get("conditions", [])]
            if not any(filters["condition"].lower() in c for c in trial_conds):
                continue

        if filters.get("status"):
            if filters["status"].upper() not in trial.get("status", "").upper():
                continue

        if filters.get("phase"):
            phases = [p.upper() for p in trial.get("phases", [])]
            if not any(filters["phase"].upper() in p for p in phases):
                continue

        if filters.get("city") or filters.get("state"):
            match = False
            for loc in trial.get("locations", []):
                city_ok  = not filters.get("city")  or filters["city"].lower()  in (loc.get("city",  "") or "").lower()
                state_ok = not filters.get("state") or filters["state"].lower() in (loc.get("state", "") or "").lower()
                if city_ok and state_ok:
                    match = True
                    break
            if not match:
                continue

        filtered.append(trial)
        if len(filtered) >= limit:
            break

    logger.info(f"fetch_trials_with_filters: {len(filtered)} results for filters={filters}")
    return filtered, len(filtered)


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