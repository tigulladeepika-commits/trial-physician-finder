"use client";

import { useState, useMemo } from "react";
import { Trial, Physician } from "../types";
import { fetchPhysicians } from "../utils/api";
import PhysicianCard from "./PhysicianCard";
import { TrialSaveButton } from "./SaveButton";   // ← NEW
import dynamic from "next/dynamic";
const PhysicianTrialMap = dynamic(() => import("./PhysicianTrialMap"), { ssr: false });

// FIX 3: Accept searchCity + searchState so physician fetch and map circle
// are centered on what the user actually searched, not random trial sites.
type TrialCardProps = {
  trial: Trial;
  searchCity?: string;
  searchState?: string;
  searchCondition?: string;
  searchFilters?: Record<string, string>;
  onPhysiciansLoaded?: (nctId: string, physicians: Physician[]) => void;
};

const NON_US = ["Israel","Germany","India","Spain","Italy","Australia","Finland","Poland","Netherlands","Sweden","United Kingdom","Canada","France","Taiwan","South Korea","Greece"];

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; border: string }> = {
  "RECRUITING":             { bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e", border: "#bbf7d0" },
  "COMPLETED":              { bg: "#f8fafc", color: "#64748b", dot: "#94a3b8", border: "#e2e8f0" },
  "TERMINATED":             { bg: "#fff7ed", color: "#ea580c", dot: "#f97316", border: "#fed7aa" },
  "UNKNOWN":                { bg: "#f9fafb", color: "#9ca3af", dot: "#d1d5db", border: "#e5e7eb" },
  "NOT YET RECRUITING":     { bg: "#eff6ff", color: "#2563eb", dot: "#60a5fa", border: "#bfdbfe" },
  "ACTIVE, NOT RECRUITING": { bg: "#faf5ff", color: "#7c3aed", dot: "#a78bfa", border: "#ddd6fe" },
  "ACTIVE_NOT_RECRUITING":  { bg: "#faf5ff", color: "#7c3aed", dot: "#a78bfa", border: "#ddd6fe" },
  "NOT_YET_RECRUITING":     { bg: "#eff6ff", color: "#2563eb", dot: "#60a5fa", border: "#bfdbfe" },
};

function copyToClipboard(text: string, btn: HTMLButtonElement) {
  navigator.clipboard.writeText(text).then(() => {
    const prev = btn.textContent;
    btn.textContent = "✓";
    btn.style.color = "#10b981";
    setTimeout(() => { btn.textContent = prev; btn.style.color = ""; }, 1400);
  });
}

function StatusBadge({ status }: { status: string }) {
  const key = status?.toUpperCase().replace(/_/g, " ");
  const s = STATUS_CONFIG[key] ?? STATUS_CONFIG["UNKNOWN"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: "10px", fontWeight: 600, padding: "3px 9px", borderRadius: "100px", letterSpacing: "0.4px", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", userSelect: "none" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  return (
    <span style={{ fontSize: "10px", fontWeight: 600, color: "#6366f1", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", padding: "3px 9px", borderRadius: "100px", fontFamily: "'Inter', sans-serif", userSelect: "none" }}>
      {phase}
    </span>
  );
}

export default function TrialCard({ trial, searchCity, searchState, searchCondition, searchFilters, onPhysiciansLoaded }: TrialCardProps) {
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [taxonomyFilter, setTaxonomyFilter] = useState("all");
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [specialtyOpen, setSpecialtyOpen] = useState(false);

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
      const condition = trial.conditions?.[0] ?? "";
      let results: Physician[] = [];

      // FIX 3: Physician fetch location priority:
      // 1. Use searchCity/searchState if the user searched a specific location
      //    → shows physicians near where the user actually is
      // 2. Fall back to trial site locations if no search location given
      //    → original behavior for trials without a location filter
      if (searchCity || searchState) {
        results = await fetchPhysicians(searchCity || undefined, searchState || undefined, condition);
      } else {
        // Original behavior: query up to 3 unique US trial site locations
        const usLocs: Array<{ city: string; state: string }> = [];
        const seen = new Set<string>();
        for (const loc of trial.locations ?? []) {
          if (NON_US.some(c => (loc.country ?? "").includes(c))) continue;
          const city = loc.city ?? ""; const state = loc.state ?? "";
          if (!city || !state) continue;
          const key = city.toLowerCase() + "," + state.toLowerCase();
          if (!seen.has(key)) { seen.add(key); usLocs.push({ city, state }); }
        }
        const locationsToQuery = usLocs.slice(0, 3);
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
      }

      setPhysicians(results);
      setFetched(true);
      // Notify parent so physiciansMap stays in sync for ResultsSaveButton
      onPhysiciansLoaded?.(trial.nctId, results);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tc">
      <div className="tc-hd" onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "9px", flexWrap: "wrap" }}>
              <StatusBadge status={trial.status} />
              {trial.phases?.map(p => <PhaseBadge key={p} phase={p} />)}
              <span className="nct" style={{ display: "inline-flex", alignItems: "center", gap: "3px" }} onClick={e => e.stopPropagation()}>
                {trial.nctId}
                <button className="contact-copy-btn" title="Copy NCT ID" onClick={e => { e.stopPropagation(); copyToClipboard(trial.nctId, e.currentTarget); }}>⎘</button>
              </span>
            </div>
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", lineHeight: 1.45, margin: 0, userSelect: "text" }} onClick={e => e.stopPropagation()}>
              {trial.title}
            </h2>
          </div>
          <div className="tc-toggle-btn" style={{ width: 26, height: 26, borderRadius: "7px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {!expanded && (
          <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "12px", userSelect: "text" }} onClick={e => e.stopPropagation()}>
            {trial.conditions?.length > 0 && (
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                <span style={{ color: "#c8d3e0", marginRight: "4px" }}>Conditions:</span>
                {trial.conditions.slice(0, 2).join(", ")}
                {trial.conditions.length > 2 && ` +${trial.conditions.length - 2} more`}
              </span>
            )}
            {usLocations.length > 0 && (
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>📍 {usLocations.length} US location{usLocations.length !== 1 ? "s" : ""}</span>
            )}
            {trial.sponsor && (
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                <span style={{ color: "#c8d3e0", marginRight: "4px" }}>Sponsor:</span>{trial.sponsor}
              </span>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div>
          <div className="tc-hr" />
          <div className="tc-bd">
            <div className="tc-sec">Trial Details</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "22px", marginBottom: "14px" }}>
              {trial.conditions?.length > 0 && (
                <div><div className="ml">Conditions</div><div className="mv">{trial.conditions.join(", ")}</div></div>
              )}
              {trial.sponsor && (
                <div>
                  <div className="ml">Sponsor</div>
                  <div className="mv" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {trial.sponsor}
                    <button className="contact-copy-btn" title="Copy sponsor" onClick={e => copyToClipboard(trial.sponsor!, e.currentTarget)}>⎘</button>
                  </div>
                </div>
              )}
              {trial.phases?.length > 0 && (
                <div><div className="ml">Phase</div><div className="mv">{trial.phases.join(", ")}</div></div>
              )}
              <div><div className="ml">Status</div><div className="mv">{trial.status?.replace(/_/g, " ")}</div></div>
              {trial.nctId && (
                <div>
                  <div className="ml">NCT ID</div>
                  <div className="mv" style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "monospace" }}>
                    {trial.nctId}
                    <button className="contact-copy-btn" title="Copy NCT ID" onClick={e => copyToClipboard(trial.nctId, e.currentTarget)}>⎘</button>
                  </div>
                </div>
              )}
            </div>

            {trial.description && (
              <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.65, marginBottom: "16px", userSelect: "text" }}>
                {trial.description}
              </p>
            )}

            {(trial.inclusionCriteria || trial.exclusionCriteria) && (
              <div style={{ marginBottom: "16px" }}>
                <button className="crit-btn" onClick={e => { e.stopPropagation(); setShowCriteria(!showCriteria); }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: showCriteria ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Eligibility Criteria
                </button>
                {showCriteria && (
                  <div style={{ marginTop: "10px", display: "grid", gap: "9px", gridTemplateColumns: "1fr 1fr" }}>
                    {trial.inclusionCriteria && (
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "11px 13px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", marginBottom: "5px", letterSpacing: "0.6px", textTransform: "uppercase" }}>Inclusion</div>
                        <p style={{ fontSize: "12px", color: "#334155", lineHeight: 1.55, whiteSpace: "pre-line", userSelect: "text" }}>{trial.inclusionCriteria}</p>
                      </div>
                    )}
                    {trial.exclusionCriteria && (
                      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "11px 13px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#ea580c", marginBottom: "5px", letterSpacing: "0.6px", textTransform: "uppercase" }}>Exclusion</div>
                        <p style={{ fontSize: "12px", color: "#334155", lineHeight: 1.55, whiteSpace: "pre-line", userSelect: "text" }}>{trial.exclusionCriteria}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {trial.pointOfContact && (
              <div className="poc-box" style={{ marginBottom: "16px" }}>
                <div className="ml" style={{ marginBottom: "6px" }}>Point of Contact</div>
                <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: 600, userSelect: "text" }}>
                  {trial.pointOfContact.name}
                  {trial.pointOfContact.role && <span style={{ fontWeight: 400, color: "#64748b" }}>{" · " + trial.pointOfContact.role}</span>}
                </div>
                <div style={{ display: "flex", gap: "14px", marginTop: "5px", flexWrap: "wrap" }}>
                  {trial.pointOfContact.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      <span className="contact-field" style={{ fontSize: "12px", color: "#94a3b8" }}>📞 {trial.pointOfContact.phone}</span>
                      <button className="contact-copy-btn" title="Copy phone" onClick={e => copyToClipboard(trial.pointOfContact!.phone!, e.currentTarget)}>⎘</button>
                      <button className="contact-copy-btn" title="Dial" style={{ fontSize: "10px" }} onClick={() => window.open("tel:" + trial.pointOfContact!.phone)}>↗</button>
                    </div>
                  )}
                  {trial.pointOfContact.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      <span className="contact-field" style={{ fontSize: "12px", color: "#94a3b8" }}>✉️ {trial.pointOfContact.email}</span>
                      <button className="contact-copy-btn" title="Copy email" onClick={e => copyToClipboard(trial.pointOfContact!.email!, e.currentTarget)}>⎘</button>
                      <button className="contact-copy-btn" title="Send email" style={{ fontSize: "10px" }} onClick={() => window.open("mailto:" + trial.pointOfContact!.email)}>↗</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {usLocations.length > 0 && (
              <div style={{ marginBottom: "6px" }}>
                <div className="tc-sec">US Locations ({usLocations.length})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                  {visibleLocations.map((loc, i) => (
                    <span key={i} className="loc-chip">
                      📍 {[loc.city, loc.state].filter(Boolean).join(", ")}
                      {loc.facility && loc.facility !== [loc.city, loc.state].filter(Boolean).join(", ") && (
                        <span style={{ color: "#94a3b8", fontSize: "10px", marginLeft: "3px" }}>· {loc.facility}</span>
                      )}
                    </span>
                  ))}
                  {usLocations.length > LOCATIONS_PREVIEW && (
                    <button className="show-all-btn" onClick={e => { e.stopPropagation(); setShowAllLocations(!showAllLocations); }}>
                      {showAllLocations ? "Show less" : `+${usLocations.length - LOCATIONS_PREVIEW} more`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="tc-actions">
            {!fetched ? (
              <button className="btn-find" onClick={handleFetchPhysicians} disabled={loading}>
                {loading ? <><span className="tc-spin">⟳</span> Finding physicians...</> : <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Find Physicians{searchCity || searchState ? ` near ${[searchCity, searchState].filter(Boolean).join(", ")}` : ""}
                </>}
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
            {/* NEW: Save button — always visible once trial is expanded */}
            <TrialSaveButton
              trial={trial}
              physicians={physicians}
              searchCondition={searchCondition || ""}
              searchFilters={searchFilters || {}}
            />
          </div>

          {fetchError && (
            <div style={{ margin: "0 22px 18px", padding: "11px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "9px", fontSize: "13px", color: "#dc2626", fontFamily: "'Inter',sans-serif" }}>
              Failed to load physicians. Please try again.
            </div>
          )}

          {fetched && showMap && (
            <div style={{ margin: "0 22px 18px" }}>
              {/* FIX: Pass search location to map so circle centers correctly */}
              <PhysicianTrialMap
                trial={trial}
                physicians={physicians}
                searchCity={searchCity}
                searchState={searchState}
              />
            </div>
          )}

          {fetched && !loading && (
            <div className="physicians-sec">
              <div className="physicians-hd">
                <div className="physicians-lbl">
                  Physicians near {searchCity || searchState
                    ? [searchCity, searchState].filter(Boolean).join(", ")
                    : "trial locations"}
                  {trial.conditions?.[0] && <span style={{ fontWeight: 400, color: "#94a3b8" }}>{" · " + trial.conditions[0]}</span>}
                  <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: "4px" }}>
                    ({filteredPhysicians.length}{taxonomyFilter !== "all" ? ` of ${physicians.length}` : ""})
                  </span>
                </div>
                {taxonomyOptions.length > 1 && (
                  <div style={{ position: "relative" }}>
                    {/* ── Searchable specialty dropdown ── */}
                    <div
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        border: "1.5px solid", borderColor: specialtyOpen ? "#6366f1" : "#e2e8f0",
                        borderRadius: "8px", padding: "5px 10px",
                        background: "#fff", cursor: "pointer", minWidth: "220px",
                        fontSize: "12px", color: "#0f172a",
                        transition: "border-color 0.15s",
                      }}
                      onClick={() => { setSpecialtyOpen(o => !o); setSpecialtySearch(""); }}
                    >
                      <span style={{ flex: 1, color: taxonomyFilter === "all" ? "#94a3b8" : "#0f172a" }}>
                        {taxonomyFilter === "all"
                          ? "All specialties"
                          : taxonomyOptions.find(o => o.code === taxonomyFilter)?.desc || taxonomyFilter}
                      </span>
                      {taxonomyFilter !== "all" && (
                        <span
                          onClick={e => { e.stopPropagation(); setTaxonomyFilter("all"); setSpecialtyOpen(false); }}
                          style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1, cursor: "pointer" }}
                        >×</span>
                      )}
                      <span style={{ color: "#94a3b8", fontSize: "9px", transform: specialtyOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▼</span>
                    </div>

                    {/* Dropdown panel */}
                    {specialtyOpen && (
                      <div
                        style={{
                          position: "absolute", right: 0, top: "calc(100% + 4px)",
                          background: "#fff", border: "1.5px solid #e2e8f0",
                          borderRadius: "10px", zIndex: 50, minWidth: "260px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                          overflow: "hidden",
                        }}
                      >
                        {/* Search input */}
                        <div style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>
                          <input
                            autoFocus
                            value={specialtySearch}
                            onChange={e => setSpecialtySearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            placeholder="Type to search specialty..."
                            style={{
                              width: "100%", border: "1.5px solid #e2e8f0",
                              borderRadius: "6px", padding: "5px 9px",
                              fontSize: "12px", outline: "none",
                              fontFamily: "'Inter', sans-serif", color: "#0f172a",
                              boxSizing: "border-box",
                            }}
                            onFocus={e => e.target.style.borderColor = "#6366f1"}
                            onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                          />
                        </div>

                        {/* Options list */}
                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                          {/* All specialties option */}
                          <div
                            onClick={() => { setTaxonomyFilter("all"); setSpecialtyOpen(false); }}
                            style={{
                              padding: "8px 12px", fontSize: "12px", cursor: "pointer",
                              background: taxonomyFilter === "all" ? "rgba(99,102,241,0.07)" : "#fff",
                              color: taxonomyFilter === "all" ? "#6366f1" : "#64748b",
                              fontWeight: taxonomyFilter === "all" ? 600 : 400,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.05)")}
                            onMouseLeave={e => (e.currentTarget.style.background = taxonomyFilter === "all" ? "rgba(99,102,241,0.07)" : "#fff")}
                          >
                            All specialties
                          </div>

                          {/* Filtered options */}
                          {taxonomyOptions
                            .filter(({ code, desc }) =>
                              !specialtySearch ||
                              desc.toLowerCase().includes(specialtySearch.toLowerCase()) ||
                              code.toLowerCase().includes(specialtySearch.toLowerCase())
                            )
                            .map(({ code, desc }) => (
                              <div
                                key={code}
                                onClick={() => { setTaxonomyFilter(code); setSpecialtyOpen(false); setSpecialtySearch(""); }}
                                style={{
                                  padding: "8px 12px", fontSize: "12px", cursor: "pointer",
                                  background: taxonomyFilter === code ? "rgba(99,102,241,0.07)" : "#fff",
                                  color: taxonomyFilter === code ? "#6366f1" : "#0f172a",
                                  fontWeight: taxonomyFilter === code ? 600 : 400,
                                  borderTop: "1px solid #f8fafc",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.05)")}
                                onMouseLeave={e => (e.currentTarget.style.background = taxonomyFilter === code ? "rgba(99,102,241,0.07)" : "#fff")}
                              >
                                <span style={{ color: "#6366f1", fontFamily: "monospace", fontSize: "10px", marginRight: "6px" }}>{code}</span>
                                {desc}
                              </div>
                            ))
                          }

                          {/* No results */}
                          {specialtySearch && taxonomyOptions.filter(({ code, desc }) =>
                            desc.toLowerCase().includes(specialtySearch.toLowerCase()) ||
                            code.toLowerCase().includes(specialtySearch.toLowerCase())
                          ).length === 0 && (
                            <div style={{ padding: "10px 12px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
                              No specialties match "{specialtySearch}"
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Click outside to close */}
                    {specialtyOpen && (
                      <div
                        style={{ position: "fixed", inset: 0, zIndex: 49 }}
                        onClick={() => { setSpecialtyOpen(false); setSpecialtySearch(""); }}
                      />
                    )}
                  </div>
                )}
              </div>
              {filteredPhysicians.length === 0 ? (
                <div className="no-phys">
                  {taxonomyFilter !== "all" ? `No physicians match "${taxonomyOptions.find(o => o.code === taxonomyFilter)?.desc || taxonomyFilter}".` : "No physicians found for this trial's locations."}
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
  );
}