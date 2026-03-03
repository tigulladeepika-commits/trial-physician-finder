"use client";

import { useState, useMemo } from "react";
import { Trial, Physician } from "../types";
import { fetchPhysicians } from "../utils/api";
import PhysicianCard from "./PhysicianCard";
import dynamic from "next/dynamic";
const PhysicianTrialMap = dynamic(() => import("./PhysicianTrialMap"), { ssr: false });

type TrialCardProps = { trial: Trial };

const NON_US = [
  "Israel","Germany","India","Spain","Italy","Australia","Finland","Poland",
  "Netherlands","Sweden","United Kingdom","Canada","France","Taiwan","South Korea","Greece",
];

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; border: string }> = {
  "RECRUITING":               { bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e", border: "#bbf7d0" },
  "COMPLETED":                { bg: "#f8fafc", color: "#64748b", dot: "#94a3b8", border: "#e2e8f0" },
  "TERMINATED":               { bg: "#fff7ed", color: "#ea580c", dot: "#f97316", border: "#fed7aa" },
  "UNKNOWN":                  { bg: "#f9fafb", color: "#9ca3af", dot: "#d1d5db", border: "#e5e7eb" },
  "NOT YET RECRUITING":       { bg: "#eff6ff", color: "#2563eb", dot: "#60a5fa", border: "#bfdbfe" },
  "ACTIVE, NOT RECRUITING":   { bg: "#faf5ff", color: "#7c3aed", dot: "#a78bfa", border: "#ddd6fe" },
  "ACTIVE_NOT_RECRUITING":    { bg: "#faf5ff", color: "#7c3aed", dot: "#a78bfa", border: "#ddd6fe" },
  "NOT_YET_RECRUITING":       { bg: "#eff6ff", color: "#2563eb", dot: "#60a5fa", border: "#bfdbfe" },
};

function StatusBadge({ status }: { status: string }) {
  const key = status?.toUpperCase().replace(/_/g, " ");
  const s = STATUS_CONFIG[key] ?? STATUS_CONFIG["UNKNOWN"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: s.bg, color: s.color,
      border: "1px solid " + s.border,
      fontSize: "10px", fontWeight: 600, padding: "3px 9px",
      borderRadius: "100px", letterSpacing: "0.4px", textTransform: "uppercase",
      fontFamily: "'Inter', sans-serif",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  return (
    <span style={{
      fontSize: "10px", fontWeight: 600, color: "#6366f1",
      background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)",
      padding: "3px 9px", borderRadius: "100px",
      fontFamily: "'Inter', sans-serif",
    }}>
      {phase}
    </span>
  );
}

export default function TrialCard({ trial }: TrialCardProps) {
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [taxonomyFilter, setTaxonomyFilter] = useState("all");

  const usLocations = (trial.locations ?? []).filter(l => l.country === "United States");
  const LOCATIONS_PREVIEW = 8;
  const visibleLocations = showAllLocations ? usLocations : usLocations.slice(0, LOCATIONS_PREVIEW);

  const taxonomyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const doc of physicians) {
      if (doc.taxonomyCode && doc.taxonomyDescription) map.set(doc.taxonomyCode, doc.taxonomyDescription);
    }
    return Array.from(map.entries()).map(([code, desc]) => ({ code, desc }));
  }, [physicians]);

  const filteredPhysicians = useMemo(() => {
    if (taxonomyFilter === "all") return physicians;
    return physicians.filter(d => d.taxonomyCode === taxonomyFilter);
  }, [physicians, taxonomyFilter]);

  const handleFetchPhysicians = async () => {
    if (fetched) {
      setFetched(false); setPhysicians([]); setShowMap(false); setTaxonomyFilter("all");
      return;
    }
    setLoading(true); setFetchError(false);
    try {
      const usLocs: Array<{ city: string; state: string }> = [];
      const seen = new Set<string>();
      for (const loc of trial.locations ?? []) {
        if (NON_US.some(c => (loc.country ?? "").includes(c))) continue;
        const city = loc.city ?? ""; const state = loc.state ?? "";
        if (!city || !state) continue;
        const key = city.toLowerCase() + "," + state.toLowerCase();
        if (!seen.has(key)) { seen.add(key); usLocs.push({ city, state }); }
      }
      const condition = trial.conditions?.[0] ?? "";
      const locationsToQuery = usLocs.slice(0, 3);
      let results: Physician[] = [];
      if (locationsToQuery.length > 0) {
        const allResults = await Promise.all(locationsToQuery.map(({ city, state }) => fetchPhysicians(city, state, condition)));
        const npiSeen = new Set<string>();
        for (const batch of allResults) {
          for (const doc of batch) {
            if (!npiSeen.has(doc.npi)) { npiSeen.add(doc.npi); results.push(doc); }
          }
        }
      } else {
        results = await fetchPhysicians(undefined, undefined, condition);
      }
      setPhysicians(results); setFetched(true);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .tc { background:#fff; border:1.5px solid #e8edf5; border-radius:16px; overflow:hidden; font-family:'Inter',sans-serif; transition:border-color 0.2s,box-shadow 0.2s; }
        .tc:hover { border-color:rgba(99,102,241,0.22); box-shadow:0 4px 24px rgba(99,102,241,0.07); }
        .tc-hd { padding:18px 22px 14px; cursor:pointer; user-select:none; }
        .tc-hr { height:1px; background:#f1f5f9; }
        .tc-bd { padding:18px 22px; }
        .tc-sec {
          font-size:10px; font-weight:700; letter-spacing:1px;
          text-transform:uppercase; color:#6366f1;
          display:flex; align-items:center; gap:7px; margin-bottom:12px;
        }
        .tc-sec::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,rgba(99,102,241,0.15),transparent); }
        .ml { font-size:10px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:#94a3b8; margin-bottom:4px; }
        .mv { font-size:13px; color:#334155; }
        .loc-chip { display:inline-flex; align-items:center; gap:3px; font-size:12px; background:#f8faff; border:1px solid #dde5f5; padding:4px 10px; border-radius:7px; color:#475569; font-family:'Inter',sans-serif; }
        .crit-btn { display:flex; align-items:center; gap:6px; background:none; border:none; cursor:pointer; font-size:12px; font-weight:500; color:#94a3b8; font-family:'Inter',sans-serif; padding:0; transition:color 0.15s; }
        .crit-btn:hover { color:#6366f1; }
        .poc-box { background:#f8faff; border:1px solid #dde5f5; border-radius:11px; padding:13px 15px; }
        .tc-actions { padding:0 22px 18px; display:flex; gap:9px; flex-wrap:wrap; }
        .btn-find { background:linear-gradient(135deg,#6366f1,#38bdf8); color:#fff; border:none; padding:9px 18px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; display:flex; align-items:center; gap:6px; transition:opacity 0.18s; box-shadow:0 2px 8px rgba(99,102,241,0.18); }
        .btn-find:hover { opacity:0.87; }
        .btn-find:disabled { opacity:0.5; cursor:not-allowed; }
        .btn-sec { background:#fff; color:#475569; border:1.5px solid #e2e8f0; padding:9px 16px; border-radius:8px; font-size:12px; font-weight:500; cursor:pointer; font-family:'Inter',sans-serif; display:flex; align-items:center; gap:6px; transition:border-color 0.18s,color 0.18s; }
        .btn-sec:hover { border-color:rgba(99,102,241,0.3); color:#6366f1; }
        .btn-sec-active { background:rgba(99,102,241,0.07); color:#6366f1; border-color:rgba(99,102,241,0.25); }
        .show-all-btn { font-size:11px; font-weight:500; color:#6366f1; background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.15); padding:3px 10px; border-radius:6px; cursor:pointer; font-family:'Inter',sans-serif; transition:background 0.15s; white-space:nowrap; }
        .show-all-btn:hover { background:rgba(99,102,241,0.12); }
        .physicians-sec { padding:0 22px 22px; }
        .physicians-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:11px; flex-wrap:wrap; gap:8px; }
        .physicians-lbl { font-size:12px; font-weight:600; color:#334155; font-family:'Inter',sans-serif; }
        .tax-sel { background:#f8faff; border:1.5px solid #dde5f5; border-radius:8px; padding:6px 26px 6px 10px; font-size:12px; color:#334155; font-family:'Inter',sans-serif; outline:none; appearance:none; -webkit-appearance:none; cursor:pointer; min-width:190px; }
        .tax-sel option { background:#fff; }
        .no-phys { text-align:center; padding:22px; background:#f8faff; border:1px solid #dde5f5; border-radius:11px; font-size:13px; color:#94a3b8; font-family:'Inter',sans-serif; }
        .nct { font-size:11px; font-family:monospace; color:#94a3b8; }
        @keyframes tc-spin { to { transform:rotate(360deg); } }
        .tc-spin { animation:tc-spin 0.85s linear infinite; display:inline-block; }
      `}</style>

      <div className="tc">
        {/* Header */}
        <div className="tc-hd" onClick={() => setExpanded(!expanded)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "9px", flexWrap: "wrap" }}>
                <StatusBadge status={trial.status} />
                {trial.phases?.map(p => <PhaseBadge key={p} phase={p} />)}
                <span className="nct">{trial.nctId}</span>
              </div>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", lineHeight: 1.45, margin: 0 }}>
                {trial.title}
              </h2>
            </div>
            <div style={{ width: 26, height: 26, borderRadius: "7px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
                style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Collapsed preview */}
          {!expanded && (
            <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {trial.conditions?.length > 0 && (
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  <span style={{ color: "#c8d3e0", marginRight: "4px" }}>Conditions:</span>
                  {trial.conditions.slice(0, 2).join(", ")}
                  {trial.conditions.length > 2 && " +" + (trial.conditions.length - 2) + " more"}
                </span>
              )}
              {usLocations.length > 0 && (
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {"📍 " + usLocations.length + " US location" + (usLocations.length !== 1 ? "s" : "")}
                </span>
              )}
              {trial.sponsor && (
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  <span style={{ color: "#c8d3e0", marginRight: "4px" }}>Sponsor:</span>{trial.sponsor}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expanded */}
        {expanded && (
          <div>
            <div className="tc-hr" />
            <div className="tc-bd">

              {/* ── 1. TRIAL DETAILS ── */}
              <div className="tc-sec">Trial Details</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "22px", marginBottom: "14px" }}>
                {trial.conditions?.length > 0 && (
                  <div>
                    <div className="ml">Conditions</div>
                    <div className="mv">{trial.conditions.join(", ")}</div>
                  </div>
                )}
                {trial.sponsor && (
                  <div>
                    <div className="ml">Sponsor</div>
                    <div className="mv">{trial.sponsor}</div>
                  </div>
                )}
                {trial.phases?.length > 0 && (
                  <div>
                    <div className="ml">Phase</div>
                    <div className="mv">{trial.phases.join(", ")}</div>
                  </div>
                )}
                <div>
                  <div className="ml">Status</div>
                  <div className="mv">{trial.status?.replace(/_/g, " ")}</div>
                </div>
              </div>

              {trial.description && (
                <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.65, marginBottom: "16px" }}>
                  {trial.description}
                </p>
              )}

              {/* Eligibility */}
              {(trial.inclusionCriteria || trial.exclusionCriteria) && (
                <div style={{ marginBottom: "16px" }}>
                  <button className="crit-btn" onClick={e => { e.stopPropagation(); setShowCriteria(!showCriteria); }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ transform: showCriteria ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    Eligibility Criteria
                  </button>
                  {showCriteria && (
                    <div style={{ marginTop: "10px", display: "grid", gap: "9px", gridTemplateColumns: "1fr 1fr" }}>
                      {trial.inclusionCriteria && (
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "11px 13px" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", marginBottom: "5px", letterSpacing: "0.6px", textTransform: "uppercase" }}>Inclusion</div>
                          <p style={{ fontSize: "12px", color: "#334155", lineHeight: 1.55, whiteSpace: "pre-line" }}>{trial.inclusionCriteria}</p>
                        </div>
                      )}
                      {trial.exclusionCriteria && (
                        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "11px 13px" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "#ea580c", marginBottom: "5px", letterSpacing: "0.6px", textTransform: "uppercase" }}>Exclusion</div>
                          <p style={{ fontSize: "12px", color: "#334155", lineHeight: 1.55, whiteSpace: "pre-line" }}>{trial.exclusionCriteria}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Point of Contact */}
              {trial.pointOfContact && (
                <div className="poc-box" style={{ marginBottom: "16px" }}>
                  <div className="ml" style={{ marginBottom: "6px" }}>Point of Contact</div>
                  <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: 600 }}>
                    {trial.pointOfContact.name}
                    {trial.pointOfContact.role && (
                      <span style={{ fontWeight: 400, color: "#64748b" }}>{" · " + trial.pointOfContact.role}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "14px", marginTop: "5px", flexWrap: "wrap" }}>
                    {trial.pointOfContact.phone && (
                      <div style={{ fontSize: "12px", color: "#94a3b8", cursor: "pointer", transition: "color 0.15s" }}
                        onClick={() => window.open("tel:" + trial.pointOfContact!.phone)}
                        onMouseEnter={e => (e.currentTarget.style.color = "#6366f1")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
                        {"📞 " + trial.pointOfContact.phone}
                      </div>
                    )}
                    {trial.pointOfContact.email && (
                      <div style={{ fontSize: "12px", color: "#94a3b8", cursor: "pointer", transition: "color 0.15s" }}
                        onClick={() => window.open("mailto:" + trial.pointOfContact!.email)}
                        onMouseEnter={e => (e.currentTarget.style.color = "#6366f1")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
                        {"✉️ " + trial.pointOfContact.email}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── 2. US LOCATIONS — show ALL when expanded ── */}
              {usLocations.length > 0 && (
                <div style={{ marginBottom: "6px" }}>
                  <div className="tc-sec">{"US Locations (" + usLocations.length + ")"}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                    {visibleLocations.map((loc, i) => (
                      <span key={i} className="loc-chip">
                        {"📍 " + [loc.city, loc.state].filter(Boolean).join(", ")}
                        {loc.facility && loc.facility !== [loc.city, loc.state].filter(Boolean).join(", ") && (
                          <span style={{ color: "#94a3b8", fontSize: "10px", marginLeft: "3px" }}>· {loc.facility}</span>
                        )}
                      </span>
                    ))}
                    {usLocations.length > LOCATIONS_PREVIEW && (
                      <button className="show-all-btn" onClick={e => { e.stopPropagation(); setShowAllLocations(!showAllLocations); }}>
                        {showAllLocations
                          ? "Show less"
                          : "+" + (usLocations.length - LOCATIONS_PREVIEW) + " more"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="tc-actions">
              {!fetched ? (
                <button className="btn-find" onClick={handleFetchPhysicians} disabled={loading}>
                  {loading
                    ? <><span className="tc-spin">⟳</span> Finding physicians...</>
                    : <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Find Physicians
                      </>
                  }
                </button>
              ) : (
                <button className="btn-sec" onClick={handleFetchPhysicians}>Hide Physicians</button>
              )}
              {fetched && !loading && (
                <button className={"btn-sec" + (showMap ? " btn-sec-active" : "")} onClick={() => setShowMap(!showMap)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                    <line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
                  </svg>
                  {showMap ? "Hide Map" : "View on Map"}
                </button>
              )}
            </div>

            {fetchError && (
              <div style={{ margin: "0 22px 18px", padding: "11px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "9px", fontSize: "13px", color: "#dc2626", fontFamily: "'Inter',sans-serif" }}>
                Failed to load physicians. Please try again.
              </div>
            )}

            {fetched && showMap && (
              <div style={{ margin: "0 22px 18px" }}>
                <PhysicianTrialMap trial={trial} physicians={physicians} />
              </div>
            )}

            {fetched && !loading && (
              <div className="physicians-sec">
                <div className="physicians-hd">
                  <div className="physicians-lbl">
                    Physicians near trial locations
                    {trial.conditions?.[0] && <span style={{ fontWeight: 400, color: "#94a3b8" }}>{" · " + trial.conditions[0]}</span>}
                    <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: "4px" }}>
                      {"(" + filteredPhysicians.length + (taxonomyFilter !== "all" ? " of " + physicians.length : "") + ")"}
                    </span>
                  </div>
                  {taxonomyOptions.length > 1 && (
                    <div style={{ position: "relative" }}>
                      <select className="tax-sel" value={taxonomyFilter} onChange={e => setTaxonomyFilter(e.target.value)}>
                        <option value="all">All specialties</option>
                        {taxonomyOptions.map(({ code, desc }) => (
                          <option key={code} value={code}>{code + " · " + desc}</option>
                        ))}
                      </select>
                      <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", fontSize: "9px" }}>▼</span>
                    </div>
                  )}
                </div>
                {filteredPhysicians.length === 0 ? (
                  <div className="no-phys">
                    {taxonomyFilter !== "all" ? "No physicians match this specialty filter." : "No physicians found for this trial's locations."}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "9px" }}>
                    {filteredPhysicians.map(doc => <PhysicianCard key={doc.npi} doctor={doc} />)}
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