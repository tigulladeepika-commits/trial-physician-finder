"use client";

import { useState } from "react";
import PhysicianFilters from "./components/PhysicianFilters";
import TrialCard from "./components/TrialCard";
import { Trial } from "./types";
import { useTrials } from "./hooks/useTrials";

export default function Home() {
  const [condition, setCondition] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [phase, setPhase] = useState<string | undefined>(undefined);

  const { trials, loading, totalCount, error, refetch, hasMore, loadMore } = useTrials(
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
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #f0f2f7;
          min-height: 100vh;
        }

        .app-shell {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 40%, #0a2444 100%);
          position: relative;
          overflow-x: hidden;
        }

        .app-shell::before {
          content: '';
          position: fixed;
          top: -40%;
          right: -20%;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .app-shell::after {
          content: '';
          position: fixed;
          bottom: -20%;
          left: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Header ── */
        .site-header {
          position: relative;
          z-index: 10;
          padding: 0 40px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          background: rgba(10,15,30,0.6);
          backdrop-filter: blur(16px);
        }

        .header-inner {
          max-width: 1320px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
        }

        .logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
        }

        .logo-text span {
          color: #38bdf8;
        }

        .header-badge {
          font-size: 11px;
          font-weight: 500;
          color: #94a3b8;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 4px 12px;
          border-radius: 100px;
          letter-spacing: 0.3px;
        }

        /* ── Hero ── */
        .hero {
          position: relative;
          z-index: 10;
          max-width: 1320px;
          margin: 0 auto;
          padding: 64px 40px 48px;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #38bdf8;
          margin-bottom: 18px;
        }

        .hero-eyebrow::before {
          content: '';
          width: 20px;
          height: 1.5px;
          background: #38bdf8;
          border-radius: 2px;
        }

        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(36px, 4vw, 54px);
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -1.5px;
          max-width: 640px;
          margin-bottom: 16px;
        }

        .hero-title .accent {
          background: linear-gradient(90deg, #38bdf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: 16px;
          color: #94a3b8;
          font-weight: 300;
          max-width: 480px;
          line-height: 1.6;
        }

        /* ── Layout ── */
        .content-grid {
          position: relative;
          z-index: 10;
          max-width: 1320px;
          margin: 0 auto;
          padding: 0 40px 80px;
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 28px;
          align-items: start;
        }

        /* ── Sidebar ── */
        .sidebar-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          padding: 28px;
          backdrop-filter: blur(12px);
          position: sticky;
          top: 24px;
        }

        .sidebar-title {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 20px;
        }

        /* ── Results panel ── */
        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .results-count {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .results-count span {
          color: #38bdf8;
          font-size: 22px;
        }

        /* ── States ── */
        .state-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 48px 32px;
          text-align: center;
        }

        .state-icon {
          font-size: 40px;
          margin-bottom: 16px;
          display: block;
        }

        .state-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 8px;
        }

        .state-sub {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 24px;
          line-height: 1.5;
        }

        .empty-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .empty-prompt p {
          font-size: 13px;
          color: #475569;
        }

        /* ── Spinner ── */
        .spinner-ring {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(56,189,248,0.15);
          border-top-color: #38bdf8;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Error box ── */
        .error-box {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 14px;
          padding: 18px 22px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .error-box p {
          font-size: 14px;
          color: #fca5a5;
          line-height: 1.5;
        }

        /* ── Buttons ── */
        .btn-primary {
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          color: #fff;
          border: none;
          padding: 11px 24px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.2s, transform 0.15s;
          letter-spacing: 0.2px;
        }

        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        .btn-outline {
          background: rgba(255,255,255,0.05);
          color: #cbd5e1;
          border: 1px solid rgba(255,255,255,0.12);
          padding: 11px 32px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.2s, border-color 0.2s;
          letter-spacing: 0.2px;
          display: block;
          margin: 28px auto 0;
        }

        .btn-outline:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(56,189,248,0.35);
          color: #38bdf8;
        }

        /* ── Divider dots ── */
        .trial-list { display: flex; flex-direction: column; gap: 14px; }

        @media (max-width: 900px) {
          .content-grid { grid-template-columns: 1fr; padding: 0 20px 60px; }
          .hero { padding: 40px 20px 32px; }
          .site-header { padding: 0 20px; }
          .sidebar-card { position: static; }
        }
      `}</style>

      <div className="app-shell">
        {/* Header */}
        <header className="site-header">
          <div className="header-inner">
            <div className="logo-group">
              <div className="logo-icon">🧬</div>
              <div className="logo-text">Trial<span>Match</span></div>
            </div>
            <div className="header-badge">Powered by ClinicalTrials.gov</div>
          </div>
        </header>

        {/* Hero */}
        <div className="hero">
          <div className="hero-eyebrow">Clinical Research Platform</div>
          <h1 className="hero-title">
            Find Trials &amp;<br />
            <span className="accent">Matching Physicians</span>
          </h1>
          <p className="hero-sub">
            Search thousands of active clinical trials and connect with physicians near trial locations.
          </p>
        </div>

        {/* Main grid */}
        <div className="content-grid">
          {/* Sidebar */}
          <div className="sidebar-card">
            <div className="sidebar-title">Search Filters</div>
            <PhysicianFilters onFilterChange={handleFilterChange} />
          </div>

          {/* Results */}
          <div>
            {/* Loading */}
            {loading && (
              <div className="state-box">
                <div className="spinner-ring" />
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>Searching trials...</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="error-box">
                <span style={{ fontSize: "20px" }}>⚠️</span>
                <div>
                  <p>{error}</p>
                  <button className="btn-primary" style={{ marginTop: "14px" }} onClick={refetch}>
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Empty — no search yet */}
            {!loading && !error && !condition && (
              <div className="state-box">
                <span className="state-icon">🔬</span>
                <div className="state-title">Start your search</div>
                <div className="state-sub">Enter a condition in the filters to discover relevant clinical trials and nearby physicians.</div>
                <div className="empty-prompt">
                  <p>Try: <strong style={{ color: "#38bdf8" }}>Oncology</strong>, <strong style={{ color: "#38bdf8" }}>Diabetes</strong>, <strong style={{ color: "#38bdf8" }}>Alzheimer</strong></p>
                </div>
              </div>
            )}

            {/* Empty — searched but no results */}
            {!loading && !error && condition && trials.length === 0 && (
              <div className="state-box">
                <span className="state-icon">🔍</span>
                <div className="state-title">No trials found</div>
                <div className="state-sub">No results matched your filters. Try adjusting your search criteria.</div>
                <button className="btn-primary" onClick={refetch}>Refresh Search</button>
              </div>
            )}

            {/* Results */}
            {!loading && !error && trials.length > 0 && (
              <>
                <div className="results-header">
                  <div className="results-count">
                    <span>{totalCount}</span> trials found
                  </div>
                  <div style={{ fontSize: "13px", color: "#475569" }}>
                    Showing {trials.length} of {totalCount}
                  </div>
                </div>

                <div className="trial-list">
                  {trials.map((trial: Trial) => (
                    <TrialCard key={trial.nctId} trial={trial} />
                  ))}
                </div>

                {hasMore && (
                  <button className="btn-outline" onClick={loadMore}>
                    Load More Trials
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}