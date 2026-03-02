"use client";

import { useState } from "react";
import { useTrials } from "./hooks/useTrials";
import TrialCard from "./components/TrialCard";
import { Trial } from "./types";
import dynamic from "next/dynamic";
const TrialMap = dynamic(() => import("./components/TrialMap"), { ssr: false });

export default function Page() {
  const [condition, setCondition] = useState("");
  const [otherTerms, setOtherTerms] = useState("");
  const [intervention, setIntervention] = useState("");
  const [location, setLocation] = useState("");
  const [studyStatus, setStudyStatus] = useState("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [ageGroup, setAgeGroup] = useState("");
  const [phase, setPhase] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState({ city: "", state: "" });

  const parseLocation = (loc: string) => {
    const parts = loc.split(",").map((s) => s.trim());
    return { city: parts[0] || "", state: parts[1] || "" };
  };

  const { city, state } = parseLocation(location);

  const { trials, loading: trialsLoading } = useTrials(
    submitted ? (condition || " ") : null,
    submitted ? (city || " ") : null,
    submitted ? (state || " ") : null,
    submitted ? otherTerms : undefined,
    undefined
  );

  const handleSearch = () => {
    const parsed = parseLocation(location);
    setSearchedLocation(parsed);
    setSubmitted(true);
  };

  const handleReset = () => {
    setCondition("");
    setOtherTerms("");
    setIntervention("");
    setLocation("");
    setStudyStatus("all");
    setAgeGroup("");
    setPhase("");
    setSubmitted(false);
    setSearchedLocation({ city: "", state: "" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
   
      <header className="page-header">
        <div className="header-inner">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="header-title">Trial Physician Finder</span>
        </div>
      </header>

      <main className="main-content">
        {!submitted && (
          <div className="hero-section">
            <div className="hero-eyebrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
              Clinical Trial Research Tool
            </div>
            <h1 className="hero-title">Find physicians for<br/><em>any clinical trial</em></h1>
            <p className="hero-desc">Search thousands of clinical trials and discover nearby physicians who specialize in treating your condition.</p>
          </div>
        )}

        <div className="search-card">
          <div className="search-card-header">
            <span className="search-card-title">Search Filters</span>
            {submitted && <span style={{ fontSize: "12px", color: "#6b7280" }}>All fields optional</span>}
          </div>

          <div className="search-card-body">
            <div className="field-group">
              <label className="field-label">Condition / Disease</label>
              <input className="field-input" placeholder="e.g. breast cancer, diabetes" value={condition}
                onChange={(e) => setCondition(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
            </div>
            <div className="field-group">
              <label className="field-label">Other Terms</label>
              <input className="field-input" placeholder="e.g. biomarker, genetic" value={otherTerms}
                onChange={(e) => setOtherTerms(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Intervention / Treatment</label>
              <input className="field-input" placeholder="e.g. aspirin, surgery" value={intervention}
                onChange={(e) => setIntervention(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Location</label>
              <input className="field-input" placeholder="City, State — e.g. Dallas, TX" value={location}
                onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="field-group full-width">
              <label className="field-label">Study Status</label>
              <div className="status-radio-group">
                <label className="radio-option">
                  <input type="radio" name="studyStatus" value="all" checked={studyStatus === "all"} onChange={() => setStudyStatus("all")} />
                  All studies
                </label>
                <label className="radio-option">
                  <input type="radio" name="studyStatus" value="recruiting" checked={studyStatus === "recruiting"} onChange={() => setStudyStatus("recruiting")} />
                  Recruiting & not yet recruiting
                </label>
              </div>
            </div>

            <div className="field-group full-width">
              <button className="more-filters-btn" onClick={() => setShowMoreFilters(!showMoreFilters)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
                </svg>
                {showMoreFilters ? "Fewer filters" : "More filters"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ transform: showMoreFilters ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>

            {showMoreFilters && (
              <div className="more-filters-section">
                <div className="field-group">
                  <label className="field-label">Age Group</label>
                  <select className="field-select" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                    <option value="">Any age</option>
                    <option value="child">Child (birth–17)</option>
                    <option value="adult">Adult (18–64)</option>
                    <option value="older_adult">Older adult (65+)</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Study Phase</label>
                  <select className="field-select" value={phase} onChange={(e) => setPhase(e.target.value)}>
                    <option value="">Any phase</option>
                    <option value="early_phase1">Early Phase 1</option>
                    <option value="phase1">Phase 1</option>
                    <option value="phase2">Phase 2</option>
                    <option value="phase3">Phase 3</option>
                    <option value="phase4">Phase 4</option>
                    <option value="na">Not Applicable</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="search-card-footer">
            <button className="btn-reset" onClick={handleReset}>Clear all</button>
            <button className="btn-search" onClick={handleSearch}>Search trials →</button>
          </div>
        </div>

        {/* Loading Skeletons */}
        {submitted && trialsLoading && (
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-line" style={{ width: "70%" }} />
                <div className="skeleton-line" style={{ width: "30%", marginBottom: "16px" }} />
                <div className="skeleton-line" style={{ width: "100%", height: "10px" }} />
                <div className="skeleton-line" style={{ width: "90%", height: "10px" }} />
                <div className="skeleton-line" style={{ width: "60%", height: "10px" }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {submitted && !trialsLoading && trials.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 24px", color: "#9ca3af" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px", opacity: 0.5 }}>🔍</div>
            <div style={{ fontSize: "16px", fontWeight: 500, color: "#6b7280", marginBottom: "6px" }}>No trials found</div>
            <div style={{ fontSize: "13px" }}>Try broadening your search or using different terms.</div>
          </div>
        )}

        {/* Results */}
        {submitted && !trialsLoading && trials.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                Found <strong style={{ color: "#111827" }}>{trials.length}</strong> trial{trials.length !== 1 ? "s" : ""}
                {condition && <> for <strong style={{ color: "#111827" }}>{condition}</strong></>}
                {searchedLocation.city && <> near <strong style={{ color: "#111827" }}>{[searchedLocation.city, searchedLocation.state].filter(Boolean).join(", ")}</strong></>}
              </span>
            </div>

            <TrialMap
              trials={trials}
              searchedCity={searchedLocation.city}
              searchedState={searchedLocation.state}
            />

            {trials.map((trial: Trial) => (
              <TrialCard key={trial.nctId} trial={trial} />
            ))}
          </>
        )}
      </main>
    </div>
  );
}