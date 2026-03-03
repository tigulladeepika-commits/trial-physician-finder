"use client";

import { useState } from "react";

type FilterValues = {
  condition: string;
  city: string;
  state: string;
  specialty: string;
  status: string;
  phase: string;
};

type Props = {
  onFilterChange: (filters: FilterValues) => void;
};

const STATUSES = [
  "RECRUITING",
  "NOT YET RECRUITING",
  "ACTIVE, NOT RECRUITING",
  "COMPLETED",
  "TERMINATED",
];
const PHASES = ["PHASE1", "PHASE2", "PHASE3", "PHASE4"];

export default function PhysicianFilters({ onFilterChange }: Props) {
  const [values, setValues] = useState<FilterValues>({
    condition: "", city: "", state: "", specialty: "", status: "", phase: "",
  });
  const [focused, setFocused] = useState<string | null>(null);

  const handleChange = (field: keyof FilterValues, value: string) => {
    const updated = { ...values, [field]: value };
    setValues(updated);
    onFilterChange(updated);
  };

  const base: React.CSSProperties = {
    width: "100%",
    background: "#f8faff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "9px",
    padding: "9px 12px",
    fontSize: "13px",
    color: "#1e293b",
    fontFamily: "'Inter', -apple-system, sans-serif",
    outline: "none",
    transition: "border-color 0.18s, box-shadow 0.18s",
    WebkitAppearance: "none",
    appearance: "none",
  };

  const activeStyle: React.CSSProperties = {
    borderColor: "#6366f1",
    background: "#fff",
    boxShadow: "0 0 0 3px rgba(99,102,241,0.1)",
  };

  const g = (f: string) => focused === f ? { ...base, ...activeStyle } : base;

  const lbl: React.CSSProperties = {
    display: "block",
    fontSize: "11px", fontWeight: 600,
    letterSpacing: "0.5px", textTransform: "uppercase",
    color: "#94a3b8", marginBottom: "6px",
    fontFamily: "'Inter', sans-serif",
  };

  const sectionLbl: React.CSSProperties = {
    fontSize: "10px", fontWeight: 700,
    letterSpacing: "1px", textTransform: "uppercase",
    color: "#6366f1", marginBottom: "2px",
    fontFamily: "'Inter', sans-serif",
  };

  const divider: React.CSSProperties = {
    height: "1px",
    background: "linear-gradient(90deg, #e0e7ff, transparent)",
    margin: "4px 0",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      <div style={sectionLbl}>Trial Details</div>

      <div>
        <label htmlFor="f-condition" style={lbl}>Condition</label>
        <input id="f-condition" name="condition" className="f-inp"
          placeholder="e.g. Oncology, Diabetes..."
          value={values.condition} style={g("condition")}
          onFocus={() => setFocused("condition")} onBlur={() => setFocused(null)}
          onChange={(e) => handleChange("condition", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="f-specialty" style={lbl}>Specialty</label>
        <input id="f-specialty" name="specialty" className="f-inp"
          placeholder="e.g. Oncology"
          value={values.specialty} style={g("specialty")}
          onFocus={() => setFocused("specialty")} onBlur={() => setFocused(null)}
          onChange={(e) => handleChange("specialty", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="f-status" style={lbl}>Status</label>
        <div style={{ position: "relative" }}>
          <select id="f-status" name="status" className="f-sel"
            value={values.status}
            style={{ ...g("status"), paddingRight: "28px" }}
            onFocus={() => setFocused("status")} onBlur={() => setFocused(null)}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", fontSize: "9px" }}>▼</span>
        </div>
      </div>

      <div>
        <label htmlFor="f-phase" style={lbl}>Phase</label>
        <div style={{ position: "relative" }}>
          <select id="f-phase" name="phase" className="f-sel"
            value={values.phase}
            style={{ ...g("phase"), paddingRight: "28px" }}
            onFocus={() => setFocused("phase")} onBlur={() => setFocused(null)}
            onChange={(e) => handleChange("phase", e.target.value)}
          >
            <option value="">All phases</option>
            {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", fontSize: "9px" }}>▼</span>
        </div>
      </div>

      <div style={divider} />

      <div style={sectionLbl}>Location</div>

      <div>
        <label htmlFor="f-city" style={lbl}>City</label>
        <input id="f-city" name="city" className="f-inp"
          placeholder="e.g. Boston"
          value={values.city} style={g("city")}
          onFocus={() => setFocused("city")} onBlur={() => setFocused(null)}
          onChange={(e) => handleChange("city", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="f-state" style={lbl}>State</label>
        <input id="f-state" name="state" className="f-inp"
          placeholder="e.g. MA"
          value={values.state} style={g("state")}
          onFocus={() => setFocused("state")} onBlur={() => setFocused(null)}
          onChange={(e) => handleChange("state", e.target.value)}
        />
      </div>

      <button className="clear-btn" onClick={() => {
        const e = { condition: "", city: "", state: "", specialty: "", status: "", phase: "" };
        setValues(e); onFilterChange(e);
      }}>
        Clear all filters
      </button>
    </div>
  );
}