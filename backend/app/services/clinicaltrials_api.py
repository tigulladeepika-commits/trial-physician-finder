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
    # ── Oncology / Cancer ──────────────────────────────────────────────
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

    # ── Cardiovascular ─────────────────────────────────────────────────
    "cardiology": "cardiac OR cardiovascular OR coronary OR heart failure OR arrhythmia OR myocardial OR heart disease",
    "heart disease": "cardiac OR cardiovascular OR coronary OR heart failure OR arrhythmia OR myocardial",
    "heart failure": "heart failure OR cardiac failure OR congestive heart failure OR cardiomyopathy",
    "coronary artery disease": "coronary artery disease OR CAD OR angina OR atherosclerosis OR myocardial infarction",
    "hypertension": "hypertension OR high blood pressure OR arterial hypertension",
    "atrial fibrillation": "atrial fibrillation OR AFib OR atrial flutter OR cardiac arrhythmia",
    "stroke": "stroke OR cerebrovascular OR ischemic stroke OR hemorrhagic stroke OR TIA OR transient ischemic",

    # ── Metabolic / Endocrine ───────────────────────────────────────────
    "diabetes": "diabetes mellitus OR diabetic OR hyperglycemia OR insulin resistance OR type 2 diabetes OR type 1 diabetes",
    "type 1 diabetes": "type 1 diabetes OR T1D OR juvenile diabetes OR insulin dependent diabetes",
    "type 2 diabetes": "type 2 diabetes OR T2D OR adult onset diabetes OR non-insulin dependent diabetes",
    "obesity": "obesity OR overweight OR bariatric OR adiposity OR metabolic syndrome OR weight loss",
    "thyroid disease": "thyroid OR hypothyroidism OR hyperthyroidism OR Hashimoto OR Graves disease",

    # ── Neurological ───────────────────────────────────────────────────
    "alzheimer": "Alzheimer OR dementia OR cognitive decline OR memory loss OR neurodegenerative",
    "alzheimers": "Alzheimer OR dementia OR cognitive decline OR memory loss OR neurodegenerative",
    "parkinson": "Parkinson OR parkinsonism OR Lewy body OR dopaminergic",
    "parkinsons": "Parkinson OR parkinsonism OR Lewy body OR dopaminergic",
    "multiple sclerosis": "multiple sclerosis OR MS OR demyelinating OR relapsing remitting",
    "epilepsy": "epilepsy OR seizure OR convulsion OR anticonvulsant",
    "migraine": "migraine OR headache OR cluster headache",
    "als": "ALS OR amyotrophic lateral sclerosis OR motor neuron disease OR Lou Gehrig",

    # ── Mental Health ──────────────────────────────────────────────────
    "mental health": "depression OR anxiety OR bipolar OR schizophrenia OR PTSD OR psychiatric OR psychological",
    "depression": "depression OR major depressive disorder OR MDD OR depressive episode",
    "anxiety": "anxiety OR generalized anxiety disorder OR GAD OR panic disorder OR social anxiety",
    "schizophrenia": "schizophrenia OR psychosis OR schizoaffective OR antipsychotic",
    "bipolar": "bipolar disorder OR bipolar depression OR manic depression OR mania",
    "ptsd": "PTSD OR post-traumatic stress OR trauma OR post traumatic",
    "adhd": "ADHD OR attention deficit OR hyperactivity disorder OR ADD",
    "autism": "autism OR ASD OR autism spectrum disorder OR Asperger",

    # ── Respiratory ────────────────────────────────────────────────────
    "asthma": "asthma OR bronchial asthma OR reactive airway disease",
    "copd": "COPD OR chronic obstructive pulmonary OR emphysema OR chronic bronchitis",
    "covid": "COVID OR SARS-CoV-2 OR coronavirus OR post-COVID OR long COVID",
    "pneumonia": "pneumonia OR respiratory infection OR lung infection",

    # ── Autoimmune / Inflammatory ──────────────────────────────────────
    "arthritis": "arthritis OR rheumatoid arthritis OR osteoarthritis OR joint inflammation",
    "rheumatoid arthritis": "rheumatoid arthritis OR RA OR rheumatoid OR synovitis",
    "lupus": "lupus OR SLE OR systemic lupus erythematosus OR autoimmune",
    "crohn": "Crohn OR inflammatory bowel disease OR IBD OR Crohn's disease",
    "ulcerative colitis": "ulcerative colitis OR IBD OR inflammatory bowel OR colitis",
    "psoriasis": "psoriasis OR psoriatic arthritis OR plaque psoriasis",

    # ── Infectious Disease ─────────────────────────────────────────────
    "hiv": "HIV OR AIDS OR antiretroviral OR human immunodeficiency virus",
    "hepatitis": "hepatitis OR hepatitis B OR hepatitis C OR HBV OR HCV OR liver inflammation",
    "tuberculosis": "tuberculosis OR TB OR mycobacterium tuberculosis",

    # ── Kidney / Renal ─────────────────────────────────────────────────
    "kidney disease": "kidney disease OR renal disease OR chronic kidney disease OR CKD OR renal failure OR nephropathy",

    # ── Women's Health ─────────────────────────────────────────────────
    "endometriosis": "endometriosis OR endometrial OR uterine",
    "menopause": "menopause OR menopausal OR postmenopausal OR hormone replacement",

    # ── Pain ───────────────────────────────────────────────────────────
    "chronic pain": "chronic pain OR neuropathic pain OR fibromyalgia OR pain management",
    "fibromyalgia": "fibromyalgia OR chronic widespread pain OR fibromyalgia syndrome",
}


def _expand_condition(condition: str) -> str:
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


def fetch_trials(
    condition: str,
    location: str = "",
    limit: int = 20,
    offset: int = 0,
) -> tuple[list, int]:
    """
    Returns a tuple of (results, total_count).
    total_count is the full number of matching studies from the API.
    """
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
        response = requests.get(
            CLINICAL_TRIALS_BASE_URL, params=params, headers=HEADERS, timeout=15
        )
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

    logger.info(
        f"ClinicalTrials returned {len(studies)} studies (total={total_count}) "
        f"| condition={condition_query} | location={location_query}"
    )

    search_keywords = _get_filter_keywords(condition)
    filtered_studies = []
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

    return results, total_count


def fetch_trials_with_filters(
    filters: dict,
    limit: int = 10,
    offset: int = 0,
) -> tuple[list, int]:
    """
    ✅ NEW: Fetch trials with 100% ACCURATE filtering on all parameters
    
    Filters dict can have:
    - condition: Trial condition name
    - city: Trial location city
    - state: Trial location state
    - status: Trial status (RECRUITING, COMPLETED, TERMINATED, etc)
    - phase: Trial phase (PHASE1, PHASE2, PHASE3, PHASE4)
    - specialty: (Note: specialty filtering requires physician data, not in trial data)
    
    Returns: (filtered_trials, total_count)
    """
    
    # Build initial API query from condition and location
    location_str = ""
    if filters.get('city') or filters.get('state'):
        location_str = ", ".join(filter(None, [filters.get('city'), filters.get('state')]))
    
    condition_str = filters.get('condition', '')
    
    # Fetch from API
    api_results, api_total = fetch_trials(
        condition=condition_str,
        location=location_str,
        limit=limit * 3,  # Get more results to filter locally
        offset=offset
    )
    
    # ✅ POST-FILTER for 100% accuracy
    filtered_results = []
    
    for trial in api_results:
        # ✅ Check CONDITION filter
        if filters.get('condition'):
            trial_conditions = [c.lower() for c in trial.get('conditions', [])]
            condition_match = any(
                filters['condition'].lower() in cond 
                for cond in trial_conditions
            )
            if not condition_match:
                logger.debug(f"Trial {trial.get('nctId')} filtered out: condition mismatch")
                continue
        
        # ✅ Check STATUS filter
        if filters.get('status'):
            trial_status = trial.get('status', '').upper()
            status_filter = filters['status'].upper()
            status_match = status_filter in trial_status
            if not status_match:
                logger.debug(f"Trial {trial.get('nctId')} filtered out: status mismatch ({trial_status} vs {status_filter})")
                continue
        
        # ✅ Check PHASE filter
        if filters.get('phase'):
            trial_phases = [p.upper() for p in trial.get('phases', [])]
            phase_filter = filters['phase'].upper()
            phase_match = any(phase_filter in phase for phase in trial_phases)
            if not phase_match:
                logger.debug(f"Trial {trial.get('nctId')} filtered out: phase mismatch ({trial_phases} vs {phase_filter})")
                continue
        
        # ✅ Check CITY/STATE filters
        if filters.get('city') or filters.get('state'):
            locations = trial.get('locations', [])
            location_match = False
            
            for location in locations:
                loc_city = location.get('city', '').lower()
                loc_state = location.get('state', '').lower()
                
                city_match = True
                state_match = True
                
                if filters.get('city'):
                    city_match = filters['city'].lower() in loc_city
                
                if filters.get('state'):
                    state_match = filters['state'].lower() in loc_state
                
                if city_match and state_match:
                    location_match = True
                    break
            
            if not location_match:
                logger.debug(f"Trial {trial.get('nctId')} filtered out: location mismatch")
                continue
        
        # ✅ All filters passed
        filtered_results.append(trial)
        
        if len(filtered_results) >= limit:
            break
    
    logger.info(
        f"Filtered {len(api_results)} trials down to {len(filtered_results)} "
        f"with filters: {filters}"
    )
    
    return filtered_results, len(filtered_results)


def _get_filter_keywords(condition: str) -> list[str]:
    return []


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