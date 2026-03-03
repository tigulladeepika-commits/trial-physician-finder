import requests
import logging

logger = logging.getLogger(__name__)

CLINICAL_TRIALS_BASE_URL = "https://clinicaltrials.gov/api/v2/studies"
HEADERS = {"User-Agent": "TrialPhysicianFinder/1.0 (contact@example.com)"}

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
    lower = condition.lower().strip()
    return CONDITION_SYNONYMS.get(lower, condition)

def fetch_trials(condition: str, location: str = "", limit: int = 20, offset: int = 0) -> tuple[list, int]:
    """US-ONLY trials with precise city/state/recruiting filters"""
    condition_query = _expand_condition(condition)
    
    # ✅ US-ONLY PRECISE FILTERS
    params = {
        "query.cond": condition_query,
        "filter.locn.country": "United States",      # US ONLY
        "filter.recrt": "RECRUITING",               # Active trials only
        "pageSize": limit,
        "countTotal": "true",
        "format": "json",
    }
    
    # Parse location: "Dallas, TX" → city="Dallas", state="TX"
    if location:
        parts = [p.strip() for p in location.split(",")]
        if len(parts) >= 1 and parts[0]:
            params["filter.locn.city"] = parts[0]  # Exact city match
        if len(parts) >= 2 and len(parts[1]) >= 2:
            state_code = parts[1].strip().upper()[:2]
            if state_code in STATE_MAP:
                params["filter.locn.state"] = state_code  # Exact state

    try:
        response = requests.get(CLINICAL_TRIALS_BASE_URL, params=params, headers=HEADERS, timeout=15)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as e:
        logger.error(f"ClinicalTrials request failed: {e}")
        return [], 0

    studies = data.get("studies", [])
    total_count = data.get("totalCount", len(studies))

    logger.info(f"US-ONLY: {len(studies)} recruiting trials (total={total_count}) | {condition_query}")

    # Process studies (keep your existing processing logic)
    results = []
    for study in studies:
        protocol = study.get("protocolSection", {})
        locations_module = protocol.get("contactsLocationsModule", {})
        
        locations = [{
            "facility": loc.get("facility"),
            "city": loc.get("city"), 
            "state": loc.get("state"),
            "country": loc.get("country"),
            "status": loc.get("recruitmentStatus"),
            "lat": loc.get("geoPoint", {}).get("lat"),
            "lon": loc.get("geoPoint", {}).get("lon"),
        } for loc in locations_module.get("locations", [])]

        results.append({
            "nctId": protocol.get("identificationModule", {}).get("nctId"),
            "title": protocol.get("identificationModule", {}).get("briefTitle"),
            "status": protocol.get("statusModule", {}).get("overallStatus"),
            "description": protocol.get("descriptionModule", {}).get("briefSummary"),
            "conditions": protocol.get("conditionsModule", {}).get("conditions", []),
            "sponsor": protocol.get("sponsorCollaboratorsModule", {}).get("leadSponsor", {}).get("name"),
            "locations": [loc for loc in locations if loc["country"] == "United States"],  # US only
        })

    return results, total_count

