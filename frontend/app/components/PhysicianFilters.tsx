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

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "13px",
  color: "#e2e8f0",
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  transition: "border-color 0.2s, background 0.2s",
  WebkitAppearance: "none",
  appearance: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  color: "#64748b",
  marginBottom: "7px",
};

export default function PhysicianFilters({ onFilterChange }: Props) {
  const [values, setValues] = useState<FilterValues>({
    condition: "",
    city: "",
    state: "",
    specialty: "",
    status: "",
    phase: "",
  });

  const [focused, setFocused] = useState<string | null>(null);

  const handleChange = (field: keyof FilterValues, value: string) => {
    const updated = { ...values, [field]: value };
    setValues(updated);
    onFilterChange(updated);
  };

  const getFocusStyle = (field: string): React.CSSProperties =>
    focused === field
      ? { borderColor: "rgba(56,189,248,0.5)", background: "rgba(56,189,248,0.06)" }
      : {};

  return (
    <>
      <style>{`
        .filter-input::placeholder { color: #334155; }
        .filter-select option { background: #1e293b; color: #e2e8f0; }
        .filter-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 4px 0;
        }
        .filter-section-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #38bdf8;
          margin-bottom: 2px;
        }
        .clear-btn {
          width: 100%;
          background: transparent;
          color: #475569;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 10px;
          font-size: 12px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          margin-top: 8px;
          transition: color 0.2s, border-color 0.2s;
        }
        .clear-btn:hover { color: #94a3b8; border-color: rgba(255,255,255,0.14); }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

        <div className="filter-section-label">Location</div>

        <div>
          <label htmlFor="filter-city" style={labelStyle}>City</label>
          <input
            id="filter-city"
            name="city"
            className="filter-input"
            placeholder="e.g. Boston"
            value={values.city}
            style={{ ...inputStyle, ...getFocusStyle("city") }}
            onFocus={() => setFocused("city")}
            onBlur={() => setFocused(null)}
            onChange={(e) => handleChange("city", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="filter-state" style={labelStyle}>State</label>
          <input
            id="filter-state"
            name="state"
            className="filter-input"
            placeholder="e.g. MA"
            value={values.state}
            style={{ ...inputStyle, ...getFocusStyle("state") }}
            onFocus={() => setFocused("state")}
            onBlur={() => setFocused(null)}
            onChange={(e) => handleChange("state", e.target.value)}
          />
        </div>

        <div className="filter-divider" />
        <div className="filter-section-label">Trial Details</div>

        <div>
          <label htmlFor="filter-condition" style={labelStyle}>Condition</label>
          <input
            id="filter-condition"
            name="condition"
            className="filter-input"
            placeholder="e.g. Oncology, Diabetes..."
            value={values.condition}
            style={{ ...inputStyle, ...getFocusStyle("condition") }}
            onFocus={() => setFocused("condition")}
            onBlur={() => setFocused(null)}
            onChange={(e) => handleChange("condition", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="filter-specialty" style={labelStyle}>Specialty</label>
          <input
            id="filter-specialty"
            name="specialty"
            className="filter-input"
            placeholder="e.g. Oncology"
            value={values.specialty}
            style={{ ...inputStyle, ...getFocusStyle("specialty") }}
            onFocus={() => setFocused("specialty")}
            onBlur={() => setFocused(null)}
            onChange={(e) => handleChange("specialty", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="filter-status" style={labelStyle}>Status</label>
          <div style={{ position: "relative" }}>
            <select
              id="filter-status"
              name="status"
              className="filter-select"
              value={values.status}
              style={{ ...inputStyle, ...getFocusStyle("status"), paddingRight: "32px" }}
              onFocus={() => setFocused("status")}
              onBlur={() => setFocused(null)}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none", fontSize: "10px" }}>▼</span>
          </div>
        </div>

        <div>
          <label htmlFor="filter-phase" style={labelStyle}>Phase</label>
          <div style={{ position: "relative" }}>
            <select
              id="filter-phase"
              name="phase"
              className="filter-select"
              value={values.phase}
              style={{ ...inputStyle, ...getFocusStyle("phase"), paddingRight: "32px" }}
              onFocus={() => setFocused("phase")}
              onBlur={() => setFocused(null)}
              onChange={(e) => handleChange("phase", e.target.value)}
            >
              <option value="">All phases</option>
              {PHASES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none", fontSize: "10px" }}>▼</span>
          </div>
        </div>

        <button
          className="clear-btn"
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