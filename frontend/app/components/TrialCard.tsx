"use client";

import { useState, useMemo } from "react";
import { Trial, Physician } from "../types";
import { fetchPhysicians } from "../utils/api";
import PhysicianCard from "./PhysicianCard";
import dynamic from "next/dynamic";
const PhysicianTrialMap = dynamic(() => import("./PhysicianTrialMap"), { ssr: false });

type TrialCardProps = {
  trial: Trial;
};

const NON_US = [
  "Israel", "Germany", "India", "Spain", "Italy", "Australia",
  "Finland", "Poland", "Netherlands", "Sweden", "United Kingdom",
  "Canada", "France", "Taiwan", "South Korea", "Greece",
];

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  RECRUITING:              { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  COMPLETED:               { bg: "#f8fafc", color: "#64748b", dot: "#94a3b8" },
  TERMINATED:              { bg: "#fff7ed", color: "#c2410c", dot: "#f97316" },
  UNKNOWN:                 { bg: "#fafafa", color: "#6b7280", dot: "#d1d5db" },
  "NOT YET RECRUITING":    { bg: "#eff6ff", color: "#1d4ed8", dot: "#60a5fa" },
  "ACTIVE, NOT RECRUITING":{ bg: "#faf5ff", color: "#7c3aed", dot: "#a78bfa" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status?.toUpperCase()] ?? STATUS_STYLES["UNKNOWN"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: s.bg, color: s.color,
      fontSize: "11px", fontWeight: 600, padding: "3px 8px",
      borderRadius: "100px", letterSpacing: "0.3px", textTransform: "uppercase",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

export default function TrialCard({ trial }: TrialCardProps) {
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [taxonomyFilter, setTaxonomyFilter] = useState<string>("all");

  const usLocations = (trial.locations ?? []).filter(l => l.country === "United States");

  // Build unique taxonomy options from fetched physicians
  const taxonomyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const doc of physicians) {
      if (doc.taxonomyCode && doc.taxonomyDescription) {
        map.set(doc.taxonomyCode, doc.taxonomyDescription);
      }
    }
    return Array.from(map.entries()).map(([code, desc]) => ({ code, desc }));
  }, [physicians]);

  // Apply taxonomy filter
  const filteredPhysicians = useMemo(() => {
    if (taxonomyFilter === "all") return physicians;
    return physicians.filter(d => d.taxonomyCode === taxonomyFilter);
  }, [physicians, taxonomyFilter]);

  const handleFetchPhysicians = async () => {
    if (fetched) {
      setFetched(false);
      setPhysicians([]);
      setShowMap(false);
      setTaxonomyFilter("all");
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const usLocs: Array<{ city: string; state: string }> = [];
      const seen = new Set<string>();

      for (const loc of trial.locations ?? []) {
        const country = loc.country ?? "";
        const isNonUS = NON_US.some(c => country.includes(c));
        if (isNonUS) continue;
        const city = loc.city ?? "";
        const state = loc.state ?? "";
        if (!city || !state) continue;
        const key = `${city.toLowerCase()},${state.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          usLocs.push({ city, state });
        }
      }

      const condition = trial.conditions?.[0] ?? "";
      const locationsToQuery = usLocs.slice(0, 3);
      let results: Physician[] = [];

      if (locationsToQuery.length > 0) {
        const allResults = await Promise.all(
          locationsToQuery.map(({ city, state }) => fetchPhysicians(city, state, condition))
        );
        const npiSeen = new Set<string>();
        for (const batch of allResults) {
          for (const doc of batch) {
            if (!npiSeen.has(doc.npi)) {
              npiSeen.add(doc.npi);
              results.push(doc);
            }
          }
        }
      } else {
        results = await fetchPhysicians(undefined, undefined, condition);
      }

      setPhysicians(results);
      setFetched(true);
    } catch (err) {
      console.error("Failed to fetch physicians:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "white", borderRadius: "12px", border: "1px solid #e8eaed",
        marginBottom: "12px", overflow: "hidden", transition: "box-shadow 0.2s",
        fontFamily: "'DM Sans', sans-serif",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        .tc-btn { transition: all 0.15s; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .tc-btn:hover { opacity: 0.85; }
        .section-toggle { background: none; border: none; cursor: pointer; font-size: 12px; color: #6b7280; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 4px; padding: 0; }
        .section-toggle:hover { color: #1a56db; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Card Header — clickable to expand */}
      <div style={{ padding: "20px 24px 16px", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
              <StatusBadge status={trial.status} />
              {trial.phases && trial.phases.length > 0 && (
                <span style={{ fontSize: "11px", color: "#6b7280", background: "#f9fafb", border: "1px solid #e5e7eb", padding: "3px 8px", borderRadius: "100px", fontWeight: 500 }}>
                  {trial.phases.join(" · ")}
                </span>
              )}
              <span style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "monospace" }}>{trial.nctId}</span>
            </div>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", lineHeight: 1.4, margin: 0 }}>
              {trial.title}
            </h2>
          </div>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#9ca3af" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>

        {/* Collapsed preview */}
        {!expanded && (
          <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {trial.conditions && trial.conditions.length > 0 && (
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                <span style={{ color: "#9ca3af", marginRight: "4px" }}>Conditions:</span>
                {trial.conditions.slice(0, 2).join(", ")}
                {trial.conditions.length > 2 && ` +${trial.conditions.length - 2} more`}
              </span>
            )}
            {usLocations.length > 0 && (
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                <span style={{ color: "#9ca3af", marginRight: "4px" }}>📍</span>
                {usLocations.length} US location{usLocations.length !== 1 ? "s" : ""}
              </span>
            )}
            {trial.sponsor && (
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                <span style={{ color: "#9ca3af", marginRight: "4px" }}>Sponsor:</span>
                {trial.sponsor}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ borderTop: "1px solid #f3f4f6" }}>
          <div style={{ padding: "20px 24px" }}>

            {/* Meta */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginBottom: "16px" }}>
              {trial.conditions && trial.conditions.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Conditions</div>
                  <div style={{ fontSize: "13px", color: "#374151" }}>{trial.conditions.join(", ")}</div>
                </div>
              )}
              {trial.sponsor && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Sponsor</div>
                  <div style={{ fontSize: "13px", color: "#374151" }}>{trial.sponsor}</div>
                </div>
              )}
            </div>

            {trial.description && (
              <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.6, marginBottom: "16px" }}>
                {trial.description}
              </p>
            )}

            {/* Locations */}
            {usLocations.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                  US Locations ({usLocations.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {usLocations.slice(0, 6).map((loc, i) => (
                    <span key={i} style={{ fontSize: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: "6px", color: "#475569" }}>
                      📍 {[loc.city, loc.state].filter(Boolean).join(", ")}
                    </span>
                  ))}
                  {usLocations.length > 6 && (
                    <span style={{ fontSize: "12px", color: "#9ca3af", padding: "4px 8px" }}>
                      +{usLocations.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Eligibility criteria — collapsible */}
            {(trial.inclusionCriteria || trial.exclusionCriteria) && (
              <div style={{ marginBottom: "16px" }}>
                <button className="section-toggle" onClick={() => setShowCriteria(!showCriteria)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ transform: showCriteria ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  Eligibility criteria
                </button>
                {showCriteria && (
                  <div style={{ marginTop: "12px", display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" }}>
                    {trial.inclusionCriteria && (
                      <div style={{ background: "#f0fdf4", borderRadius: "8px", padding: "12px 14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "#15803d", marginBottom: "6px", textTransform: "uppercase" }}>Inclusion</div>
                        <p style={{ fontSize: "12px", color: "#374151", lineHeight: 1.5, whiteSpace: "pre-line" }}>{trial.inclusionCriteria}</p>
                      </div>
                    )}
                    {trial.exclusionCriteria && (
                      <div style={{ background: "#fff7ed", borderRadius: "8px", padding: "12px 14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "#c2410c", marginBottom: "6px", textTransform: "uppercase" }}>Exclusion</div>
                        <p style={{ fontSize: "12px", color: "#374151", lineHeight: 1.5, whiteSpace: "pre-line" }}>{trial.exclusionCriteria}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Point of Contact */}
            {trial.pointOfContact && (
              <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Point of Contact</div>
                <div style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>
                  {trial.pointOfContact.name}
                  {trial.pointOfContact.role && <span style={{ fontWeight: 400, color: "#6b7280" }}> · {trial.pointOfContact.role}</span>}
                </div>
                <div style={{ display: "flex", gap: "16px", marginTop: "4px", flexWrap: "wrap" }}>
                  {trial.pointOfContact.phone && (
                    <a href={`tel:${trial.pointOfContact.phone}`} style={{ fontSize: "12px", color: "#1a56db", textDecoration: "none" }}>
                      📞 {trial.pointOfContact.phone}
                    </a>
                  )}
                  {trial.pointOfContact.email && (
                    <a href={`mailto:${trial.pointOfContact.email}`} style={{ fontSize: "12px", color: "#1a56db", textDecoration: "none" }}>
                      ✉️ {trial.pointOfContact.email}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ padding: "0 24px 20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handleFetchPhysicians}
              disabled={loading}
              className="tc-btn"
              style={{
                background: fetched ? "#f8fafc" : "#1a56db",
                color: fetched ? "#374151" : "white",
                border: fetched ? "1.5px solid #e2e8f0" : "none",
                padding: "9px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Finding physicians...
                </>
              ) : fetched ? "Hide Physicians" : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Find Physicians
                </>
              )}
            </button>

            {fetched && !loading && (
              <button
                onClick={() => setShowMap(!showMap)}
                className="tc-btn"
                style={{
                  background: showMap ? "#eff6ff" : "white",
                  color: showMap ? "#1d4ed8" : "#374151",
                  border: `1.5px solid ${showMap ? "#bfdbfe" : "#e2e8f0"}`,
                  padding: "9px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                  <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                </svg>
                {showMap ? "Hide Map" : "View on Map"}
              </button>
            )}
          </div>

          {error && (
            <div style={{ margin: "0 24px 20px", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "13px", color: "#dc2626" }}>
              Failed to load physicians. Please try again.
            </div>
          )}

          {/* Map */}
          {fetched && showMap && (
            <div style={{ margin: "0 24px 20px" }}>
              <PhysicianTrialMap trial={trial} physicians={physicians} />
            </div>
          )}

          {/* Physicians list with taxonomy filter */}
          {fetched && !loading && (
            <div style={{ padding: "0 24px 20px" }}>

              {/* Header + taxonomy filter */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                  Physicians near trial locations
                  {trial.conditions?.[0] && (
                    <span style={{ fontWeight: 400, color: "#9ca3af" }}> · {trial.conditions[0]}</span>
                  )}
                  <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: "6px" }}>
                    ({filteredPhysicians.length}{taxonomyFilter !== "all" ? ` of ${physicians.length}` : ""})
                  </span>
                </div>

                {/* Taxonomy filter dropdown */}
                {taxonomyOptions.length > 1 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
                      Filter by specialty
                    </label>
                    <select
                      value={taxonomyFilter}
                      onChange={e => setTaxonomyFilter(e.target.value)}
                      style={{
                        border: "1.5px solid #e5e7eb", borderRadius: "7px",
                        padding: "6px 10px", fontSize: "12px",
                        fontFamily: "'DM Sans', sans-serif", color: "#374151",
                        background: "white", outline: "none", cursor: "pointer",
                        minWidth: "220px",
                      }}
                    >
                      <option value="all">All specialties</option>
                      {taxonomyOptions.map(({ code, desc }) => (
                        <option key={code} value={code}>
                          {code} · {desc}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {filteredPhysicians.length === 0 ? (
                <div style={{ fontSize: "13px", color: "#9ca3af", padding: "16px", background: "#f9fafb", borderRadius: "8px", textAlign: "center" }}>
                  {taxonomyFilter !== "all" ? "No physicians match this specialty filter." : "No physicians found for this trial's locations."}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
                  {filteredPhysicians.map(doctor => (
                    <PhysicianCard key={doctor.npi} doctor={doctor} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}