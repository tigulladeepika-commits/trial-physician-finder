"use client";

import { useState } from "react";
import SaveModal, { SaveMode } from "./SaveModal";
import { Trial, Physician } from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://trial-physician-finder.onrender.com";

// ── Shared fetch helper ───────────────────────────────────────────────────────

async function callSaveAPI(
  saveMode: SaveMode,
  trials: Trial[],
  physiciansMap: Record<string, Physician[]>,
  searchCondition: string,
  searchFilters: Record<string, string>,
) {
  const res = await fetch(`${BASE_URL}/api/save/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      save_mode: saveMode,
      trials,
      physicians_map: physiciansMap,
      search_condition: searchCondition,
      search_filters: searchFilters,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Save failed");
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SaveResult = { saved_trials: number; saved_physicians: number; message: string } | null;

// ── Toast notification ────────────────────────────────────────────────────────

function Toast({ result, error, onDismiss }: {
  result: SaveResult;
  error: string | null;
  onDismiss: () => void;
}) {
  if (!result && !error) return null;
  const isError = !!error;
  return (
    <div
      onClick={onDismiss}
      style={{
        position: "fixed", bottom: "24px", right: "24px", zIndex: 2000,
        background: isError ? "#fef2f2" : "#f0fdf4",
        border: `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`,
        borderRadius: "12px", padding: "12px 18px",
        display: "flex", alignItems: "center", gap: "10px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        fontFamily: "'Inter', sans-serif", cursor: "pointer",
        maxWidth: "340px",
        animation: "slideUp 0.25s ease",
      }}
    >
      <span style={{ fontSize: "18px" }}>{isError ? "⚠️" : "✅"}</span>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: isError ? "#dc2626" : "#16a34a" }}>
          {isError ? "Save failed" : "Saved to DuckDB"}
        </div>
        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
          {error || result?.message}
        </div>
      </div>
    </div>
  );
}

// ── Variant A: Results-level save button (save all / save with physicians) ────

type ResultsSaveButtonProps = {
  trials: Trial[];
  physiciansMap: Record<string, Physician[]>;   // { nctId: physicians[] }
  searchCondition: string;
  searchFilters: Record<string, string>;
};

export function ResultsSaveButton({
  trials, physiciansMap, searchCondition, searchFilters,
}: ResultsSaveButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [result, setResult]       = useState<SaveResult>(null);
  const [error, setError]         = useState<string | null>(null);

  const trialsWithPhysicians = trials.filter(t => (physiciansMap[t.nctId] ?? []).length > 0).length;

  const handleSave = async (mode: SaveMode) => {
    setSaving(true);
    setError(null);
    try {
      const data = await callSaveAPI(mode, trials, physiciansMap, searchCondition, searchFilters);
      setResult(data);
      setShowModal(false);
      setTimeout(() => setResult(null), 4000);
    } catch (e: any) {
      setError(e.message || "Save failed");
      setShowModal(false);
      setTimeout(() => setError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={trials.length === 0}
        style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          padding: "9px 18px", borderRadius: "10px",
          background: "rgba(99,102,241,0.08)",
          border: "1.5px solid rgba(99,102,241,0.25)",
          color: "#6366f1", fontSize: "13px", fontWeight: 600,
          cursor: trials.length === 0 ? "not-allowed" : "pointer",
          fontFamily: "'Inter', sans-serif",
          transition: "all 0.15s",
          opacity: trials.length === 0 ? 0.5 : 1,
        }}
      >
        💾 Save to DB
      </button>

      {showModal && (
        <SaveModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          saving={saving}
          totalTrials={trials.length}
          trialsWithPhysicians={trialsWithPhysicians}
        />
      )}

      <Toast result={result} error={error} onDismiss={() => { setResult(null); setError(null); }} />
    </>
  );
}

// ── Variant B: Per-trial save button (inside TrialCard) ───────────────────────

type TrialSaveButtonProps = {
  trial: Trial;
  physicians: Physician[];
  searchCondition: string;
  searchFilters: Record<string, string>;
};

export function TrialSaveButton({
  trial, physicians, searchCondition, searchFilters,
}: TrialSaveButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [result, setResult]       = useState<SaveResult>(null);
  const [error, setError]         = useState<string | null>(null);

  const physiciansMap = physicians.length > 0 ? { [trial.nctId]: physicians } : {};

  const handleSave = async (mode: SaveMode) => {
    setSaving(true);
    setError(null);
    try {
      const data = await callSaveAPI(mode, [trial], physiciansMap, searchCondition, searchFilters);
      setResult(data);
      setShowModal(false);
      setTimeout(() => setResult(null), 4000);
    } catch (e: any) {
      setError(e.message || "Save failed");
      setShowModal(false);
      setTimeout(() => setError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "7px 14px", borderRadius: "8px",
          background: "rgba(99,102,241,0.07)",
          border: "1.5px solid rgba(99,102,241,0.2)",
          color: "#6366f1", fontSize: "12px", fontWeight: 600,
          cursor: "pointer", fontFamily: "'Inter', sans-serif",
        }}
      >
        💾 Save
      </button>

      {showModal && (
        <SaveModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          saving={saving}
          totalTrials={1}
          trialsWithPhysicians={physicians.length > 0 ? 1 : 0}
          isSingleTrial={true}
          trialTitle={trial.title}
          hasPhysicians={physicians.length > 0}
        />
      )}

      <Toast result={result} error={error} onDismiss={() => { setResult(null); setError(null); }} />
    </>
  );
}