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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #f4f7fb;
          color: #1e293b;
        }

        .app-shell {
          min-height: 100vh;
          background: linear-gradient(160deg, #eef4ff 0%, #f4f7fb 50%, #f0f5ff 100%);
          position: relative;
        }

        .app-shell::before {
          content: '';
          position: fixed;
          top: -200px; right: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .app-shell::after {
          content: '';
          position: fixed;
          bottom: -200px; left: -100px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Header */
        .site-header {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(99,102,241,0.1);
          padding: 0 40px;
          box-shadow: 0 1px 12px rgba(99,102,241,0.06);
        }
        .header-inner {
          max-width: 1320px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 68px;
        }
        .logo-group { display: flex; align-items: center; gap: 11px; }
        .logo-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #38bdf8);
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; box-shadow: 0 2px 10px rgba(99,102,241,0.3);
        }
        .logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 800;
          color: #1e293b; letter-spacing: -0.4px;
        }
        .logo-text span { color: #6366f1; }
        .header-pill {
          font-size: 11px; font-weight: 600;
          color: #6366f1; background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.18);
          padding: 4px 12px; border-radius: 100px;
          letter-spacing: 0.3px;
        }

        /* Hero */
        .hero {
          max-width: 1320px; margin: 0 auto;
          padding: 56px 40px 40px;
          position: relative; z-index: 1;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #6366f1; margin-bottom: 16px;
        }
        .hero-eyebrow::before {
          content: ''; width: 18px; height: 2px;
          background: #6366f1; border-radius: 2px;
        }
        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(34px, 4vw, 52px);
          font-weight: 800; color: #0f172a;
          line-height: 1.1; letter-spacing: -1.5px;
          max-width: 580px; margin-bottom: 14px;
        }
        .hero-title .accent {
          background: linear-gradient(90deg, #6366f1, #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: 16px; color: #64748b;
          font-weight: 400; max-width: 440px; line-height: 1.65;
        }

        /* Layout */
        .content-grid {
          max-width: 1320px; margin: 0 auto;
          padding: 0 40px 80px;
          display: grid;
          grid-template-columns: 290px 1fr;
          gap: 24px; align-items: start;
          position: relative; z-index: 1;
        }

        /* Sidebar */
        .sidebar-card {
          background: #ffffff;
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 20px; padding: 26px;
          box-shadow: 0 2px 16px rgba(99,102,241,0.06);
          position: sticky; top: 84px;
        }
        .sidebar-heading {
          font-family: 'Syne', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 1.2px; text-transform: uppercase;
          color: #94a3b8; margin-bottom: 20px;
        }

        /* Results */
        .results-meta {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 18px; flex-wrap: wrap; gap: 8px;
        }
        .results-count {
          font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 700; color: #1e293b;
        }
        .results-count strong { color: #6366f1; font-size: 22px; }
        .results-sub { font-size: 12px; color: #94a3b8; }

        /* State boxes */
        .state-box {
          background: #fff;
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 20px; padding: 52px 32px;
          text-align: center;
          box-shadow: 0 2px 16px rgba(99,102,241,0.05);
        }
        .state-icon { font-size: 44px; margin-bottom: 16px; display: block; }
        .state-title {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 700;
          color: #0f172a; margin-bottom: 8px;
        }
        .state-sub {
          font-size: 14px; color: #94a3b8;
          line-height: 1.6; margin-bottom: 24px; max-width: 340px; margin-inline: auto;
        }
        .hint-pills { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 4px; }
        .hint-pill {
          font-size: 12px; font-weight: 600;
          background: rgba(99,102,241,0.07);
          color: #6366f1; padding: 5px 14px;
          border-radius: 100px; border: 1px solid rgba(99,102,241,0.15);
        }

        /* Spinner */
        .spinner {
          width: 44px; height: 44px;
          border: 3px solid rgba(99,102,241,0.12);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Error */
        .error-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 16px; padding: 18px 22px;
          display: flex; gap: 12px; align-items: flex-start;
        }
        .error-box p { font-size: 14px; color: #dc2626; line-height: 1.5; }

        /* Buttons */
        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #38bdf8);
          color: #fff; border: none;
          padding: 11px 26px; border-radius: 10px;
          font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: opacity 0.2s, transform 0.15s;
          box-shadow: 0 2px 12px rgba(99,102,241,0.25);
        }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }

        .btn-load-more {
          display: block; margin: 28px auto 0;
          background: #fff; color: #6366f1;
          border: 1.5px solid rgba(99,102,241,0.25);
          padding: 11px 36px; border-radius: 10px;
          font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
          box-shadow: 0 1px 6px rgba(99,102,241,0.08);
        }
        .btn-load-more:hover {
          border-color: #6366f1;
          background: rgba(99,102,241,0.04);
          transform: translateY(-1px);
        }

        .trial-list { display: flex; flex-direction: column; gap: 16px; }

        @media (max-width: 900px) {
          .content-grid { grid-template-columns: 1fr; padding: 0 16px 60px; }
          .hero { padding: 36px 16px 28px; }
          .site-header { padding: 0 16px; }
          .sidebar-card { position: static; }
        }
      `}</style>

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
                <span style={{ fontSize: "20px" }}>⚠️</span>
                <div>
                  <p>{error}</p>
                  <button className="btn-primary" style={{ marginTop: "14px" }} onClick={refetch}>Try Again</button>
                </div>
              </div>
            )}

            {!loading && !error && !condition && (
              <div className="state-box">
                <span className="state-icon">🔬</span>
                <div className="state-title">Start your search</div>
                <div className="state-sub">Enter a condition in the filters to discover relevant clinical trials and nearby physicians.</div>
                <div className="hint-pills">
                  <span className="hint-pill">Oncology</span>
                  <span className="hint-pill">Diabetes</span>
                  <span className="hint-pill">Alzheimer</span>
                  <span className="hint-pill">Cardiology</span>
                </div>
              </div>
            )}

            {!loading && !error && condition && trials.length === 0 && (
              <div className="state-box">
                <span className="state-icon">🔍</span>
                <div className="state-title">No trials found</div>
                <div className="state-sub">No results matched your filters. Try adjusting your search criteria.</div>
                <button className="btn-primary" onClick={refetch}>Refresh Search</button>
              </div>
            )}

            {!loading && !error && trials.length > 0 && (
              <>
                <div className="results-meta">
                  <div className="results-count">
                    <strong>{totalCount}</strong> trials found
                  </div>
                  <div className="results-sub">Showing {trials.length} of {totalCount}</div>
                </div>

                <div className="trial-list">
                  {trials.map((trial: Trial) => (
                    <TrialCard key={trial.nctId} trial={trial} />
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