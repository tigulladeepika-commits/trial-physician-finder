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

  const baseInput: React.CSSProperties = {
    width: "100%",
    background: "#f8faff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    padding: "9px 13px",
    fontSize: "13px",
    color: "#1e293b",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
    WebkitAppearance: "none",
    appearance: "none",
  };

  const focusedStyle: React.CSSProperties = {
    borderColor: "#6366f1",
    background: "#fff",
    boxShadow: "0 0 0 3px rgba(99,102,241,0.1)",
  };

  const getStyle = (field: string) =>
    focused === field ? { ...baseInput, ...focusedStyle } : baseInput;

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.7px",
    textTransform: "uppercase",
    color: "#94a3b8",
    marginBottom: "6px",
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#6366f1",
    marginBottom: "2px",
  };

  const divider: React.CSSProperties = {
    height: "1px",
    background: "linear-gradient(90deg, rgba(99,102,241,0.12), transparent)",
    margin: "4px 0",
  };

  return (
    <>
      <style>{`
        .f-input::placeholder { color: #cbd5e1; }
        .f-select option { background: #fff; color: #1e293b; }
        .clear-filters-btn {
          width: 100%;
          background: transparent;
          color: #94a3b8;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 9px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          margin-top: 6px;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
          letter-spacing: 0.2px;
        }
        .clear-filters-btn:hover {
          color: #6366f1;
          border-color: rgba(99,102,241,0.35);
          background: rgba(99,102,241,0.04);
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>

        <div style={sectionLabel}>Location</div>

        <div>
          <label htmlFor="filter-city" style={labelStyle}>City</label>
          <input id="filter-city" name="city" className="f-input"
            placeholder="e.g. Boston"
            value={values.city}
            style={getStyle("city")}
            onFocus={() => setFocused("city")}
            onBlur={() => setFocused(null)}
            onChange={(e) => handleChange("city", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="filter-state" style={labelStyle}>State</label>
          <input id="filter-state" name="state" className="f-input"
            placeholder="e.g. MA"
            value={values.state}
            style={getStyle("state")}
            onFocus={() => setFocused("state")}
            onBlur={() => setFocused(null)}
            onChange={(e) => handleChange("state", e.target.value)}
          />
        </div>

        <div style={divider} />
        <div style={sectionLabel}>Trial Details</div>

        <div>
          <label htmlFor="filter-condition" style={labelStyle}>Condition</label>
          <input id="filter-condition" name="condition" className="f-input"
            placeholder="e.g. Oncology, Diabetes..."
            value={values.condition}
            style={getStyle("condition")}
            onFocus={() => setFocused("condition")}
            onBlur={() => setFocused(null)}
            onChange={(e) => handleChange("condition", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="filter-specialty" style={labelStyle}>Specialty</label>
          <input id="filter-specialty" name="specialty" className="f-input"
            placeholder="e.g. Oncology"
            value={values.specialty}
            style={getStyle("specialty")}
            onFocus={() => setFocused("specialty")}
            onBlur={() => setFocused(null)}
            onChange={(e) => handleChange("specialty", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="filter-status" style={labelStyle}>Status</label>
          <div style={{ position: "relative" }}>
            <select id="filter-status" name="status" className="f-select"
              value={values.status}
              style={{ ...getStyle("status"), paddingRight: "30px" }}
              onFocus={() => setFocused("status")}
              onBlur={() => setFocused(null)}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", fontSize: "10px" }}>▼</span>
          </div>
        </div>

        <div>
          <label htmlFor="filter-phase" style={labelStyle}>Phase</label>
          <div style={{ position: "relative" }}>
            <select id="filter-phase" name="phase" className="f-select"
              value={values.phase}
              style={{ ...getStyle("phase"), paddingRight: "30px" }}
              onFocus={() => setFocused("phase")}
              onBlur={() => setFocused(null)}
              onChange={(e) => handleChange("phase", e.target.value)}
            >
              <option value="">All phases</option>
              {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <span style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", fontSize: "10px" }}>▼</span>
          </div>
        </div>

        <button
          className="clear-filters-btn"
          onClick={() => {
            const empty = { condition: "", city: "", state: "", specialty: "", status: "", phase: "" };
            setValues(empty);
            onFilterChange(empty);
          }}
        >
          Clear all filters
        </button>
      </div>
    </>
  );
}