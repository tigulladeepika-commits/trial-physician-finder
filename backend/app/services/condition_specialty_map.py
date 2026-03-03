"""
Maps a condition string to one or more physician specialties.
Used to query the NPI / physician database with the right specialty filters.
"""

# condition (lowercase) → list of NPI taxonomy specialties to search
CONDITION_TO_SPECIALTIES: dict[str, list[str]] = {
    # ── Oncology ───────────────────────────────────────────────────────
    "cancer":               ["Hematology & Oncology", "Medical Oncology", "Surgical Oncology", "Radiation Oncology"],
    "oncology":             ["Hematology & Oncology", "Medical Oncology", "Surgical Oncology", "Radiation Oncology"],
    "breast cancer":        ["Medical Oncology", "Surgical Oncology", "Hematology & Oncology"],
    "lung cancer":          ["Medical Oncology", "Pulmonary Disease", "Hematology & Oncology"],
    "prostate cancer":      ["Medical Oncology", "Urology", "Radiation Oncology"],
    "colon cancer":         ["Medical Oncology", "Colon & Rectal Surgery", "Gastroenterology"],
    "colorectal cancer":    ["Medical Oncology", "Colon & Rectal Surgery", "Gastroenterology"],
    "ovarian cancer":       ["Medical Oncology", "Obstetrics & Gynecology", "Gynecologic Oncology"],
    "cervical cancer":      ["Gynecologic Oncology", "Medical Oncology", "Obstetrics & Gynecology"],
    "skin cancer":          ["Dermatology", "Medical Oncology", "Surgical Oncology"],
    "melanoma":             ["Dermatology", "Medical Oncology", "Surgical Oncology"],
    "leukemia":             ["Hematology & Oncology", "Hematology", "Medical Oncology"],
    "lymphoma":             ["Hematology & Oncology", "Hematology", "Medical Oncology"],
    "brain tumor":          ["Neurological Surgery", "Medical Oncology", "Neurology"],
    "pancreatic cancer":    ["Medical Oncology", "Gastroenterology", "Surgical Oncology"],
    "liver cancer":         ["Medical Oncology", "Gastroenterology", "Surgical Oncology"],
    "kidney cancer":        ["Medical Oncology", "Urology", "Nephrology"],
    "bladder cancer":       ["Urology", "Medical Oncology"],
    "thyroid cancer":       ["Endocrinology", "Surgical Oncology", "Medical Oncology"],
    "stomach cancer":       ["Medical Oncology", "Gastroenterology", "Surgical Oncology"],
    "myeloma":              ["Hematology & Oncology", "Hematology"],

    # ── Cardiovascular ─────────────────────────────────────────────────
    "heart disease":        ["Cardiovascular Disease", "Interventional Cardiology", "Cardiac Surgery"],
    "heart failure":        ["Cardiovascular Disease", "Interventional Cardiology"],
    "coronary artery disease": ["Cardiovascular Disease", "Interventional Cardiology"],
    "hypertension":         ["Cardiovascular Disease", "Internal Medicine", "Family Medicine"],
    "atrial fibrillation":  ["Cardiovascular Disease", "Clinical Cardiac Electrophysiology"],
    "arrhythmia":           ["Cardiovascular Disease", "Clinical Cardiac Electrophysiology"],
    "stroke":               ["Neurology", "Vascular Neurology", "Cardiovascular Disease"],

    # ── Metabolic / Endocrine ───────────────────────────────────────────
    "diabetes":             ["Endocrinology, Diabetes & Metabolism", "Internal Medicine", "Family Medicine"],
    "type 1 diabetes":      ["Endocrinology, Diabetes & Metabolism", "Pediatrics"],
    "type 2 diabetes":      ["Endocrinology, Diabetes & Metabolism", "Internal Medicine", "Family Medicine"],
    "obesity":              ["Endocrinology, Diabetes & Metabolism", "Internal Medicine", "Bariatric Medicine"],
    "thyroid disease":      ["Endocrinology, Diabetes & Metabolism"],
    "hypothyroidism":       ["Endocrinology, Diabetes & Metabolism", "Internal Medicine"],
    "hyperthyroidism":      ["Endocrinology, Diabetes & Metabolism"],

    # ── Neurological ───────────────────────────────────────────────────
    "alzheimer":            ["Neurology", "Geriatric Medicine", "Psychiatry & Neurology"],
    "alzheimers":           ["Neurology", "Geriatric Medicine", "Psychiatry & Neurology"],
    "dementia":             ["Neurology", "Geriatric Medicine", "Psychiatry & Neurology"],
    "parkinson":            ["Neurology", "Movement Disorders"],
    "parkinsons":           ["Neurology", "Movement Disorders"],
    "multiple sclerosis":   ["Neurology"],
    "epilepsy":             ["Neurology", "Clinical Neurophysiology"],
    "migraine":             ["Neurology", "Pain Medicine"],
    "als":                  ["Neurology"],

    # ── Mental Health ──────────────────────────────────────────────────
    "mental health":        ["Psychiatry", "Psychology", "Behavioral Health"],
    "depression":           ["Psychiatry", "Psychology", "Internal Medicine"],
    "anxiety":              ["Psychiatry", "Psychology"],
    "schizophrenia":        ["Psychiatry"],
    "bipolar":              ["Psychiatry", "Psychology"],
    "ptsd":                 ["Psychiatry", "Psychology"],
    "adhd":                 ["Psychiatry", "Pediatrics", "Neurology"],
    "autism":               ["Psychiatry", "Pediatrics", "Neurology"],

    # ── Respiratory ────────────────────────────────────────────────────
    "asthma":               ["Pulmonary Disease", "Allergy & Immunology", "Internal Medicine"],
    "copd":                 ["Pulmonary Disease", "Internal Medicine"],
    "covid":                ["Infectious Disease", "Pulmonary Disease", "Internal Medicine"],
    "pneumonia":            ["Pulmonary Disease", "Infectious Disease", "Internal Medicine"],

    # ── Autoimmune / Inflammatory ──────────────────────────────────────
    "arthritis":            ["Rheumatology", "Internal Medicine", "Orthopedic Surgery"],
    "rheumatoid arthritis": ["Rheumatology"],
    "lupus":                ["Rheumatology", "Internal Medicine"],
    "crohn":                ["Gastroenterology", "Internal Medicine"],
    "ulcerative colitis":   ["Gastroenterology", "Internal Medicine"],
    "psoriasis":            ["Dermatology", "Rheumatology"],

    # ── Infectious Disease ─────────────────────────────────────────────
    "hiv":                  ["Infectious Disease", "Internal Medicine"],
    "hepatitis":            ["Gastroenterology", "Infectious Disease", "Internal Medicine"],
    "tuberculosis":         ["Infectious Disease", "Pulmonary Disease"],

    # ── Kidney / Renal ─────────────────────────────────────────────────
    "kidney disease":       ["Nephrology", "Internal Medicine"],
    "renal disease":        ["Nephrology"],
    "ckd":                  ["Nephrology", "Internal Medicine"],

    # ── Women's Health ─────────────────────────────────────────────────
    "endometriosis":        ["Obstetrics & Gynecology", "Reproductive Endocrinology"],
    "menopause":            ["Obstetrics & Gynecology", "Endocrinology, Diabetes & Metabolism"],

    # ── Pain ───────────────────────────────────────────────────────────
    "chronic pain":         ["Pain Medicine", "Anesthesiology", "Physical Medicine & Rehabilitation"],
    "fibromyalgia":         ["Rheumatology", "Pain Medicine", "Internal Medicine"],

    # ── Gastrointestinal ───────────────────────────────────────────────
    "ibd":                  ["Gastroenterology", "Internal Medicine"],
    "irritable bowel":      ["Gastroenterology", "Internal Medicine"],
    "gerd":                 ["Gastroenterology", "Internal Medicine"],

    # ── Pediatric ──────────────────────────────────────────────────────
    "pediatric":            ["Pediatrics", "Pediatric Medicine"],
    "childhood":            ["Pediatrics"],

    # ── Fallback ───────────────────────────────────────────────────────
    "general":              ["Internal Medicine", "Family Medicine", "General Practice"],
}

# Partial keyword fallbacks (checked if exact match fails)
KEYWORD_SPECIALTY_MAP: list[tuple[str, list[str]]] = [
    ("cancer",      ["Hematology & Oncology", "Medical Oncology"]),
    ("tumor",       ["Hematology & Oncology", "Medical Oncology", "Surgical Oncology"]),
    ("cardiac",     ["Cardiovascular Disease"]),
    ("heart",       ["Cardiovascular Disease"]),
    ("neuro",       ["Neurology"]),
    ("brain",       ["Neurology", "Neurological Surgery"]),
    ("lung",        ["Pulmonary Disease"]),
    ("pulmon",      ["Pulmonary Disease"]),
    ("kidney",      ["Nephrology"]),
    ("renal",       ["Nephrology"]),
    ("liver",       ["Gastroenterology"]),
    ("hepat",       ["Gastroenterology", "Infectious Disease"]),
    ("gastro",      ["Gastroenterology"]),
    ("diabetes",    ["Endocrinology, Diabetes & Metabolism"]),
    ("thyroid",     ["Endocrinology, Diabetes & Metabolism"]),
    ("skin",        ["Dermatology"]),
    ("bone",        ["Orthopedic Surgery", "Rheumatology"]),
    ("blood",       ["Hematology & Oncology", "Hematology"]),
    ("immune",      ["Allergy & Immunology", "Rheumatology"]),
    ("infect",      ["Infectious Disease"]),
    ("psych",       ["Psychiatry"]),
    ("mental",      ["Psychiatry", "Psychology"]),
    ("pain",        ["Pain Medicine", "Anesthesiology"]),
    ("arthrit",     ["Rheumatology"]),
    ("urin",        ["Urology"]),
    ("prostat",     ["Urology"]),
    ("bladder",     ["Urology"]),
]

DEFAULT_SPECIALTIES = ["Internal Medicine", "Family Medicine"]

# FIX Bug 5: Conditions that exist in CONDITION_TO_SPECIALTIES but were missing
# from CONDITION_SYNONYMS in clinicaltrial_api.py. These expansions should be
# added to CONDITION_SYNONYMS to keep both files in sync.
MISSING_CONDITION_SYNONYMS: dict[str, str] = {
    "myeloma":          "multiple myeloma OR myeloma OR plasma cell neoplasm OR bone marrow cancer",
    "colorectal cancer":"colorectal cancer OR colon cancer OR rectal cancer OR colorectal carcinoma OR CRC",
    "ibd":              "inflammatory bowel disease OR IBD OR Crohn OR ulcerative colitis",
    "irritable bowel":  "irritable bowel syndrome OR IBS OR functional bowel disorder",
    "gerd":             "GERD OR gastroesophageal reflux OR acid reflux OR reflux disease",
    "renal disease":    "renal disease OR kidney disease OR CKD OR chronic kidney OR nephropathy OR renal failure",
    "ckd":              "chronic kidney disease OR CKD OR renal insufficiency OR kidney failure OR nephropathy",
    "dementia":         "dementia OR Alzheimer OR cognitive decline OR memory loss OR neurodegenerative",
    "arrhythmia":       "arrhythmia OR cardiac arrhythmia OR atrial fibrillation OR ventricular OR dysrhythmia",
    "hypothyroidism":   "hypothyroidism OR underactive thyroid OR Hashimoto OR thyroid deficiency",
    "hyperthyroidism":  "hyperthyroidism OR overactive thyroid OR Graves disease OR thyrotoxicosis",
    "melanoma":         "melanoma OR skin cancer OR cutaneous melanoma OR malignant melanoma",
    "pediatric":        "pediatric OR childhood OR children OR juvenile OR neonatal",
    "childhood":        "childhood OR pediatric OR children OR juvenile",
}


def get_specialties_for_condition(condition: str) -> list[str]:
    """
    Returns an ordered list of physician specialties relevant to the given condition.
    Falls back to keyword matching, then to general internal medicine.
    """
    if not condition or not condition.strip():
        return DEFAULT_SPECIALTIES

    lower = condition.lower().strip()

    # 1. Exact match
    if lower in CONDITION_TO_SPECIALTIES:
        return CONDITION_TO_SPECIALTIES[lower]

    # 2. Partial keyword match
    for keyword, specialties in KEYWORD_SPECIALTY_MAP:
        if keyword in lower:
            return specialties

    # 3. Default fallback
    return DEFAULT_SPECIALTIES


def get_primary_specialty(condition: str) -> str:
    """Returns the single best specialty for a condition."""
    return get_specialties_for_condition(condition)[0]