import httpx
import logging
import asyncio
from app.services.mapquest_api import geocode_address

logger = logging.getLogger(__name__)

NPPES_BASE_URL = "https://npiregistry.cms.hhs.gov/api/"

# Official NUCC taxonomy codes for Allopathic & Osteopathic Physicians only.
# Source: https://nucc.org/index.php/code-sets-mainmenu-41/provider-taxonomy-mainmenu-40
# These codes are stable — NUCC only adds new ones, never removes existing ones.
# Using codes (not descriptions) means we're immune to description text matching nurses/pharmacists.
PHYSICIAN_TAXONOMY_CODES = {
    # Internal Medicine & Subspecialties
    "207R00000X",  # Internal Medicine
    "207RB0002X",  # Internal Medicine, Obesity Medicine
    "207RC0000X",  # Cardiovascular Disease
    "207RC0001X",  # Clinical Cardiac Electrophysiology
    "207RE0101X",  # Endocrinology, Diabetes & Metabolism
    "207RG0100X",  # Gastroenterology
    "207RG0300X",  # Geriatric Medicine (IM)
    "207RH0000X",  # Hematology (IM)
    "207RH0003X",  # Hematology & Oncology
    "207RI0001X",  # Clinical & Laboratory Immunology (IM)
    "207RI0008X",  # Hepatology
    "207RI0200X",  # Infectious Disease
    "207RK0002X",  # Kinesiopharmacology (unused, keep for completeness)
    "207RM1200X",  # Magnetic Resonance Imaging (IM)
    "207RN0300X",  # Nephrology
    "207RP1001X",  # Pulmonary Disease
    "207RR0500X",  # Rheumatology
    "207RT0003X",  # Transplant Hepatology
    "207RX0202X",  # Medical Oncology
    "207K00000X",  # Allergy & Immunology
    "207KI0005X",  # Allergy & Immunology, Clinical & Lab Immunology
    # Surgery
    "208600000X",  # Surgery (General)
    "2086S0102X",  # Surgical Oncology
    "2086S0127X",  # Surgical Critical Care
    "2086S0129X",  # Vascular Surgery
    "2086S0120X",  # Pediatric Surgery
    "2086X0206X",  # Orthopedic Surgery of the Spine
    "2086H0002X",  # Hand Surgery
    "208G00000X",  # Thoracic Surgery (Cardiothoracic Vascular Surgery)
    "204F00000X",  # Transplant Surgery
    "2084A0401X",  # Neurological Surgery (added below)
    # Oncology / Radiation
    "2085R0001X",  # Radiation Oncology
    "2085R0202X",  # Radiological Physics
    "2085U0001X",  # Nuclear Medicine
    # Neurology
    "2084N0400X",  # Neurology
    "2084N0402X",  # Neurology with Special Qualifications in Child Neurology
    "2084A0401X",  # Neurological Surgery
    "2084B0040X",  # Behavioral Neurology & Neuropsychiatry
    "2084D0003X",  # Diagnostic Neuroimaging
    "2084E0001X",  # Epilepsy
    "2084F0202X",  # Forensic Neurology
    "2084H0002X",  # Headache Medicine
    "2084N0600X",  # NeuroCritical Care
    "2084N0008X",  # Neuromuscular Medicine (Neurology)
    "2084P0005X",  # Neurology, Pain Medicine
    "2084P0800X",  # Psychiatry
    "2084P0802X",  # Addiction Psychiatry
    "2084P0804X",  # Child & Adolescent Psychiatry
    "2084P2900X",  # Neuropsychiatry
    "2084S0010X",  # Sports Neurology
    "2084V0102X",  # Vascular Neurology
    # Cardiology
    "207RC0200X",  # Internal Medicine, Critical Care Medicine
    "207RC0001X",  # Clinical Cardiac Electrophysiology
    "207RI0001X",  # Interventional Cardiology (uses IM code)
    # Urology
    "208800000X",  # Urology
    "2088F0040X",  # Female Pelvic Medicine and Reconstructive Surgery (Urology)
    "2088P0231X",  # Pediatric Urology
    # OB/GYN (relevant for gynecologic oncology)
    "207V00000X",  # Obstetrics & Gynecology
    "207VG0400X",  # Gynecologic Oncology
    "207VX0201X",  # Gynecology
    # Dermatology
    "207N00000X",  # Dermatology
    "207NI0002X",  # Clinical & Laboratory Dermatological Immunology
    "207ND0101X",  # MOHS-Micrographic Surgery
    "207ND0900X",  # Dermatopathology
    "207NP0225X",  # Pediatric Dermatology
    "207NS0135X",  # Procedural Dermatology
    # Pathology
    "207ZP0101X",  # Pathology, Anatomic
    "207ZP0102X",  # Pathology, Anatomic & Clinical
    "207ZP0104X",  # Pathology, Chemical
    "207ZP0105X",  # Pathology, Clinical
    "207ZH0000X",  # Pathology, Hematology
    "207ZI0100X",  # Pathology, Immunopathology
    "207ZM0300X",  # Pathology, Medical Microbiology
    "207ZN0500X",  # Neuropathology
    "207ZP0007X",  # Pathology, Molecular Genetic
    "207ZP0213X",  # Pathology, Pediatric
    # Orthopedic Surgery
    "207X00000X",  # Orthopaedic Surgery
    "207XS0106X",  # Orthopaedic Surgery of the Spine
    "207XS0114X",  # Adult Reconstructive Orthopaedic Surgery
    "207XS0117X",  # Orthopaedic Surgery, Foot and Ankle Surgery
    "207XX0004X",  # Hand Surgery (Ortho)
    "207XP3100X",  # Pediatric Orthopaedic Surgery
    "207XT0100X",  # Orthopaedic Trauma
    # Other Physicians
    "207P00000X",  # Emergency Medicine
    "207PE0004X",  # Emergency Medical Services
    "207PP0204X",  # Pediatric Emergency Medicine
    "207Q00000X",  # Family Medicine
    "207QA0401X",  # Addiction Medicine (FM)
    "207QG0300X",  # Geriatric Medicine (FM)
    "207QS0010X",  # Sports Medicine (FM)
    "208000000X",  # Pediatrics
    "2080A0000X",  # Adolescent Medicine
    "2080I0007X",  # Clinical & Laboratory Immunology (Peds)
    "2080P0006X",  # Developmental–Behavioral Pediatrics
    "2080P0201X",  # Pediatric Allergy/Immunology
    "2080P0202X",  # Pediatric Cardiology
    "2080P0203X",  # Pediatric Critical Care Medicine
    "2080P0204X",  # Pediatric Emergency Medicine
    "2080P0205X",  # Pediatric Endocrinology
    "2080P0206X",  # Pediatric Gastroenterology
    "2080P0207X",  # Pediatric Hematology-Oncology
    "2080P0208X",  # Pediatric Infectious Diseases
    "2080P0210X",  # Pediatric Nephrology
    "2080P0214X",  # Pediatric Pulmonology
    "2080P0216X",  # Pediatric Rheumatology
    "2080T0002X",  # Pediatric Transplant Hepatology
    "208100000X",  # Physical Medicine & Rehabilitation
    "2081H0002X",  # Hospice and Palliative Medicine (PM&R)
    "2081P2900X",  # Pain Medicine (PM&R)
    "208200000X",  # Plastic Surgery
    "2082S0099X",  # Plastic Surgery Within the Head & Neck
    "208D00000X",  # General Practice
    "208M00000X",  # Hospitalist
    "208VP0000X",  # Pain Medicine
    "208VP0014X",  # Interventional Pain Medicine
    # Anesthesiology
    "207L00000X",  # Anesthesiology
    "207LA0401X",  # Addiction Medicine (Anesthesiology)
    "207LC0200X",  # Critical Care Medicine (Anesthesiology)
    "207LH0002X",  # Hospice and Palliative Medicine (Anesthesiology)
    "207LP2900X",  # Pain Medicine (Anesthesiology)
    "207LP3000X",  # Pediatric Anesthesiology
    # Ophthalmology
    "207W00000X",  # Ophthalmology
    # Colon & Rectal Surgery
    "208C00000X",  # Colon & Rectal Surgery
    # Preventive Medicine
    "2083A0100X",  # Aerospace Medicine
    "2083A0300X",  # Addiction Medicine (Prev Med)
    "2083B0002X",  # Obesity Medicine (Prev Med)
    "2083C0008X",  # Clinical Informatics
    "2083P0011X",  # Undersea and Hyperbaric Medicine
    "2083P0500X",  # Preventive Medicine/Occupational Environmental Medicine
    "2083P0901X",  # Public Health & General Preventive Medicine
    "2083S0010X",  # Sports Medicine (Prev Med)
    "2083T0002X",  # Medical Toxicology (Prev Med)
    "2083X0100X",  # Occupational Medicine
    # Radiology
    "2085B0100X",  # Body Imaging
    "2085D0003X",  # Diagnostic Neuroimaging (Radiology)
    "2085H0002X",  # Hospice and Palliative Medicine (Radiology)
    "2085N0700X",  # Neuroradiology
    "2085N0904X",  # Nuclear Radiology
    "2085P0229X",  # Pediatric Radiology
    "2085R0001X",  # Radiation Oncology
    "2085R0202X",  # Radiological Physics
    "2085R0203X",  # Diagnostic Radiology
    "2085R0204X",  # Interventional Radiology
    "2085U0001X",  # Nuclear Medicine
    "2085V0002X",  # Vascular & Interventional Radiology
}

# Maps condition keywords to relevant NUCC taxonomy codes.
# Only codes from PHYSICIAN_TAXONOMY_CODES above are used.
# This replaces the previous string-based taxonomy_description approach.
CONDITION_TO_TAXONOMY_CODES = {
    "breast cancer":  ["207RH0003X", "207RX0202X", "2085R0001X", "2086S0102X", "207VG0400X"],
    "cancer":         ["207RH0003X", "207RX0202X", "2085R0001X", "2086S0102X"],
    "tumor":          ["207RH0003X", "207RX0202X", "2085R0001X", "2086S0102X"],
    "lymphoma":       ["207RH0003X", "207RH0000X", "207RX0202X"],
    "leukemia":       ["207RH0003X", "207RH0000X", "207RX0202X"],
    "melanoma":       ["207RH0003X", "207RX0202X", "207N00000X"],
    "carcinoma":      ["207RH0003X", "207RX0202X", "2085R0001X", "2086S0102X"],
    "neoplasm":       ["207RH0003X", "207RX0202X"],
    "prostate":       ["207RH0003X", "207RX0202X", "208800000X", "2085R0001X"],
    "colorectal":     ["207RH0003X", "207RX0202X", "208C00000X", "207RG0100X"],
    "lung cancer":    ["207RH0003X", "207RX0202X", "207RP1001X", "208G00000X"],
    "sarcoma":        ["207RH0003X", "207RX0202X", "207X00000X"],
    "myeloma":        ["207RH0003X", "207RH0000X", "207RX0202X"],
    "renal":          ["207RH0003X", "207RX0202X", "207RN0300X", "208800000X"],
    "kidney":         ["207RN0300X", "208800000X", "207RH0003X"],
    # Cardiovascular
    "heart":          ["207RC0000X", "207RC0001X"],
    "cardiac":        ["207RC0000X", "207RC0001X"],
    "cardiovascular": ["207RC0000X"],
    "hypertension":   ["207RC0000X", "207R00000X", "207RN0300X"],
    "arrhythmia":     ["207RC0001X", "207RC0000X"],
    "stroke":         ["2084N0400X", "2084V0102X", "207RC0000X"],
    "coronary":       ["207RC0000X"],
    # Endocrine
    "diabetes":       ["207RE0101X", "207R00000X"],
    "thyroid":        ["207RE0101X"],
    "obesity":        ["207RE0101X", "207R00000X"],
    "metabolic":      ["207RE0101X", "207R00000X"],
    # Neurology
    "alzheimer":      ["2084N0400X", "207QG0300X"],
    "parkinson":      ["2084N0400X"],
    "epilepsy":       ["2084N0400X", "2084E0001X"],
    "seizure":        ["2084N0400X", "2084E0001X"],
    "migraine":       ["2084N0400X", "2084H0002X"],
    "multiple sclerosis": ["2084N0400X"],
    "neuropathy":     ["2084N0400X"],
    # Pulmonology
    "asthma":         ["207RP1001X", "207K00000X"],
    "copd":           ["207RP1001X", "207R00000X"],
    "lung":           ["207RP1001X", "208G00000X"],
    "respiratory":    ["207RP1001X", "207R00000X"],
    # Gastroenterology
    "crohn":          ["207RG0100X", "207R00000X"],
    "colitis":        ["207RG0100X", "207R00000X"],
    "hepatitis":      ["207RG0100X", "207RI0008X"],
    "liver":          ["207RG0100X", "207RI0008X"],
    "pancreatic":     ["207RG0100X", "207RH0003X"],
    # Rheumatology
    "arthritis":      ["207RR0500X", "207R00000X"],
    "lupus":          ["207RR0500X"],
    "rheumatoid":     ["207RR0500X"],
    "fibromyalgia":   ["207RR0500X", "208VP0000X"],
    # Psychiatry
    "depression":     ["2084P0800X", "2084P0804X"],
    "anxiety":        ["2084P0800X", "2084P0804X"],
    "schizophrenia":  ["2084P0800X"],
    "bipolar":        ["2084P0800X"],
    "ptsd":           ["2084P0800X"],
    "adhd":           ["2084P0800X", "2084P0804X", "208000000X"],
    # Orthopedics
    "spine":          ["207X00000X", "207XS0106X", "2084A0401X"],
    "fracture":       ["207X00000X"],
    "joint":          ["207X00000X", "207RR0500X"],
    # Infectious Disease
    "hiv":            ["207RI0200X", "207R00000X"],
    "aids":           ["207RI0200X", "207R00000X"],
    "infection":      ["207RI0200X", "207R00000X"],
    # Urology
    "bladder":        ["208800000X"],
    "urothelial":     ["208800000X", "207RH0003X"],
    # Ophthalmology
    "retina":         ["207W00000X"],
    "macular":        ["207W00000X"],
    "glaucoma":       ["207W00000X"],
    "eye":            ["207W00000X"],
}

STATE_ABBR = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
    "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
    "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
    "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
    "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV",
    "wisconsin": "WI", "wyoming": "WY", "district of columbia": "DC", "puerto rico": "PR",
}


def get_taxonomy_codes_for_condition(condition: str) -> list[str]:
    """
    Returns a prioritized list of NUCC taxonomy codes for a given condition.
    Falls back to all general internal medicine / oncology codes if no match.
    """
    if not condition:
        return []
    condition_lower = condition.lower().strip()
    for keyword in sorted(CONDITION_TO_TAXONOMY_CODES.keys(), key=len, reverse=True):
        if keyword in condition_lower:
            codes = CONDITION_TO_TAXONOMY_CODES[keyword]
            logger.info(f"Mapped condition '{condition}' → taxonomy codes {codes}")
            return codes
    # Default: return general internal medicine + oncology codes
    logger.info(f"No code mapping for '{condition}' — using general physician codes.")
    return ["207R00000X", "207RH0003X", "207RX0202X"]


def normalize_state(state: str) -> str | None:
    if not state:
        return None
    s = state.strip()
    if not s:
        return None
    if len(s) == 2:
        return s.upper()
    return STATE_ABBR.get(s.lower(), s.upper())


# Explicit exclusion: NUCC codes that are definitively NOT physicians.
# These cover mid-level and allied health providers that may appear in results.
NON_PHYSICIAN_TAXONOMY_CODES = {
    "363A00000X",  # Physician Assistant
    "363AM0700X",  # Physician Assistant, Medical
    "363AS0400X",  # Physician Assistant, Surgical
    "363L00000X",  # Nurse Practitioner
    "363LA2100X",  # Nurse Practitioner, Acute Care
    "363LA2200X",  # Nurse Practitioner, Adult Health
    "363LC0200X",  # Nurse Practitioner, Critical Care Medicine
    "363LC1500X",  # Nurse Practitioner, Community Health
    "363LE0002X",  # Nurse Practitioner, Gerontology
    "363LF0000X",  # Nurse Practitioner, Family
    "363LG0600X",  # Nurse Practitioner, Obstetrics & Gynecology
    "363LN0000X",  # Nurse Practitioner, Neonatal
    "363LN0005X",  # Nurse Practitioner, Neonatal, Critical Care
    "363LP0200X",  # Nurse Practitioner, Pediatrics
    "363LP0222X",  # Nurse Practitioner, Pediatrics, Critical Care
    "363LP1700X",  # Nurse Practitioner, Psychiatric/Mental Health
    "363LP2300X",  # Nurse Practitioner, Primary Care
    "363LP0808X",  # Nurse Practitioner, OB/GYN
    "363LS0200X",  # Nurse Practitioner, School
    "363LW0102X",  # Nurse Practitioner, Women's Health
    "363LX0001X",  # Nurse Practitioner, Oncology
    "363LX0106X",  # Nurse Practitioner, Occupational Health
    "367500000X",  # Nurse Anesthetist, Certified Registered
    "367A00000X",  # Advanced Practice Midwife
    "367H00000X",  # Anesthesiologist Assistant
    "374700000X",  # Technician, Behavior Analyst
    "246ZN0300X",  # Technician, Nuclear Medicine
    "183500000X",  # Pharmacist
    "1835C0205X",  # Pharmacist, Critical Care
    "1835G0000X",  # Pharmacist, General Practice
    "1835G0303X",  # Pharmacist, Geriatric
    "1835N0905X",  # Pharmacist, Nuclear
    "1835N1003X",  # Pharmacist, Nutrition Support
    "1835P1200X",  # Pharmacist, Pharmacotherapy
    "1835P1300X",  # Pharmacist, Psychiatric
    "1835X0200X",  # Pharmacist, Oncology
    "163WP0218X",  # Registered Nurse, Oncology
    "163W00000X",  # Registered Nurse
    "163WA0400X",  # Registered Nurse, Addiction (Substance Use Disorder)
    "163WC0400X",  # Registered Nurse, Case Management
    "163WC1400X",  # Registered Nurse, College Health
    "163WC3500X",  # Registered Nurse, Critical Care Medicine
    "163WD0400X",  # Registered Nurse, Dialysis
    "163WE0003X",  # Registered Nurse, Emergency
    "163WG0000X",  # Registered Nurse, General Practice
    "163WL0100X",  # Registered Nurse, Gerontological
    "163WM0102X",  # Registered Nurse, Home Health
    "163WM0705X",  # Registered Nurse, Maternal Newborn
    "163WN0002X",  # Registered Nurse, Neonatal
    "163WN0003X",  # Registered Nurse, Neonatal, Low-Risk
    "163WP0000X",  # Registered Nurse, Pediatrics
    "163WP0808X",  # Registered Nurse, Psychiatric/Mental Health
    "163WP1700X",  # Registered Nurse, Perinatal
    "163WP2201X",  # Registered Nurse, Ambulatory Care
    "163WR0400X",  # Registered Nurse, Rehabilitation
    "163WR1000X",  # Registered Nurse, Reproductive Endocrinology/Infertility
    "163WS0121X",  # Registered Nurse, School
    "163WU0100X",  # Registered Nurse, Urology
    "163WX0002X",  # Registered Nurse, Obstetric
    "163WX0003X",  # Registered Nurse, Inpatient Obstetric
    "163WX0106X",  # Registered Nurse, Occupational Health
    "163WX0200X",  # Registered Nurse, Oncology
    "163WX1100X",  # Registered Nurse, Ophthalmic
    "163WX1500X",  # Registered Nurse, Ostomy Care
    "101Y00000X",  # Counselor
    "106H00000X",  # Marriage & Family Therapist
    "111N00000X",  # Chiropractor
    "122300000X",  # Dentist
    "1223G0001X",  # Dentist, General Practice
    "133N00000X",  # Nutritionist
    "133NN1002X",  # Nutritionist, Nutrition, Education
    "133V00000X",  # Dietitian, Registered
    "146N00000X",  # Medical Technologist
    "224P00000X",  # Rehabilitation Practitioner
    "225100000X",  # Physical Therapist
    "225200000X",  # Occupational Therapist
    "225400000X",  # Respiratory Therapist
    "225600000X",  # Dance Therapist
    "225700000X",  # Massage Therapist
    "225800000X",  # Recreation Therapist
    "225C00000X",  # Rehabilitation Counselor
    "225X00000X",  # Occupational Therapist
    "226300000X",  # Kinesiotherapist
    "231H00000X",  # Audiologist
    "235Z00000X",  # Speech-Language Pathologist
    "251B00000X",  # Case Manager/Care Coordinator
    "261QP2300X",  # Clinic/Center, Primary Care
    "291U00000X",  # Clinical Medical Laboratory
    "3040P0500X",  # Podiatrist
    "310400000X",  # Assisted Living Facility
    "320600000X",  # Residential Treatment Facility
    "332B00000X",  # Durable Medical Equipment
    "333600000X",  # Pharmacy
    "335E00000X",  # Prosthetic/Orthotic Supplier
    "341600000X",  # Ambulance
    "347B00000X",  # Taxi
    "372500000X",  # Chore Provider
    "374J00000X",  # Doula
    "374T00000X",  # Religious Nonmedical Practitioner
    "374U00000X",  # Home Health Aide
    "376G00000X",  # Nursing Home Administrator
    "376J00000X",  # Homemaker
    "376K00000X",  # Nurse's Aide
}


def _is_physician(taxonomies: list) -> bool:
    """
    Validate provider is a physician using official NUCC taxonomy codes.
    A provider is a physician if:
      1. At least one of their taxonomy codes is in PHYSICIAN_TAXONOMY_CODES, AND
      2. None of their taxonomy codes are in NON_PHYSICIAN_TAXONOMY_CODES
    The exclusion check takes priority to prevent mid-level providers slipping through.
    """
    if not taxonomies:
        return False

    codes = {t.get("code", "") for t in taxonomies}

    # Explicit exclusion takes priority
    if codes & NON_PHYSICIAN_TAXONOMY_CODES:
        return False

    # Must have at least one confirmed physician code
    return bool(codes & PHYSICIAN_TAXONOMY_CODES)


async def _query_nppes(
    city: str | None,
    state: str | None,
    limit: int,
    taxonomy_description: str | None = None,
) -> list:
    """
    Query NPPES registry.
    taxonomy_description is sent as-is; we rely on post-filtering via
    NUCC taxonomy codes to ensure only physicians are returned.
    """
    params = {
        "version": "2.1",
        "enumeration_type": "NPI-1",
        "limit": limit,
    }
    if city:
        params["city"] = city.strip()
    if state:
        params["state"] = state
    if taxonomy_description:
        params["taxonomy_description"] = taxonomy_description

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(NPPES_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"NPPES HTTP error: {e.response.status_code} — {e.response.text}")
        return []
    except httpx.RequestError as e:
        logger.error(f"NPPES request failed: {e}")
        return []

    raw = data.get("results", [])
    logger.info(
        f"NPPES returned {len(raw)} raw results "
        f"(city={city}, state={state}, taxonomy={taxonomy_description})"
    )
    return raw


def _parse_physician(
    item: dict,
    expected_city: str | None = None,
) -> dict | None:
    """
    Parse a raw NPPES result.
    Returns None if:
      - Taxonomy code is not in PHYSICIAN_TAXONOMY_CODES (not an MD/DO)
      - Practice address is missing
      - City doesn't match expected_city (when provided)
    """
    basic = item.get("basic", {})
    addresses = item.get("addresses", [])
    taxonomies = item.get("taxonomies", [])

    # ✅ Hard gate: must be a physician by NUCC taxonomy code
    if not _is_physician(taxonomies):
        return None

    practice_address = next(
        (a for a in addresses if a.get("address_purpose") == "LOCATION"), None
    )
    if not practice_address:
        return None

    # ✅ Strict city match
    if expected_city:
        provider_city = (practice_address.get("city") or "").strip().lower()
        if provider_city != expected_city.strip().lower():
            return None

    primary_taxonomy = next(
        (t for t in taxonomies if t.get("primary")),
        taxonomies[0] if taxonomies else {}
    )
    specialty_desc = primary_taxonomy.get("desc") or basic.get("credential") or "Unknown"
    credential = (basic.get("credential") or "").strip()

    full_address = (
        f"{practice_address.get('address_1', '')}, "
        f"{practice_address.get('city', '')}, "
        f"{practice_address.get('state', '')} "
        f"{practice_address.get('postal_code', '')}"
    )

    return {
        "npi": item.get("number"),
        "name": f"{basic.get('first_name', '')} {basic.get('last_name', '')}".strip(),
        "credential": credential,
        "city": practice_address.get("city"),
        "state": practice_address.get("state"),
        "address": practice_address.get("address_1"),
        "postal_code": practice_address.get("postal_code"),
        "specialty": specialty_desc,
        "full_address": full_address,
    }


async def fetch_physicians_near(
    city: str | None = None,
    state: str | None = None,
    condition: str | None = None,
    limit: int = 10,
) -> list:
    state_code = normalize_state(state) if state else None
    taxonomy_codes = get_taxonomy_codes_for_condition(condition) if condition else []

    logger.info(
        f"Fetching physicians: city={city}, state={state_code}, "
        f"condition={condition}, taxonomy_codes={taxonomy_codes}"
    )

    seen_npis: set = set()
    physicians_to_geocode: list = []

    async def collect(
        query_city: str | None,
        query_state: str | None,
        strict_city: str | None,
        codes: list[str],
    ) -> None:
        """
        For each taxonomy code, fetch from NPPES and filter via _parse_physician.
        NPPES doesn't accept taxonomy codes directly as a query param, so we use
        the taxonomy description as a hint and rely on code-based post-filtering.
        """
        for code in codes:
            if len(physicians_to_geocode) >= limit:
                break
            # Map code back to a description string for the NPPES query param
            desc = _code_to_description(code)
            raw_results = await _query_nppes(query_city, query_state, limit * 5, desc)
            for item in raw_results:
                npi = item.get("number")
                if npi in seen_npis:
                    continue
                seen_npis.add(npi)
                parsed = _parse_physician(item, expected_city=strict_city)
                if parsed:
                    physicians_to_geocode.append(parsed)
                if len(physicians_to_geocode) >= limit:
                    break

    if taxonomy_codes:
        # Pass 1: specialty codes + strict city
        await collect(city, state_code, strict_city=city, codes=taxonomy_codes)

        # Pass 2: specialty codes + state only
        if not physicians_to_geocode and state_code:
            logger.warning(f"No results in city={city}. Trying state={state_code}.")
            await collect(None, state_code, strict_city=None, codes=taxonomy_codes)

        # Pass 3: no specialty filter, city only — but physician gate still active
        if not physicians_to_geocode:
            logger.warning("No specialty matches. Falling back to unfiltered physician search.")
            raw_results = await _query_nppes(city, state_code, limit * 5)
            for item in raw_results:
                parsed = _parse_physician(item, expected_city=city)
                if parsed:
                    physicians_to_geocode.append(parsed)
                if len(physicians_to_geocode) >= limit:
                    break
    else:
        raw_results = await _query_nppes(city, state_code, limit * 5)
        for item in raw_results:
            parsed = _parse_physician(item, expected_city=city)
            if parsed:
                physicians_to_geocode.append(parsed)
            if len(physicians_to_geocode) >= limit:
                break

    logger.info(f"Found {len(physicians_to_geocode)} physicians before geocoding.")

    if not physicians_to_geocode:
        return []

    async def geocode_physician(p: dict) -> dict:
        try:
            geo = await geocode_address(p["full_address"])
        except Exception as e:
            logger.warning(f"Geocoding failed for '{p['full_address']}': {e}")
            geo = {}
        return {
            **{k: v for k, v in p.items() if k != "full_address"},
            "lat": geo.get("lat"),
            "lon": geo.get("lon"),
        }

    results = await asyncio.gather(*[geocode_physician(p) for p in physicians_to_geocode])
    logger.info(f"Returning {len(results)} physicians.")
    return list(results)


def _code_to_description(code: str) -> str:
    """
    Maps a NUCC taxonomy code to a short description string suitable
    for the NPPES taxonomy_description query parameter.
    NPPES does partial substring matching so short terms work well.
    """
    _CODE_TO_DESC = {
        "207R00000X": "Internal Medicine",
        "207RC0000X": "Cardiovascular Disease",
        "207RC0001X": "Clinical Cardiac Electrophysiology",
        "207RE0101X": "Endocrinology, Diabetes & Metabolism",
        "207RG0100X": "Gastroenterology",
        "207RH0000X": "Hematology",
        "207RH0003X": "Hematology & Oncology",
        "207RI0200X": "Infectious Disease",
        "207RN0300X": "Nephrology",
        "207RP1001X": "Pulmonary Disease",
        "207RR0500X": "Rheumatology",
        "207RX0202X": "Medical Oncology",
        "207K00000X": "Allergy & Immunology",
        "208600000X": "Surgery",
        "2086S0102X": "Surgical Oncology",
        "208G00000X": "Thoracic Surgery",
        "2085R0001X": "Radiation Oncology",
        "2085U0001X": "Nuclear Medicine",
        "2084N0400X": "Neurology",
        "2084A0401X": "Neurological Surgery",
        "2084P0800X": "Psychiatry",
        "2084V0102X": "Vascular Neurology",
        "2084E0001X": "Epilepsy",
        "2084H0002X": "Headache Medicine",
        "208800000X": "Urology",
        "207V00000X": "Obstetrics & Gynecology",
        "207VG0400X": "Gynecologic Oncology",
        "207N00000X": "Dermatology",
        "207ZP0102X": "Anatomic Pathology & Clinical Pathology",
        "207ZH0000X": "Hematology",
        "207X00000X": "Orthopedic Surgery",
        "207XS0106X": "Orthopedic Surgery of the Spine",
        "207P00000X": "Emergency Medicine",
        "207Q00000X": "Family Medicine",
        "208000000X": "Pediatrics",
        "2080P0207X": "Pediatric Hematology-Oncology",
        "208100000X": "Physical Medicine & Rehabilitation",
        "208200000X": "Plastic Surgery",
        "208C00000X": "Colon & Rectal Surgery",
        "208D00000X": "General Practice",
        "208M00000X": "Hospitalist",
        "208VP0000X": "Pain Medicine",
        "207L00000X": "Anesthesiology",
        "207W00000X": "Ophthalmology",
        "207RG0300X": "Geriatric Medicine",
        "207RI0008X": "Hepatology",
        "207RC0200X": "Critical Care Medicine",
        "207RB0002X": "Obesity Medicine",
    }
    return _CODE_TO_DESC.get(code, "Internal Medicine")