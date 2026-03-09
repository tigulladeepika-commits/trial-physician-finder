import httpx
import logging
import asyncio
from app.services.geoapify_api import geocode_address

logger = logging.getLogger(__name__)

NPPES_BASE_URL = "https://npiregistry.cms.hhs.gov/api/"

PHYSICIAN_TAXONOMY_CODES = {
    "207R00000X", "207RB0002X", "207RC0000X", "207RC0001X", "207RE0101X",
    "207RG0100X", "207RG0300X", "207RH0000X", "207RH0003X", "207RI0001X",
    "207RI0008X", "207RI0200X", "207RK0002X", "207RM1200X", "207RN0300X",
    "207RP1001X", "207RR0500X", "207RT0003X", "207RX0202X", "207K00000X",
    "207KI0005X", "208600000X", "2086S0102X", "2086S0127X", "2086S0129X",
    "2086S0120X", "2086X0206X", "2086H0002X", "208G00000X", "204F00000X",
    "2084A0401X", "2085R0001X", "2085R0202X", "2085U0001X", "2084N0400X",
    "2084N0402X", "2084B0040X", "2084D0003X", "2084E0001X", "2084F0202X",
    "2084H0002X", "2084N0600X", "2084N0008X", "2084P0005X", "2084P0800X",
    "2084P0802X", "2084P0804X", "2084P2900X", "2084S0010X", "2084V0102X",
    "207RC0200X", "208800000X", "2088F0040X", "2088P0231X", "207V00000X",
    "207VG0400X", "207VX0201X", "207N00000X", "207NI0002X", "207ND0101X",
    "207ND0900X", "207NP0225X", "207NS0135X", "207ZP0101X", "207ZP0102X",
    "207ZP0104X", "207ZP0105X", "207ZH0000X", "207ZI0100X", "207ZM0300X",
    "207ZN0500X", "207ZP0007X", "207ZP0213X", "207X00000X", "207XS0106X",
    "207XS0114X", "207XS0117X", "207XX0004X", "207XP3100X", "207XT0100X",
    "207P00000X", "207PE0004X", "207PP0204X", "207Q00000X", "207QA0401X",
    "207QG0300X", "207QS0010X", "208000000X", "2080A0000X", "2080I0007X",
    "2080P0006X", "2080P0201X", "2080P0202X", "2080P0203X", "2080P0204X",
    "2080P0205X", "2080P0206X", "2080P0207X", "2080P0208X", "2080P0210X",
    "2080P0214X", "2080P0216X", "2080T0002X", "208100000X", "2081H0002X",
    "2081P2900X", "208200000X", "2082S0099X", "208D00000X", "208M00000X",
    "208VP0000X", "208VP0014X", "207L00000X", "207LA0401X", "207LC0200X",
    "207LH0002X", "207LP2900X", "207LP3000X", "207W00000X", "208C00000X",
    "2083A0100X", "2083A0300X", "2083B0002X", "2083C0008X", "2083P0011X",
    "2083P0500X", "2083P0901X", "2083S0010X", "2083T0002X", "2083X0100X",
    "2085B0100X", "2085D0003X", "2085H0002X", "2085N0700X", "2085N0904X",
    "2085P0229X", "2085R0203X", "2085R0204X", "2085V0002X",
}

# FIX: Added student/trainee codes that should never appear as physicians
NON_PHYSICIAN_TAXONOMY_CODES = {
    "390200000X",  # Student in Organized Health Care Education/Training Program
    "363A00000X", "363AM0700X", "363AS0400X", "363L00000X", "363LA2100X",
    "363LA2200X", "363LC0200X", "363LC1500X", "363LE0002X", "363LF0000X",
    "363LG0600X", "363LN0000X", "363LN0005X", "363LP0200X", "363LP0222X",
    "363LP1700X", "363LP2300X", "363LP0808X", "363LS0200X", "363LW0102X",
    "363LX0001X", "363LX0106X", "367500000X", "367A00000X", "367H00000X",
    "183500000X", "163W00000X", "101Y00000X", "106H00000X", "111N00000X",
    "122300000X", "133N00000X", "133V00000X", "225100000X", "225200000X",
    "225400000X", "333600000X", "3040P0500X",
}

CONDITION_TO_TAXONOMY_CODES = {

    # ── ONCOLOGY ─────────────────────────────────────────────────────────────
    "cancer":                   ["207RH0003X", "207RX0202X", "2085R0001X", "2086S0102X"],
    "oncology":                 ["207RH0003X", "207RX0202X", "2085R0001X", "2086S0102X"],
    "tumor":                    ["207RH0003X", "207RX0202X", "2085R0001X", "2086S0102X"],
    "carcinoma":                ["207RH0003X", "207RX0202X", "2085R0001X", "2086S0102X"],
    "neoplasm":                 ["207RH0003X", "207RX0202X", "2085R0001X"],
    "malignancy":               ["207RH0003X", "207RX0202X", "2085R0001X"],
    "metastatic":               ["207RH0003X", "207RX0202X", "2085R0001X"],
    "breast cancer":            ["207RH0003X", "207RX0202X", "2085R0001X", "2086S0102X", "207VG0400X"],
    "breast neoplasm":          ["207RH0003X", "207RX0202X", "2085R0001X", "207VG0400X"],
    "her2":                     ["207RH0003X", "207RX0202X", "207VG0400X"],
    "lung cancer":              ["207RH0003X", "207RX0202X", "207RP1001X", "208G00000X"],
    "nsclc":                    ["207RH0003X", "207RX0202X", "207RP1001X"],
    "small cell lung":          ["207RH0003X", "207RX0202X", "207RP1001X"],
    "prostate cancer":          ["207RH0003X", "207RX0202X", "208800000X", "2085R0001X"],
    "prostate":                 ["207RH0003X", "207RX0202X", "208800000X", "2085R0001X"],
    "colorectal":               ["207RH0003X", "207RX0202X", "208C00000X", "207RG0100X"],
    "colon cancer":             ["207RH0003X", "207RX0202X", "208C00000X", "207RG0100X"],
    "rectal cancer":            ["207RH0003X", "207RX0202X", "208C00000X"],
    "colorectal cancer":        ["207RH0003X", "207RX0202X", "208C00000X", "207RG0100X"],
    "lymphoma":                 ["207RH0003X", "207RH0000X", "207RX0202X"],
    "hodgkin":                  ["207RH0003X", "207RH0000X", "207RX0202X"],
    "non-hodgkin":              ["207RH0003X", "207RH0000X", "207RX0202X"],
    "leukemia":                 ["207RH0003X", "207RH0000X", "207RX0202X"],
    "aml":                      ["207RH0003X", "207RH0000X", "207RX0202X"],
    "cml":                      ["207RH0003X", "207RH0000X", "207RX0202X"],
    "cll":                      ["207RH0003X", "207RH0000X", "207RX0202X"],
    "myeloma":                  ["207RH0003X", "207RH0000X", "207RX0202X"],
    "multiple myeloma":         ["207RH0003X", "207RH0000X", "207RX0202X"],
    "melanoma":                 ["207RH0003X", "207RX0202X", "207N00000X"],
    "skin cancer":              ["207N00000X", "207RH0003X", "207RX0202X"],
    "basal cell":               ["207N00000X", "207RH0003X"],
    "squamous cell":            ["207N00000X", "207RH0003X", "207RX0202X"],
    "sarcoma":                  ["207RH0003X", "207RX0202X", "207X00000X"],
    "pancreatic cancer":        ["207RH0003X", "207RX0202X", "207RG0100X", "2086S0102X"],
    "pancreatic":               ["207RH0003X", "207RX0202X", "207RG0100X"],
    "liver cancer":             ["207RG0100X", "207RI0008X", "207RH0003X", "207RX0202X"],
    "hepatocellular":           ["207RG0100X", "207RI0008X", "207RH0003X"],
    "hcc":                      ["207RG0100X", "207RI0008X", "207RH0003X"],
    "ovarian cancer":           ["207VG0400X", "207RH0003X", "207RX0202X"],
    "ovarian":                  ["207VG0400X", "207V00000X", "207RH0003X"],
    "cervical cancer":          ["207VG0400X", "207V00000X", "207RH0003X"],
    "cervical":                 ["207VG0400X", "207V00000X"],
    "endometrial":              ["207VG0400X", "207V00000X", "207RH0003X"],
    "uterine":                  ["207VG0400X", "207V00000X", "207RH0003X"],
    "renal cell":               ["207RH0003X", "207RX0202X", "207RN0300X", "208800000X"],
    "renal":                    ["207RN0300X", "208800000X", "207RH0003X"],
    "kidney cancer":            ["207RH0003X", "207RX0202X", "207RN0300X", "208800000X"],
    "bladder cancer":           ["208800000X", "207RH0003X", "207RX0202X"],
    "bladder":                  ["208800000X", "207RH0003X"],
    "thyroid cancer":           ["207RE0101X", "207RH0003X", "2086S0102X"],
    "glioma":                   ["2084N0400X", "2084A0401X", "207RH0003X"],
    "glioblastoma":             ["2084N0400X", "2084A0401X", "207RH0003X"],
    "brain tumor":              ["2084N0400X", "2084A0401X", "207RH0003X"],
    "brain cancer":             ["2084N0400X", "2084A0401X", "207RH0003X"],
    "meningioma":               ["2084N0400X", "2084A0401X"],
    "myelodysplastic":          ["207RH0003X", "207RH0000X", "207RX0202X"],
    "mds":                      ["207RH0003X", "207RH0000X", "207RX0202X"],

    # ── CARDIOVASCULAR ────────────────────────────────────────────────────────
    "heart":                    ["207RC0000X", "207RC0001X", "207RI0001X"],
    "cardiac":                  ["207RC0000X", "207RC0001X"],
    "cardiovascular":           ["207RC0000X", "207RC0001X"],
    "cardiology":               ["207RC0000X", "207RC0001X", "207RI0001X"],
    "heart disease":            ["207RC0000X", "207RC0001X"],
    "heart failure":            ["207RC0000X", "207RM1200X", "207R00000X"],
    "cardiac failure":          ["207RC0000X", "207RM1200X"],
    "congestive heart":         ["207RC0000X", "207RM1200X"],
    "cardiomyopathy":           ["207RC0000X", "207RM1200X"],
    "heart attack":             ["207RC0000X", "207RC0001X", "207RI0001X"],
    "myocardial infarction":    ["207RC0000X", "207RC0001X"],
    "myocardial":               ["207RC0000X", "207RC0001X"],
    "infarction":               ["207RC0000X", "207RC0001X"],
    "stemi":                    ["207RC0000X", "207RC0001X", "207RI0001X"],
    "nstemi":                   ["207RC0000X", "207RC0001X"],
    "coronary artery":          ["207RC0000X", "207RI0001X"],
    "coronary":                 ["207RC0000X", "207RI0001X"],
    "angina":                   ["207RC0000X", "207RI0001X"],
    "atherosclerosis":          ["207RC0000X", "207RI0001X"],
    "ischemia":                 ["207RC0000X", "207RC0001X"],
    "ischemic":                 ["207RC0000X", "207RC0001X"],
    "arrhythmia":               ["207RC0001X", "207RC0000X"],
    "atrial fibrillation":      ["207RC0001X", "207RC0000X", "207RI0001X"],
    "atrial flutter":           ["207RC0001X", "207RC0000X"],
    "fibrillation":             ["207RC0001X", "207RC0000X", "207RI0001X"],
    "flutter":                  ["207RC0001X", "207RC0000X"],
    "paroxysmal":               ["207RC0001X", "207RC0000X"],
    "ventricular tachycardia":  ["207RC0001X", "207RC0000X"],
    "ventricular fibrillation": ["207RC0001X", "207RC0000X"],
    "tachycardia":              ["207RC0001X", "207RC0000X"],
    "bradycardia":              ["207RC0001X", "207RC0000X"],
    "pacemaker":                ["207RC0001X", "207RC0000X"],
    "defibrillator":            ["207RC0001X", "207RC0000X"],
    "icd":                      ["207RC0001X", "207RC0000X"],
    "hypertension":             ["207RC0000X", "207R00000X", "207RN0300X"],
    "high blood pressure":      ["207RC0000X", "207R00000X"],
    "pulmonary hypertension":   ["207RC0000X", "207RP1001X"],
    "aortic":                   ["207RC0000X", "2086S0129X"],
    "aortic stenosis":          ["207RC0000X", "207RI0001X"],
    "mitral":                   ["207RC0000X", "207RI0001X"],
    "valvular":                 ["207RC0000X", "207RI0001X"],
    "valve":                    ["207RC0000X", "207RI0001X"],
    "pericarditis":             ["207RC0000X", "207R00000X"],
    "endocarditis":             ["207RC0000X", "207RI0200X"],
    "cardiogenic shock":        ["207RC0000X", "207RC0200X"],
    "shock":                    ["207RC0200X", "207RC0000X"],
    "peripheral artery":        ["207RC0000X", "2086S0129X"],
    "peripheral vascular":      ["207RC0000X", "2086S0129X"],
    "deep vein thrombosis":     ["207RC0000X", "207R00000X"],
    "dvt":                      ["207RC0000X", "207RP1001X"],
    "pulmonary embolism":       ["207RP1001X", "207RC0000X"],
    "thrombosis":               ["207RC0000X", "207RH0000X"],
    "ecmo":                     ["207RC0000X", "207RC0200X"],

    # ── NEUROLOGY ─────────────────────────────────────────────────────────────
    "neurology":                ["2084N0400X", "2084V0102X"],
    "neurological":             ["2084N0400X"],
    "stroke":                   ["2084N0400X", "2084V0102X", "207RC0000X"],
    "cerebrovascular":          ["2084N0400X", "2084V0102X"],
    "ischemic stroke":          ["2084N0400X", "2084V0102X"],
    "hemorrhagic stroke":       ["2084N0400X", "2084A0401X"],
    "tia":                      ["2084N0400X", "2084V0102X"],
    "transient ischemic":       ["2084N0400X", "2084V0102X"],
    "alzheimer":                ["2084N0400X", "207QG0300X"],
    "alzheimers":               ["2084N0400X", "207QG0300X"],
    "dementia":                 ["2084N0400X", "207QG0300X", "2084B0040X"],
    "cognitive":                ["2084N0400X", "207QG0300X"],
    "parkinson":                ["2084N0400X", "2084B0040X"],
    "parkinsons":               ["2084N0400X", "2084B0040X"],
    "parkinsonism":             ["2084N0400X", "2084B0040X"],
    "multiple sclerosis":       ["2084N0400X"],
    "demyelinating":            ["2084N0400X"],
    "epilepsy":                 ["2084N0400X", "2084E0001X"],
    "seizure":                  ["2084N0400X", "2084E0001X"],
    "convulsion":               ["2084N0400X", "2084E0001X"],
    "migraine":                 ["2084N0400X", "2084H0002X"],
    "headache":                 ["2084N0400X", "2084H0002X"],
    "cluster headache":         ["2084N0400X", "2084H0002X"],
    "als":                      ["2084N0400X"],
    "amyotrophic":              ["2084N0400X"],
    "motor neuron":             ["2084N0400X"],
    "neuropathy":               ["2084N0400X", "2084P0005X"],
    "peripheral neuropathy":    ["2084N0400X", "2084P0005X"],
    "myasthenia":               ["2084N0400X"],
    "guillain":                 ["2084N0400X"],
    "huntington":               ["2084N0400X", "2084B0040X"],
    "dystonia":                 ["2084N0400X"],
    "tremor":                   ["2084N0400X"],
    "vertigo":                  ["2084N0400X", "207W00000X"],
    "narcolepsy":               ["2084N0400X", "2084S0010X"],
    "neurofibromatosis":        ["2084N0400X"],
    "spinal cord":              ["2084N0400X", "208100000X"],
    "spinal muscular":          ["2084N0400X"],
    "encephalitis":             ["2084N0400X", "207RI0200X"],
    "meningitis":               ["2084N0400X", "207RI0200X"],

    # ── ENDOCRINE & METABOLIC ─────────────────────────────────────────────────
    "diabetes":                 ["207RE0101X", "207R00000X"],
    "diabetes mellitus":        ["207RE0101X", "207R00000X"],
    "type 1 diabetes":          ["207RE0101X", "208000000X"],
    "type 2 diabetes":          ["207RE0101X", "207R00000X"],
    "t1d":                      ["207RE0101X", "208000000X"],
    "t2d":                      ["207RE0101X", "207R00000X"],
    "diabetic":                 ["207RE0101X", "207R00000X"],
    "hyperglycemia":            ["207RE0101X", "207R00000X"],
    "hypoglycemia":             ["207RE0101X", "207R00000X"],
    "insulin":                  ["207RE0101X"],
    "thyroid":                  ["207RE0101X"],
    "hypothyroidism":           ["207RE0101X"],
    "hyperthyroidism":          ["207RE0101X"],
    "hashimoto":                ["207RE0101X", "207RR0500X"],
    "graves":                   ["207RE0101X"],
    "obesity":                  ["207RE0101X", "207RB0002X", "207Q00000X"],
    "overweight":               ["207RE0101X", "207RB0002X"],
    "bariatric":                ["207RE0101X", "208600000X"],
    "metabolic syndrome":       ["207RE0101X", "207R00000X"],
    "hyperlipidemia":           ["207RE0101X", "207RC0000X"],
    "cholesterol":              ["207RE0101X", "207RC0000X"],
    "adrenal":                  ["207RE0101X"],
    "cushing":                  ["207RE0101X"],
    "acromegaly":               ["207RE0101X"],
    "osteoporosis":             ["207RE0101X", "207RR0500X"],
    "osteopenia":               ["207RE0101X", "207RR0500X"],
    "gout":                     ["207RR0500X", "207R00000X"],
    "pcos":                     ["207RE0101X", "207V00000X"],
    "polycystic ovary":         ["207RE0101X", "207V00000X"],
    "menopause":                ["207V00000X", "207RE0101X"],

    # ── PULMONARY / RESPIRATORY ───────────────────────────────────────────────
    "pulmonary":                ["207RP1001X", "207RC0200X"],
    "respiratory":              ["207RP1001X", "207K00000X"],
    "asthma":                   ["207RP1001X", "207K00000X"],
    "copd":                     ["207RP1001X", "207R00000X"],
    "emphysema":                ["207RP1001X", "207R00000X"],
    "chronic bronchitis":       ["207RP1001X", "207R00000X"],
    "bronchiectasis":           ["207RP1001X"],
    "interstitial lung":        ["207RP1001X"],
    "pulmonary fibrosis":       ["207RP1001X"],
    "idiopathic pulmonary":     ["207RP1001X"],
    "sarcoidosis":              ["207RP1001X", "207RR0500X"],
    "pneumonia":                ["207RP1001X", "207R00000X"],
    "sleep apnea":              ["207RP1001X", "2084S0010X"],
    "obstructive sleep":        ["207RP1001X", "2084S0010X"],
    "respiratory failure":      ["207RP1001X", "207RC0200X"],
    "ventilation":              ["207RC0200X", "207RP1001X"],
    "sepsis":                   ["207RC0200X", "207R00000X"],
    "acute respiratory":        ["207RP1001X", "207RC0200X"],
    "ards":                     ["207RP1001X", "207RC0200X"],
    "covid":                    ["207RP1001X", "207RI0200X", "207R00000X"],
    "coronavirus":              ["207RP1001X", "207RI0200X"],
    "long covid":               ["207RP1001X", "207R00000X"],
    "influenza":                ["207RP1001X", "207RI0200X"],
    "tuberculosis":             ["207RP1001X", "207RI0200X"],
    "fibrosis":                 ["207RP1001X", "207RG0100X"],

    # ── GASTROENTEROLOGY ──────────────────────────────────────────────────────
    "gastroenterology":         ["207RG0100X"],
    "gastrointestinal":         ["207RG0100X"],
    "crohn":                    ["207RG0100X", "207R00000X"],
    "crohns":                   ["207RG0100X", "207R00000X"],
    "ulcerative colitis":       ["207RG0100X", "207R00000X"],
    "colitis":                  ["207RG0100X", "207R00000X"],
    "inflammatory bowel":       ["207RG0100X", "207R00000X"],
    "ibd":                      ["207RG0100X", "207R00000X"],
    "irritable bowel":          ["207RG0100X", "207Q00000X"],
    "ibs":                      ["207RG0100X", "207Q00000X"],
    "gerd":                     ["207RG0100X", "207R00000X"],
    "acid reflux":              ["207RG0100X", "207R00000X"],
    "peptic ulcer":             ["207RG0100X", "207R00000X"],
    "celiac":                   ["207RG0100X", "207R00000X"],
    "hepatitis":                ["207RG0100X", "207RI0008X"],
    "hepatitis b":              ["207RG0100X", "207RI0008X"],
    "hepatitis c":              ["207RG0100X", "207RI0008X"],
    "liver disease":            ["207RG0100X", "207RI0008X"],
    "liver":                    ["207RG0100X", "207RI0008X"],
    "cirrhosis":                ["207RG0100X", "207RI0008X"],
    "nash":                     ["207RG0100X", "207RI0008X"],
    "fatty liver":              ["207RG0100X", "207RI0008X"],
    "pancreatitis":             ["207RG0100X", "207R00000X"],
    "gallbladder":              ["207RG0100X", "208600000X"],
    "cholangitis":              ["207RG0100X", "207RI0008X"],
    "dysphagia":                ["207RG0100X", "207R00000X"],

    # ── NEPHROLOGY ────────────────────────────────────────────────────────────
    "kidney disease":           ["207RN0300X", "207R00000X"],
    "kidney":                   ["207RN0300X", "208800000X"],
    "renal disease":            ["207RN0300X", "207R00000X"],
    "renal failure":            ["207RN0300X", "207R00000X"],
    "chronic kidney":           ["207RN0300X", "207R00000X"],
    "ckd":                      ["207RN0300X", "207R00000X"],
    "nephropathy":              ["207RN0300X", "207RE0101X"],
    "nephrotic":                ["207RN0300X"],
    "glomerulonephritis":       ["207RN0300X", "207RR0500X"],
    "dialysis":                 ["207RN0300X"],
    "kidney transplant":        ["207RN0300X", "204F00000X"],
    "transplant":               ["204F00000X", "207RN0300X"],
    "polycystic kidney":        ["207RN0300X"],
    "urinary":                  ["208800000X", "207RN0300X"],
    "urinary tract":            ["208800000X", "207R00000X"],
    "incontinence":             ["208800000X", "207V00000X"],

    # ── RHEUMATOLOGY / AUTOIMMUNE ─────────────────────────────────────────────
    "rheumatology":             ["207RR0500X"],
    "rheumatoid arthritis":     ["207RR0500X"],
    "rheumatoid":               ["207RR0500X"],
    "arthritis":                ["207RR0500X", "207R00000X"],
    "osteoarthritis":           ["207RR0500X", "207X00000X"],
    "lupus":                    ["207RR0500X"],
    "sle":                      ["207RR0500X"],
    "systemic lupus":           ["207RR0500X"],
    "psoriasis":                ["207N00000X", "207RR0500X"],
    "psoriatic arthritis":      ["207RR0500X", "207N00000X"],
    "ankylosing spondylitis":   ["207RR0500X"],
    "spondylitis":              ["207RR0500X"],
    "vasculitis":               ["207RR0500X"],
    "sjogren":                  ["207RR0500X"],
    "scleroderma":              ["207RR0500X"],
    "polymyositis":             ["207RR0500X"],
    "dermatomyositis":          ["207RR0500X", "207N00000X"],
    "myositis":                 ["207RR0500X"],
    "mixed connective":         ["207RR0500X"],
    "autoimmune":               ["207RR0500X", "207K00000X"],
    "allergy":                  ["207K00000X"],
    "allergic":                 ["207K00000X", "207RP1001X"],
    "anaphylaxis":              ["207K00000X"],
    "eczema":                   ["207N00000X", "207K00000X"],
    "atopic dermatitis":        ["207N00000X", "207K00000X"],
    "urticaria":                ["207N00000X", "207K00000X"],
    "fibromyalgia":             ["208VP0000X", "207RR0500X"],

    # ── MENTAL HEALTH / PSYCHIATRY ────────────────────────────────────────────
    "psychiatry":               ["2084P0800X", "2084P0804X"],
    "psychiatric":              ["2084P0800X"],
    "mental health":            ["2084P0800X", "2084P0804X"],
    "depression":               ["2084P0800X", "2084P0804X"],
    "major depressive":         ["2084P0800X", "2084P0804X"],
    "mdd":                      ["2084P0800X"],
    "anxiety":                  ["2084P0800X", "2084P0804X"],
    "generalized anxiety":      ["2084P0800X", "2084P0804X"],
    "panic disorder":           ["2084P0800X"],
    "social anxiety":           ["2084P0800X", "2084P0804X"],
    "schizophrenia":            ["2084P0800X"],
    "psychosis":                ["2084P0800X"],
    "schizoaffective":          ["2084P0800X"],
    "bipolar":                  ["2084P0800X"],
    "mania":                    ["2084P0800X"],
    "manic":                    ["2084P0800X"],
    "ptsd":                     ["2084P0800X", "2084P0804X"],
    "post-traumatic":           ["2084P0800X"],
    "post traumatic":           ["2084P0800X"],
    "trauma":                   ["2084P0800X"],
    "adhd":                     ["2084P0800X", "2084P0804X", "208000000X"],
    "attention deficit":        ["2084P0800X", "2084P0804X", "208000000X"],
    "autism":                   ["2084P0804X", "208000000X"],
    "autism spectrum":          ["2084P0804X", "208000000X"],
    "asd":                      ["2084P0804X", "208000000X"],
    "ocd":                      ["2084P0800X", "2084P0804X"],
    "obsessive compulsive":     ["2084P0800X"],
    "eating disorder":          ["2084P0800X", "2084P0804X"],
    "anorexia":                 ["2084P0800X", "2084P0804X"],
    "bulimia":                  ["2084P0800X", "2084P0804X"],
    "addiction":                ["2084P0802X", "207QA0401X"],
    "substance use":            ["2084P0802X", "207QA0401X"],
    "alcohol use":              ["2084P0802X", "207QA0401X"],
    "opioid":                   ["2084P0802X", "207QA0401X"],
    "insomnia":                 ["2084S0010X", "2084P0800X"],
    "sleep disorder":           ["2084S0010X", "207RP1001X"],

    # ── INFECTIOUS DISEASE ────────────────────────────────────────────────────
    "infectious disease":       ["207RI0200X"],
    "infection":                ["207RI0200X", "207R00000X"],
    "hiv":                      ["207RI0200X", "207R00000X"],
    "aids":                     ["207RI0200X"],
    "antiretroviral":           ["207RI0200X"],
    "malaria":                  ["207RI0200X"],
    "lyme":                     ["207RI0200X", "207RR0500X"],
    "fungal":                   ["207RI0200X"],
    "bacterial":                ["207RI0200X", "207R00000X"],
    "viral":                    ["207RI0200X", "207R00000X"],

    # ── DERMATOLOGY ───────────────────────────────────────────────────────────
    "dermatology":              ["207N00000X"],
    "skin":                     ["207N00000X"],
    "acne":                     ["207N00000X"],
    "rosacea":                  ["207N00000X"],
    "vitiligo":                 ["207N00000X"],
    "alopecia":                 ["207N00000X"],
    "pemphigus":                ["207N00000X", "207RR0500X"],
    "hidradenitis":             ["207N00000X"],

    # ── UROLOGY ───────────────────────────────────────────────────────────────
    "urology":                  ["208800000X"],
    "urological":               ["208800000X"],
    "benign prostatic":         ["208800000X"],
    "bph":                      ["208800000X"],
    "erectile":                 ["208800000X"],
    "kidney stones":            ["208800000X", "207RN0300X"],
    "nephrolithiasis":          ["208800000X", "207RN0300X"],
    "overactive bladder":       ["208800000X"],

    # ── OPHTHALMOLOGY ─────────────────────────────────────────────────────────
    "ophthalmology":            ["207W00000X"],
    "ophthalm":                 ["207W00000X"],
    "glaucoma":                 ["207W00000X"],
    "macular degeneration":     ["207W00000X"],
    "diabetic retinopathy":     ["207W00000X", "207RE0101X"],
    "retina":                   ["207W00000X"],
    "retinal":                  ["207W00000X"],
    "cataract":                 ["207W00000X"],
    "uveitis":                  ["207W00000X", "207RR0500X"],
    "dry eye":                  ["207W00000X"],

    # ── OBSTETRICS / GYNECOLOGY ───────────────────────────────────────────────
    "obstetrics":               ["207V00000X"],
    "gynecology":               ["207V00000X", "207VX0201X"],
    "pregnancy":                ["207V00000X"],
    "preeclampsia":             ["207V00000X"],
    "endometriosis":            ["207V00000X", "207VX0201X"],
    "fibroids":                 ["207V00000X", "207VX0201X"],
    "pelvic":                   ["207V00000X", "2088F0040X"],
    "infertility":              ["207V00000X", "207VX0201X"],

    # ── ORTHOPEDICS / MUSCULOSKELETAL ─────────────────────────────────────────
    "orthopedic":               ["207X00000X"],
    "orthopaedic":              ["207X00000X"],
    "fracture":                 ["207X00000X", "208100000X"],
    "back pain":                ["207X00000X", "208VP0000X"],
    "spine":                    ["207XS0106X", "2084N0400X"],
    "scoliosis":                ["207XS0106X", "207X00000X"],
    "tendon":                   ["207X00000X", "207QS0010X"],
    "rotator cuff":             ["207X00000X", "207QS0010X"],
    "sports injury":            ["207QS0010X", "207X00000X"],

    # ── PAIN MEDICINE ─────────────────────────────────────────────────────────
    "pain":                     ["208VP0000X", "208VP0014X", "207LP2900X"],
    "chronic pain":             ["208VP0000X", "208VP0014X"],
    "neuropathic pain":         ["208VP0000X", "2084N0400X"],
    "low back pain":            ["208VP0000X", "207X00000X"],

    # ── HEMATOLOGY ────────────────────────────────────────────────────────────
    "hematology":               ["207RH0000X", "207RH0003X"],
    "anemia":                   ["207RH0000X", "207R00000X"],
    "sickle cell":              ["207RH0000X", "207RH0003X"],
    "hemophilia":               ["207RH0000X"],
    "thrombocytopenia":         ["207RH0000X", "207RR0500X"],
    "coagulation":              ["207RH0000X"],
    "bleeding disorder":        ["207RH0000X"],

    # ── PEDIATRICS ────────────────────────────────────────────────────────────
    "pediatric":                ["208000000X", "2080P0207X"],
    "childhood":                ["208000000X"],
    "juvenile":                 ["208000000X", "207RR0500X"],
    "neonatal":                 ["208000000X"],

    # ── GERIATRICS ────────────────────────────────────────────────────────────
    "geriatric":                ["207QG0300X", "207RG0300X"],
    "aging":                    ["207QG0300X"],
    "elderly":                  ["207QG0300X"],
    "frailty":                  ["207QG0300X"],

    # ── GENERAL / FALLBACK ────────────────────────────────────────────────────
    "preventive":               ["2083P0901X", "207Q00000X"],
    "primary care":             ["207Q00000X", "208D00000X"],
    "general":                  ["207Q00000X", "208D00000X", "207R00000X"],
    "internal medicine":        ["207R00000X"],
    "hospitalist":              ["208M00000X"],
    "critical care":            ["207RC0200X", "207LC0200X"],
    "intensive care":           ["207RC0200X"],
    "palliative":               ["207R00000X", "207Q00000X"],
    "rehabilitation":           ["208100000X"],
    "physical medicine":        ["208100000X"],
    "osteoporosis":             ["207RE0101X", "207RR0500X"],
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

CODE_TO_DESCRIPTION = {
    "207R00000X": "Internal Medicine",
    "207RB0002X": "Obesity Medicine",
    "207RC0000X": "Cardiovascular Disease",
    "207RC0001X": "Clinical Cardiac Electrophysiology",
    "207RE0101X": "Endocrinology, Diabetes & Metabolism",
    "207RG0100X": "Gastroenterology",
    "207RG0300X": "Geriatric Medicine",
    "207RH0000X": "Hematology",
    "207RH0003X": "Hematology & Oncology",
    "207RI0001X": "Interventional Cardiology",
    "207RI0008X": "Hepatology",
    "207RI0200X": "Infectious Disease",
    "207RN0300X": "Nephrology",
    "207RP1001X": "Pulmonary Disease",
    "207RR0500X": "Rheumatology",
    "207RT0003X": "Transplant Hepatology",
    "207RX0202X": "Medical Oncology",
    "207K00000X": "Allergy & Immunology",
    "207KI0005X": "Clinical & Laboratory Immunology",
    "208600000X": "Surgery",
    "2086S0102X": "Surgical Oncology",
    "2086S0127X": "Surgical Critical Care",
    "2086S0129X": "Vascular Surgery",
    "2086S0120X": "Pediatric Surgery",
    "208G00000X": "Thoracic Surgery",
    "204F00000X": "Transplant Surgery",
    "2085R0001X": "Radiation Oncology",
    "2085R0202X": "Radiological Physics",
    "2085R0203X": "Diagnostic Radiology",
    "2085R0204X": "Interventional Radiology",
    "2085U0001X": "Nuclear Medicine",
    "2085N0700X": "Neuroradiology",
    "2085V0002X": "Vascular & Interventional Radiology",
    "2084N0400X": "Neurology",
    "2084N0402X": "Child Neurology",
    "2084A0401X": "Neurological Surgery",
    "2084B0040X": "Behavioral Neurology & Neuropsychiatry",
    "2084E0001X": "Epilepsy",
    "2084H0002X": "Headache Medicine",
    "2084N0600X": "NeuroCritical Care",
    "2084P0005X": "Pain Medicine (Neurology)",
    "2084P0800X": "Psychiatry",
    "2084P0802X": "Addiction Psychiatry",
    "2084P0804X": "Child & Adolescent Psychiatry",
    "2084P2900X": "Neuropsychiatry",
    "2084V0102X": "Vascular Neurology",
    "207RC0200X": "Critical Care Medicine",
    "208800000X": "Urology",
    "2088F0040X": "Female Pelvic Medicine & Reconstructive Surgery",
    "2088P0231X": "Pediatric Urology",
    "207V00000X": "Obstetrics & Gynecology",
    "207VG0400X": "Gynecologic Oncology",
    "207VX0201X": "Gynecology",
    "207N00000X": "Dermatology",
    "207ND0101X": "MOHS-Micrographic Surgery",
    "207ND0900X": "Dermatopathology",
    "207NP0225X": "Pediatric Dermatology",
    "207ZP0101X": "Anatomic Pathology",
    "207ZP0102X": "Anatomic & Clinical Pathology",
    "207ZP0105X": "Clinical Pathology",
    "207ZH0000X": "Hematology Pathology",
    "207ZN0500X": "Neuropathology",
    "207ZP0007X": "Molecular Genetic Pathology",
    "207X00000X": "Orthopaedic Surgery",
    "207XS0106X": "Orthopaedic Surgery of the Spine",
    "207XS0114X": "Adult Reconstructive Orthopaedic Surgery",
    "207XS0117X": "Foot and Ankle Surgery",
    "207XP3100X": "Pediatric Orthopaedic Surgery",
    "207XT0100X": "Orthopaedic Trauma",
    "207P00000X": "Emergency Medicine",
    "207PP0204X": "Pediatric Emergency Medicine",
    "207Q00000X": "Family Medicine",
    "207QA0401X": "Addiction Medicine",
    "207QG0300X": "Geriatric Medicine",
    "207QS0010X": "Sports Medicine",
    "208000000X": "Pediatrics",
    "2080P0207X": "Pediatric Hematology-Oncology",
    "2080P0202X": "Pediatric Cardiology",
    "2080P0205X": "Pediatric Endocrinology",
    "2080P0206X": "Pediatric Gastroenterology",
    "2080P0208X": "Pediatric Infectious Diseases",
    "208100000X": "Physical Medicine & Rehabilitation",
    "2081P2900X": "Pain Medicine (PM&R)",
    "208200000X": "Plastic Surgery",
    "208C00000X": "Colon & Rectal Surgery",
    "208D00000X": "General Practice",
    "208M00000X": "Hospitalist",
    "208VP0000X": "Pain Medicine",
    "208VP0014X": "Interventional Pain Medicine",
    "207L00000X": "Anesthesiology",
    "207LC0200X": "Critical Care Medicine (Anesthesiology)",
    "207LP2900X": "Pain Medicine (Anesthesiology)",
    "207LP3000X": "Pediatric Anesthesiology",
    "207W00000X": "Ophthalmology",
    "2083X0100X": "Occupational Medicine",
    "2083T0002X": "Medical Toxicology",
    "2083P0901X": "Public Health & General Preventive Medicine",
    "2083B0002X": "Obesity Medicine (Prev Med)",
    "2083C0008X": "Clinical Informatics",
    "207RM1200X": "Hospice and Palliative Medicine",
    "207RK0002X": "Clinical Pharmacology",
    "2084S0010X": "Sleep Medicine (Neurology)",
    "2084N0008X": "Neuromuscular Medicine",
}


def get_taxonomy_codes_for_condition(condition: str) -> list[str]:
    """Map a condition string to relevant physician taxonomy codes.
    Matches ALL keywords found in the condition string (longest first)
    so compound conditions like 'atrial fibrillation' get full coverage.
    """
    if not condition:
        return []
    condition_lower = condition.lower().strip()
    matched_codes: list[str] = []
    seen: set[str] = set()
    for keyword in sorted(CONDITION_TO_TAXONOMY_CODES.keys(), key=len, reverse=True):
        if keyword in condition_lower:
            for code in CONDITION_TO_TAXONOMY_CODES[keyword]:
                if code not in seen:
                    seen.add(code)
                    matched_codes.append(code)
    if matched_codes:
        logger.info(f"Mapped condition '{condition}' -> taxonomy codes {matched_codes}")
        return matched_codes
    logger.info(f"No code mapping for '{condition}' -- using general physician codes.")
    return ["207R00000X", "207RH0003X", "207RX0202X"]


def normalize_state(state: str) -> str | None:
    if not state:
        return None
    s = state.strip()
    if len(s) == 2:
        return s.upper()
    return STATE_ABBR.get(s.lower(), s.upper())


def _is_physician(taxonomies: list) -> bool:
    if not taxonomies:
        return False
    codes = {t.get("code", "") for t in taxonomies}
    if codes & NON_PHYSICIAN_TAXONOMY_CODES:
        return False
    return bool(codes & PHYSICIAN_TAXONOMY_CODES)


async def _query_nppes(
    city: str | None,
    state: str | None,
    limit: int,
    taxonomy_description: str | None = None,
) -> list:
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
        logger.error(f"NPPES HTTP error: {e.response.status_code}")
        return []
    except httpx.RequestError as e:
        logger.error(f"NPPES request failed: {e}")
        return []

    raw = data.get("results", [])
    logger.info(f"NPPES returned {len(raw)} results (city={city}, state={state}, taxonomy={taxonomy_description})")
    return raw


def _parse_physician(
    item: dict,
    expected_city: str | None = None,
    expected_state: str | None = None,
) -> dict | None:
    basic = item.get("basic", {})
    addresses = item.get("addresses", [])
    taxonomies = item.get("taxonomies", [])

    if not _is_physician(taxonomies):
        return None

    practice_address = next(
        (a for a in addresses if a.get("address_purpose") == "LOCATION"), None
    )
    if not practice_address:
        return None

    # FIX: strict city match prevents Portland ME appearing for Portland OR
    if expected_city:
        provider_city = (practice_address.get("city") or "").strip().lower()
        if provider_city != expected_city.strip().lower():
            return None

    # FIX: strict state match when state is known
    if expected_state:
        provider_state = (practice_address.get("state") or "").strip().upper()
        if provider_state != expected_state.strip().upper():
            return None

    primary_taxonomy = next(
        (t for t in taxonomies if t.get("primary")),
        taxonomies[0] if taxonomies else {}
    )
    taxonomy_code = primary_taxonomy.get("code", "")
    taxonomy_description = (
        CODE_TO_DESCRIPTION.get(taxonomy_code)
        or primary_taxonomy.get("desc")
        or "Unknown"
    )

    full_address = (
        f"{practice_address.get('address_1', '')}, "
        f"{practice_address.get('city', '')}, "
        f"{practice_address.get('state', '')} "
        f"{practice_address.get('postal_code', '')}"
    )

    return {
        "npi": item.get("number"),
        "name": f"{basic.get('first_name', '')} {basic.get('last_name', '')}".strip(),
        "credential": (basic.get("credential") or "").strip(),
        "city": practice_address.get("city"),
        "state": practice_address.get("state"),
        "address": practice_address.get("address_1"),
        "postal_code": practice_address.get("postal_code"),
        "specialty": taxonomy_description,
        "taxonomyCode": taxonomy_code,
        "taxonomyDescription": taxonomy_description,
        "full_address": full_address,
    }


async def fetch_physicians_near(
    city: str | None = None,
    state: str | None = None,
    condition: str | None = None,
    limit: int = 10,
) -> list:
    """
    Condition-first, location-second physician search.

    1. Map condition -> relevant specialty taxonomy codes
    2. Query NPPES by taxonomy + city (most specific)
    3. Fall back to taxonomy + state if city yields nothing
    4. Fall back to taxonomy nationally if state yields nothing
    5. Last resort: unfiltered location search
    """
    state_code = normalize_state(state) if state else None
    taxonomy_codes = get_taxonomy_codes_for_condition(condition) if condition else []

    logger.info(f"Fetching physicians: condition={condition}, city={city}, state={state_code}, codes={taxonomy_codes}")

    seen_npis: set = set()
    results: list = []

    async def collect_by_taxonomy(query_city, query_state, strict_city, codes, strict_state=None):
        """Query NPPES by condition taxonomy codes + location."""
        for code in codes:
            if len(results) >= limit:
                break
            desc = CODE_TO_DESCRIPTION.get(code, "Internal Medicine")
            raw = await _query_nppes(query_city, query_state, limit * 5, desc)
            for item in raw:
                npi = item.get("number")
                if npi in seen_npis:
                    continue
                seen_npis.add(npi)
                parsed = _parse_physician(item, expected_city=strict_city, expected_state=strict_state)
                if parsed:
                    results.append(parsed)
                if len(results) >= limit:
                    break

    async def collect_unfiltered(query_city, query_state, strict_city, strict_state=None):
        """Fallback: query NPPES by location only, no taxonomy filter."""
        raw = await _query_nppes(query_city, query_state, limit * 5)
        for item in raw:
            npi = item.get("number")
            if npi in seen_npis:
                continue
            seen_npis.add(npi)
            parsed = _parse_physician(item, expected_city=strict_city, expected_state=strict_state)
            if parsed:
                results.append(parsed)
            if len(results) >= limit:
                break

    if taxonomy_codes:
        # Step 1: condition taxonomy + city + state (most specific, no city ambiguity)
        if city:
            await collect_by_taxonomy(city, state_code, strict_city=city, codes=taxonomy_codes, strict_state=state_code)

        # Step 2: condition taxonomy + state only
        if not results and state_code:
            logger.info(f"No city results for condition, trying state={state_code}")
            await collect_by_taxonomy(None, state_code, strict_city=None, codes=taxonomy_codes, strict_state=state_code)

        # Step 3: condition taxonomy nationally
        if not results:
            logger.info("No state results for condition, trying national")
            await collect_by_taxonomy(None, None, strict_city=None, codes=taxonomy_codes)

    # Step 4: unfiltered fallback
    if not results:
        logger.warning("No condition-matched physicians found, falling back to unfiltered location search")
        if city:
            await collect_unfiltered(city, state_code, strict_city=city, strict_state=state_code)
        if not results and state_code:
            await collect_unfiltered(None, state_code, strict_city=None, strict_state=state_code)

    logger.info(f"Found {len(results)} physicians before geocoding")
    if not results:
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

    geocoded = await asyncio.gather(*[geocode_physician(p) for p in results[:limit]])
    logger.info(f"Returning {len(geocoded)} physicians")
    return list(geocoded)


# Alias so physicians.py import works with either name
fetch_physicians_accurate = fetch_physicians_near