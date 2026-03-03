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

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; border: string }> = {
  RECRUITING:               { bg: "rgba(52,211,153,0.1)",  color: "#34d399", dot: "#34d399", border: "rgba(52,211,153,0.25)" },
  COMPLETED:                { bg: "rgba(100,116,139,0.1)", color: "#94a3b8", dot: "#64748b", border: "rgba(100,116,139,0.2)" },
  TERMINATED:               { bg: "rgba(251,146,60,0.1)",  color: "#fb923c", dot: "#fb923c", border: "rgba(251,146,60,0.25)" },
  UNKNOWN:                  { bg: "rgba(100,116,139,0.08)",color: "#64748b", dot: "#475569", border: "rgba(100,116,139,0.15)" },
  "NOT YET RECRUITING":     { bg: "rgba(56,189,248,0.1)",  color: "#38bdf8", dot: "#38bdf8", border: "rgba(56,189,248,0.25)" },
  "ACTIVE, NOT RECRUITING": { bg: "rgba(129,140,248,0.1)", color: "#818cf8", dot: "#818cf8", border: "rgba(129,140,248,0.25)" },
  "ACTIVE_NOT_RECRUITING":  { bg: "rgba(129,140,248,0.1)", color: "#818cf8", dot: "#818cf8", border: "rgba(129,140,248,0.25)" },
  "NOT_YET_RECRUITING":     { bg: "rgba(56,189,248,0.1)",  color: "#38bdf8", dot: "#38bdf8", border: "rgba(56,189,248,0.25)" },
};

function StatusBadge({ status }: { status: string }) {
  const key = status?.toUpperCase().replace(/_/g, " ");
  const s = STATUS_CONFIG[key] ?? STATUS_CONFIG["UNKNOWN"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: s.bg, color: s.color,
      border: "1px solid " + s.border,
      fontSize: "10px", fontWeight: 700, padding: "3px 9px",
      borderRadius: "100px", letterSpacing: "0.6px", textTransform: "uppercase",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  return (
    <span style={{
      fontSize: "10px", fontWeight: 600, color: "#818cf8",
      background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
      padding: "3px 9px", borderRadius: "100px", letterSpacing: "0.4px",
    }}>
      {phase}
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

  const taxonomyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const doc of physicians) {
      if (doc.taxonomyCode && doc.taxonomyDescription) {
        map.set(doc.taxonomyCode, doc.taxonomyDescription);
      }
    }
    return Array.from(map.entries()).map(([code, desc]) => ({ code, desc }));
  }, [physicians]);

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
        if (NON_US.some(c => country.includes(c))) continue;
        const city = loc.city ?? "";
        const state = loc.state ?? "";
        if (!city || !state) continue;
        const key = city.toLowerCase() + "," + state.toLowerCase();
        if (!seen.has(key)) { seen.add(key); usLocs.push({ city, state }); }
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
            if (!npiSeen.has(doc.npi)) { npiSeen.add(doc.npi); results.push(doc); }
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
    <>
      <style>{`
        .trial-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .trial-card:hover {
          border-color: rgba(56,189,248,0.2);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .card-header {
          padding: 20px 24px 16px;
          cursor: pointer;
          user-select: none;
        }
        .card-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .card-body { padding: 20px 24px; }
        .meta-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 5px;
        }
        .meta-value {
          font-size: 13px;
          color: #cbd5e1;
        }
        .loc-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          padding: 4px 11px;
          border-radius: 8px;
          color: #94a3b8;
        }
        .criteria-toggle {
          display: flex;
          align-items: center;
          gap: 7px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
          transition: color 0.15s;
          letter-spacing: 0.2px;
        }
        .criteria-toggle:hover { color: #94a3b8; }
        .poc-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 14px 16px;
        }
        .action-bar {
          padding: 0 24px 20px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn-find {
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          color: #fff;
          border: none;
          padding: 9px 18px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.2s;
          letter-spacing: 0.2px;
        }
        .btn-find:hover { opacity: 0.85; }
        .btn-find:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-hide {
          background: rgba(255,255,255,0.06);
          color: #94a3b8;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 9px 18px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.2s;
        }
        .btn-hide:hover { background: rgba(255,255,255,0.1); }
        .btn-map {
          background: rgba(99,102,241,0.1);
          color: #818cf8;
          border: 1px solid rgba(99,102,241,0.2);
          padding: 9px 18px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s;
        }
        .btn-map:hover { background: rgba(99,102,241,0.18); }
        .nct-id {
          font-size: 11px;
          font-family: monospace;
          color: #475569;
          letter-spacing: 0.5px;
        }
        .physicians-section { padding: 0 24px 24px; }
        .physicians-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .physicians-title {
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.3px;
        }
        .taxonomy-select {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 6px 28px 6px 10px;
          font-size: 12px;
          color: "#e2e8f0";
          font-family: 'DM Sans', sans-serif;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          min-width: 200px;
        }
        .taxonomy-select option { background: #1e293b; }
        .no-physicians {
          text-align: center;
          padding: 24px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          font-size: 13px;
          color: #475569;
        }
        @keyframes spin-card { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin-card 0.9s linear infinite; display: inline-block; }
      `}</style>

      <div className="trial-card">
        {/* Header */}
        <div className="card-header" onClick={() => setExpanded(!expanded)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px", flexWrap: "wrap" }}>
                <StatusBadge status={trial.status} />
                {trial.phases?.map((p) => <PhaseBadge key={p} phase={p} />)}
                <span className="nct-id">{trial.nctId}</span>
              </div>
              <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#f1f5f9", lineHeight: 1.45, margin: 0 }}>
                {trial.title}
              </h2>
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.2s",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"
                style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Collapsed preview */}
          {!expanded && (
            <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "14px" }}>
              {trial.conditions && trial.conditions.length > 0 && (
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  <span style={{ color: "#475569", marginRight: "4px" }}>Conditions:</span>
                  <span style={{ color: "#94a3b8" }}>
                    {trial.conditions.slice(0, 2).join(", ")}
                    {trial.conditions.length > 2 && " +" + (trial.conditions.length - 2) + " more"}
                  </span>
                </span>
              )}
              {usLocations.length > 0 && (
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  {"📍 " + usLocations.length + " US location" + (usLocations.length !== 1 ? "s" : "")}
                </span>
              )}
              {trial.sponsor && (
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  <span style={{ color: "#475569", marginRight: "4px" }}>Sponsor:</span>
                  <span style={{ color: "#94a3b8" }}>{trial.sponsor}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expanded */}
        {expanded && (
          <div>
            <div className="card-divider" />
            <div className="card-body">

              {/* Meta grid */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginBottom: "18px" }}>
                {trial.conditions && trial.conditions.length > 0 && (
                  <div>
                    <div className="meta-label">Conditions</div>
                    <div className="meta-value">{trial.conditions.join(", ")}</div>
                  </div>
                )}
                {trial.sponsor && (
                  <div>
                    <div className="meta-label">Sponsor</div>
                    <div className="meta-value">{trial.sponsor}</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {trial.description && (
                <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.65, marginBottom: "18px" }}>
                  {trial.description}
                </p>
              )}

              {/* US Locations */}
              {usLocations.length > 0 && (
                <div style={{ marginBottom: "18px" }}>
                  <div className="meta-label" style={{ marginBottom: "8px" }}>
                    {"US Locations (" + usLocations.length + ")"}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {usLocations.slice(0, 6).map((loc, i) => (
                      <span key={i} className="loc-chip">
                        {"📍 " + [loc.city, loc.state].filter(Boolean).join(", ")}
                      </span>
                    ))}
                    {usLocations.length > 6 && (
                      <span style={{ fontSize: "12px", color: "#475569", padding: "4px 8px" }}>
                        {"+" + (usLocations.length - 6) + " more"}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Eligibility criteria */}
              {(trial.inclusionCriteria || trial.exclusionCriteria) && (
                <div style={{ marginBottom: "18px" }}>
                  <button className="criteria-toggle" onClick={() => setShowCriteria(!showCriteria)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ transform: showCriteria ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    Eligibility Criteria
                  </button>
                  {showCriteria && (
                    <div style={{ marginTop: "12px", display: "grid", gap: "10px", gridTemplateColumns: "1fr 1fr" }}>
                      {trial.inclusionCriteria && (
                        <div style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: "10px", padding: "12px 14px" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "#34d399", marginBottom: "6px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Inclusion</div>
                          <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.55, whiteSpace: "pre-line" }}>{trial.inclusionCriteria}</p>
                        </div>
                      )}
                      {trial.exclusionCriteria && (
                        <div style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.15)", borderRadius: "10px", padding: "12px 14px" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "#fb923c", marginBottom: "6px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Exclusion</div>
                          <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.55, whiteSpace: "pre-line" }}>{trial.exclusionCriteria}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Point of Contact */}
              {trial.pointOfContact && (
                <div className="poc-box">
                  <div className="meta-label" style={{ marginBottom: "8px" }}>Point of Contact</div>
                  <div style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 500 }}>
                    {trial.pointOfContact.name}
                    {trial.pointOfContact.role && (
                      <span style={{ fontWeight: 400, color: "#64748b" }}>{" · " + trial.pointOfContact.role}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "16px", marginTop: "6px", flexWrap: "wrap" }}>
                    {trial.pointOfContact.phone && (
                      <div
                        style={{ fontSize: "12px", color: "#64748b", cursor: "pointer", transition: "color 0.15s" }}
                        onClick={() => window.open("tel:" + trial.pointOfContact!.phone)}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#38bdf8")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                      >
                        {"📞 " + trial.pointOfContact.phone}
                      </div>
                    )}
                    {trial.pointOfContact.email && (
                      <div
                        style={{ fontSize: "12px", color: "#64748b", cursor: "pointer", transition: "color 0.15s" }}
                        onClick={() => window.open("mailto:" + trial.pointOfContact!.email)}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#38bdf8")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                      >
                        {"✉️ " + trial.pointOfContact.email}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="action-bar">
              {!fetched ? (
                <button className="btn-find" onClick={handleFetchPhysicians} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spin-icon">⟳</span>
                      Finding physicians...
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      Find Physicians
                    </>
                  )}
                </button>
              ) : (
                <button className="btn-hide" onClick={handleFetchPhysicians}>
                  Hide Physicians
                </button>
              )}

              {fetched && !loading && (
                <button className="btn-map" onClick={() => setShowMap(!showMap)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                    <line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
                  </svg>
                  {showMap ? "Hide Map" : "View on Map"}
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{ margin: "0 24px 20px", padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", fontSize: "13px", color: "#fca5a5" }}>
                Failed to load physicians. Please try again.
              </div>
            )}

            {/* Map */}
            {fetched && showMap && (
              <div style={{ margin: "0 24px 20px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                <PhysicianTrialMap trial={trial} physicians={physicians} />
              </div>
            )}

            {/* Physicians list */}
            {fetched && !loading && (
              <div className="physicians-section">
                <div className="physicians-header">
                  <div className="physicians-title">
                    {"Physicians near trial locations"}
                    {trial.conditions?.[0] && (
                      <span style={{ fontWeight: 400, color: "#475569" }}>{" · " + trial.conditions[0]}</span>
                    )}
                    <span style={{ fontWeight: 400, color: "#475569", marginLeft: "6px" }}>
                      {"(" + filteredPhysicians.length + (taxonomyFilter !== "all" ? " of " + physicians.length : "") + ")"}
                    </span>
                  </div>

                  {taxonomyOptions.length > 1 && (
                    <div style={{ position: "relative" }}>
                      <select
                        className="taxonomy-select"
                        value={taxonomyFilter}
                        onChange={e => setTaxonomyFilter(e.target.value)}
                        style={{ color: "#e2e8f0" }}
                      >
                        <option value="all">All specialties</option>
                        {taxonomyOptions.map(({ code, desc }) => (
                          <option key={code} value={code}>{code + " · " + desc}</option>
                        ))}
                      </select>
                      <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none", fontSize: "10px" }}>▼</span>
                    </div>
                  )}
                </div>

                {filteredPhysicians.length === 0 ? (
                  <div className="no-physicians">
                    {taxonomyFilter !== "all"
                      ? "No physicians match this specialty filter."
                      : "No physicians found for this trial's locations."}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
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
    </>
  );
}