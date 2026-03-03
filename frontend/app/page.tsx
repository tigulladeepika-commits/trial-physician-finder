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
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f4f6fa;
          color: #1e293b;
          -webkit-font-smoothing: antialiased;
        }

        .app-shell { min-height: 100vh; background: #f4f6fa; }

        /* Header */
        .site-header {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e8edf5;
          padding: 0 40px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05);
        }
        .header-inner {
          max-width: 1320px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px;
        }
        .logo-group { display: flex; align-items: center; gap: 10px; }
        .logo-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(135deg, #6366f1, #38bdf8);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .logo-text {
          font-size: 17px; font-weight: 700;
          color: #0f172a; letter-spacing: -0.3px;
        }
        .logo-text span { color: #6366f1; }
        .header-pill {
          font-size: 11px; font-weight: 500;
          color: #6366f1; background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.18);
          padding: 4px 12px; border-radius: 100px;
        }

        /* Hero */
        .hero {
          max-width: 1320px; margin: 0 auto;
          padding: 48px 40px 36px;
        }
        .hero-label {
          font-size: 11px; font-weight: 600;
          letter-spacing: 1.4px; text-transform: uppercase;
          color: #6366f1; margin-bottom: 14px;
          display: flex; align-items: center; gap: 7px;
        }
        .hero-label::before {
          content: ''; width: 16px; height: 2px;
          background: #6366f1; border-radius: 2px;
        }
        .hero-title {
          font-size: clamp(28px, 3.5vw, 44px);
          font-weight: 700; color: #0f172a;
          line-height: 1.15; letter-spacing: -0.8px;
          max-width: 520px; margin-bottom: 12px;
        }
        .hero-title .accent {
          background: linear-gradient(90deg, #6366f1, #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: 15px; color: #64748b;
          font-weight: 400; max-width: 400px; line-height: 1.6;
        }

        /* Layout */
        .content-grid {
          max-width: 1320px; margin: 0 auto;
          padding: 0 40px 80px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 22px; align-items: start;
        }

        /* Sidebar */
        .sidebar-card {
          background: #fff;
          border: 1px solid #e8edf5;
          border-radius: 16px; padding: 22px;
          box-shadow: 0 1px 8px rgba(0,0,0,0.04);
          position: sticky; top: 80px;
        }
        .sidebar-heading {
          font-size: 11px; font-weight: 700;
          letter-spacing: 1px; text-transform: uppercase;
          color: #94a3b8; margin-bottom: 18px;
        }

        /* States */
        .state-box {
          background: #fff;
          border: 1px solid #e8edf5;
          border-radius: 16px; padding: 48px 28px;
          text-align: center;
          box-shadow: 0 1px 8px rgba(0,0,0,0.04);
        }
        .state-icon { font-size: 40px; margin-bottom: 14px; display: block; }
        .state-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .state-sub { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
        .hint-pills { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .hint-pill {
          font-size: 12px; font-weight: 500;
          background: rgba(99,102,241,0.07); color: #6366f1;
          padding: 5px 14px; border-radius: 100px;
          border: 1px solid rgba(99,102,241,0.15);
        }

        /* Spinner */
        .spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(99,102,241,0.12);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          margin: 0 auto 14px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Error */
        .error-box {
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 14px; padding: 16px 20px;
          display: flex; gap: 10px; align-items: flex-start;
        }
        .error-box p { font-size: 14px; color: #dc2626; }

        /* Buttons */
        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #38bdf8);
          color: #fff; border: none;
          padding: 10px 24px; border-radius: 9px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: opacity 0.2s;
          box-shadow: 0 2px 10px rgba(99,102,241,0.2);
        }
        .btn-primary:hover { opacity: 0.88; }

        .btn-load-more {
          display: block; margin: 24px auto 0;
          background: #fff; color: #6366f1;
          border: 1.5px solid rgba(99,102,241,0.22);
          padding: 10px 32px; border-radius: 9px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: border-color 0.2s, background 0.2s;
        }
        .btn-load-more:hover { border-color: #6366f1; background: rgba(99,102,241,0.04); }

        /* Results */
        .results-meta {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 16px; flex-wrap: wrap; gap: 8px;
        }
        .results-count { font-size: 14px; font-weight: 600; color: #1e293b; }
        .results-count strong { color: #6366f1; font-size: 20px; font-weight: 700; }
        .results-sub { font-size: 12px; color: #94a3b8; }
        .trial-list { display: flex; flex-direction: column; gap: 14px; }

        @media (max-width: 900px) {
          .content-grid { grid-template-columns: 1fr; padding: 0 16px 60px; }
          .hero { padding: 32px 16px 24px; }
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
          <div className="hero-label">Clinical Research Platform</div>
          <h1 className="hero-title">
            Find Trials &amp; <span className="accent">Matching Physicians</span>
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
                <div className="results-meta">
                  <div className="results-count"><strong>{totalCount}</strong> trials found</div>
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