"use client";

import { useState, useCallback } from "react";
import PhysicianFilters from "./components/PhysicianFilters";
import TrialCard from "./components/TrialCard";
import { ResultsSaveButton } from "./components/SaveButton";   // ← NEW
import { Trial, Physician } from "./types";
import { useTrials } from "./hooks/useTrials";

export default function Home() {
  const [condition, setCondition] = useState<string | null>(null);
  const [city, setCity]           = useState<string | null>(null);
  const [state, setState]         = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string | undefined>(undefined);
  const [status, setStatus]       = useState<string | undefined>(undefined);
  const [phase, setPhase]         = useState<string | undefined>(undefined);

  // ── NEW: track physicians loaded per trial ───────────────────────────────
  // This map is populated by TrialCard whenever the user clicks "Find Physicians".
  // It's lifted up here so ResultsSaveButton can see all loaded physicians
  // across every card on the page.
  // Key: nctId  Value: array of physicians
  const [physiciansMap, setPhysiciansMap] = useState<Record<string, Physician[]>>({});

  const onPhysiciansLoaded = useCallback((nctId: string, physicians: Physician[]) => {
    setPhysiciansMap(prev => ({ ...prev, [nctId]: physicians }));
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const { trials, loading, totalCount, error, refetch, hasMore, loadMore, hasAnyFilter } = useTrials(
    condition, city, state, specialty, status, phase
  );

  const handleFilterChange = (filters: {
    condition: string; city: string; state: string;
    specialty: string; status: string; phase: string;
  }) => {
    setCondition(filters.condition || null);
    setCity(filters.city || null);
    setState(filters.state || null);
    setSpecialty(filters.specialty || undefined);
    setStatus(filters.status || undefined);
    setPhase(filters.phase || undefined);
    // Clear physicians map when filters change — stale data
    setPhysiciansMap({});
  };

  return (
    <>
      <div className="app-shell">
        <header className="site-header">
          <div className="header-inner">
            <div className="logo-group">
              <div className="logo-icon">🧬</div>
              <div className="logo-text">Trial<span>Match</span></div>
            </div>
            <div className="header-pill">Powered by ClinicalTrials.gov</div>
          </div>
        </header>

        {/* HERO — only when no filter applied */}
        {!hasAnyFilter && (
          <div className="hero">
            <div className="hero-label">Clinical Research Platform</div>
            <h1 className="hero-title">
              Find Trials &amp; <span className="accent">Matching Physicians</span>
            </h1>
            <p className="hero-sub">
              Search thousands of active clinical trials and connect with physicians near trial locations.
            </p>
          </div>
        )}

        <div className="content-grid">
          <div className="sidebar-card">
            <div className="sidebar-heading">Search Filters</div>
            <PhysicianFilters onFilterChange={handleFilterChange} />
          </div>

          <div>
            {loading && (
              <div className="state-box">
                <div className="spinner" />
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>Searching trials...</p>
              </div>
            )}

            {!loading && error && (
              <div className="error-box">
                <span style={{ fontSize: "18px" }}>⚠️</span>
                <div>
                  <p>{error}</p>
                  <button className="btn-primary" style={{ marginTop: "12px" }} onClick={refetch}>Try Again</button>
                </div>
              </div>
            )}

            {!loading && !error && !hasAnyFilter && (
              <div className="state-box">
                <span className="state-icon">🔬</span>
                <div className="state-title">Start your search</div>
                <div className="state-sub">Enter any filter — condition, city, state, status or phase — to discover relevant clinical trials and nearby physicians.</div>
                <div className="hint-pills">
                  <span className="hint-pill">Oncology</span>
                  <span className="hint-pill">Diabetes</span>
                  <span className="hint-pill">Alzheimer</span>
                  <span className="hint-pill">Cardiology</span>
                </div>
              </div>
            )}

            {!loading && !error && hasAnyFilter && trials.length === 0 && (
              <div className="state-box">
                <span className="state-icon">🔍</span>
                <div className="state-title">No trials found</div>
                <div className="state-sub">Try adjusting your search criteria.</div>
                <button className="btn-primary" onClick={refetch}>Refresh Search</button>
              </div>
            )}

            {!loading && !error && trials.length > 0 && (
              <>
                {/* ── Results header with save button ── */}
                <div className="results-meta">
                  <div>
                    <div className="results-count"><strong>{totalCount}</strong> trials found</div>
                    <div className="results-sub">Showing {trials.length} of {totalCount}</div>
                  </div>

                  {/* NEW: Save button — top right of results */}
                  <ResultsSaveButton
                    trials={trials}
                    physiciansMap={physiciansMap}
                    searchCondition={condition || ""}
                    searchFilters={{
                      status:  status  || "",
                      phase:   phase   || "",
                      city:    city    || "",
                      state:   state   || "",
                    }}
                  />
                </div>

                {/* ── Trial cards ── */}
                <div className="trial-list">
                  {trials.map((trial: Trial) => (
                    <TrialCard
                      key={trial.nctId}
                      trial={trial}
                      searchCity={city    || undefined}
                      searchState={state  || undefined}
                      searchCondition={condition || undefined}
                      searchFilters={{
                        status: status || "",
                        phase:  phase  || "",
                        city:   city   || "",
                        state:  state  || "",
                      }}
                      // NEW: callback so this card's physicians flow up to physiciansMap
                      onPhysiciansLoaded={onPhysiciansLoaded}
                    />
                  ))}
                </div>

                {hasMore && (
                  <button className="btn-load-more" onClick={loadMore}>Load More Trials</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}