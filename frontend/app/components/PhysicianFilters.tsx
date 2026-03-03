"use client";

import { useState, useEffect } from "react";

type FilterState = {
  condition: string;
  city: string;
  state: string;
  specialty: string;
  status: string;
  phase: string;
};

type Props = {
  onFilterChange: (filters: FilterState) => void;
  loading?: boolean;
};

const SPECIALTIES = [
  "Hematology & Oncology", "Medical Oncology", "Radiation Oncology",
  "Surgical Oncology", "Cardiovascular Disease", "Clinical Cardiac Electrophysiology",
  "Endocrinology, Diabetes & Metabolism", "Gastroenterology", "Neurology",
  "Psychiatry", "Pulmonary Disease", "Rheumatology", "Nephrology",
  "Infectious Disease", "Dermatology", "Urology", "Obstetrics & Gynecology",
  "Allergy & Immunology", "Orthopaedic Surgery", "Pain Medicine",
  "Internal Medicine", "Family Medicine", "Pediatrics",
];

const STATUSES: Record<string, string> = {
  RECRUITING: "Recruiting",
  ACTIVE_NOT_RECRUITING: "Active (Not Recruiting)",
  COMPLETED: "Completed",
  NOT_YET_RECRUITING: "Not Yet Recruiting",
  TERMINATED: "Terminated",
  WITHDRAWN: "Withdrawn",
  SUSPENDED: "Suspended",
};

const PHASES: Record<string, string> = {
  EARLY_PHASE1: "Early Phase 1",
  PHASE1: "Phase 1",
  PHASE2: "Phase 2",
  PHASE3: "Phase 3",
  PHASE4: "Phase 4",
  NA: "N/A",
};

const EMPTY: FilterState = { condition: "", city: "", state: "", specialty: "", status: "", phase: "" };

// Named export — matches page.tsx: import { PhysicianFilters } from '../components/PhysicianFilters'
export function PhysicianFilters({ onFilterChange, loading = false }: Props) {
  const [selects, setSelects] = useState<Pick<FilterState, "specialty" | "status" | "phase">>({
    specialty: "", status: "", phase: "",
  });
  const [draftCondition, setDraftCondition] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftState, setDraftState] = useState("");

  // Debounce free-text fields — fires 450ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      onFilterChange({ ...selects, condition: draftCondition, city: draftCity, state: draftState });
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftCondition, draftCity, draftState]);

  const handleSelect = (key: keyof typeof selects, value: string) => {
    const next = { ...selects, [key]: value };
    setSelects(next);
    onFilterChange({ ...next, condition: draftCondition, city: draftCity, state: draftState });
  };

  const clearAll = () => {
    setSelects({ specialty: "", status: "", phase: "" });
    setDraftCondition(""); setDraftCity(""); setDraftState("");
    onFilterChange(EMPTY);
  };

  const hasActive = draftCondition || draftCity || draftState || selects.specialty || selects.status || selects.phase;

  const inputCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50";

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Condition / Disease</label>
        <input className={inputCls} placeholder="e.g. diabetes, breast cancer" value={draftCondition}
          disabled={loading} onChange={(e) => setDraftCondition(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
        <input className={inputCls} placeholder="e.g. Boston" value={draftCity}
          disabled={loading} onChange={(e) => setDraftCity(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
        <input className={inputCls} placeholder="e.g. MA or Massachusetts" value={draftState}
          disabled={loading} onChange={(e) => setDraftState(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
        <select className={inputCls} value={selects.specialty} disabled={loading}
          onChange={(e) => handleSelect("specialty", e.target.value)}>
          <option value="">All Specialties</option>
          {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Trial Status</label>
        <select className={inputCls} value={selects.status} disabled={loading}
          onChange={(e) => handleSelect("status", e.target.value)}>
          <option value="">Any Status</option>
          {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Trial Phase</label>
        <select className={inputCls} value={selects.phase} disabled={loading}
          onChange={(e) => handleSelect("phase", e.target.value)}>
          <option value="">Any Phase</option>
          {Object.entries(PHASES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {hasActive && (
        <button className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          onClick={clearAll} disabled={loading}>
          Clear All Filters
        </button>
      )}
    </div>
  );
}

export default PhysicianFilters;