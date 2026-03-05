"use client";

import { useState } from "react";

export type SaveMode = "all_trials" | "trials_with_physicians" | "single_trial";

type Props = {
  onClose: () => void;
  onSave: (mode: SaveMode) => void;
  saving: boolean;
  // Context so modal can show smart counts
  totalTrials: number;
  trialsWithPhysicians: number;   // how many trials have physicians loaded
  isSingleTrial?: boolean;        // true when called from inside a TrialCard
  trialTitle?: string;            // shown when isSingleTrial=true
  hasPhysicians?: boolean;        // whether this single trial has physicians loaded
};

const OPTION_STYLES = {
  base: {
    display: "flex", alignItems: "flex-start", gap: "14px",
    padding: "14px 16px", borderRadius: "12px", cursor: "pointer",
    border: "1.5px solid", transition: "all 0.15s", background: "transparent",
    width: "100%", textAlign: "left" as const,
  },
};

export default function SaveModal({
  onClose, onSave, saving,
  totalTrials, trialsWithPhysicians,
  isSingleTrial = false, trialTitle, hasPhysicians = false,
}: Props) {
  const [selected, setSelected] = useState<SaveMode | null>(
    isSingleTrial ? "single_trial" : null
  );

  // Build the options based on context
  const options: Array<{
    mode: SaveMode;
    icon: string;
    label: string;
    desc: string;
    count: string;
    disabled: boolean;
  }> = isSingleTrial
    ? [
        {
          mode: "single_trial",
          icon: "📄",
          label: "Save this trial only",
          desc: trialTitle ? `"${trialTitle.slice(0, 60)}${trialTitle.length > 60 ? "…" : ""}"` : "Save the trial details",
          count: "1 trial",
          disabled: false,
        },
        {
          mode: "trials_with_physicians",
          icon: "👨‍⚕️",
          label: "Save trial + physicians",
          desc: hasPhysicians
            ? "Save trial details and all loaded physicians"
            : "No physicians loaded yet — click 'Find Physicians' first",
          count: hasPhysicians ? "1 trial + physicians" : "unavailable",
          disabled: !hasPhysicians,
        },
      ]
    : [
        {
          mode: "all_trials",
          icon: "📋",
          label: "Save all trials",
          desc: "Save every trial in the current search results page",
          count: `${totalTrials} trial${totalTrials !== 1 ? "s" : ""}`,
          disabled: totalTrials === 0,
        },
        {
          mode: "trials_with_physicians",
          icon: "👨‍⚕️",
          label: "Save trials with physicians only",
          desc: trialsWithPhysicians > 0
            ? "Save only trials where you've already loaded physicians"
            : "No physicians loaded yet — expand a trial and click 'Find Physicians' first",
          count: trialsWithPhysicians > 0
            ? `${trialsWithPhysicians} trial${trialsWithPhysicians !== 1 ? "s" : ""} + physicians`
            : "unavailable",
          disabled: trialsWithPhysicians === 0,
        },
      ];

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "20px",
      }}
    >
      {/* Modal card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "18px", width: "100%", maxWidth: "460px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          fontFamily: "'Inter', sans-serif", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                width: 36, height: 36, borderRadius: "10px",
                background: "rgba(99,102,241,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px",
              }}>💾</span>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                  Save to Database
                </div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "1px" }}>
                  Choose what to save to DuckDB
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "20px", lineHeight: 1, padding: "4px" }}
            >×</button>
          </div>
        </div>

        {/* Options */}
        <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {options.map(opt => {
            const isSelected = selected === opt.mode;
            return (
              <button
                key={opt.mode}
                disabled={opt.disabled}
                onClick={() => !opt.disabled && setSelected(opt.mode)}
                style={{
                  ...OPTION_STYLES.base,
                  borderColor: isSelected ? "#6366f1" : opt.disabled ? "#f1f5f9" : "#e2e8f0",
                  background: isSelected ? "rgba(99,102,241,0.05)" : opt.disabled ? "#fafafa" : "#fff",
                  opacity: opt.disabled ? 0.5 : 1,
                  cursor: opt.disabled ? "not-allowed" : "pointer",
                }}
              >
                {/* Radio indicator */}
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: "2px",
                  border: `2px solid ${isSelected ? "#6366f1" : "#cbd5e1"}`,
                  background: isSelected ? "#6366f1" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isSelected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "15px" }}>{opt.icon}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: opt.disabled ? "#94a3b8" : "#0f172a" }}>
                      {opt.label}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.45 }}>{opt.desc}</div>
                  <div style={{
                    display: "inline-block", marginTop: "6px",
                    fontSize: "10px", fontWeight: 600,
                    color: isSelected ? "#6366f1" : "#94a3b8",
                    background: isSelected ? "rgba(99,102,241,0.1)" : "#f8fafc",
                    padding: "2px 8px", borderRadius: "100px",
                    fontFamily: "monospace",
                  }}>
                    {opt.count}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 22px 20px",
          borderTop: "1px solid #f1f5f9",
          display: "flex", gap: "10px", justifyContent: "flex-end",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: "9px", fontSize: "13px",
              background: "transparent", border: "1.5px solid #e2e8f0",
              color: "#64748b", cursor: "pointer", fontFamily: "'Inter', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            disabled={!selected || saving}
            onClick={() => selected && onSave(selected)}
            style={{
              padding: "9px 22px", borderRadius: "9px", fontSize: "13px", fontWeight: 600,
              background: selected && !saving ? "#6366f1" : "#e2e8f0",
              color: selected && !saving ? "#fff" : "#94a3b8",
              border: "none", cursor: selected && !saving ? "pointer" : "not-allowed",
              fontFamily: "'Inter', sans-serif",
              display: "flex", alignItems: "center", gap: "7px",
              transition: "background 0.15s",
            }}
          >
            {saving
              ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> Saving...</>
              : <>💾 Save to DuckDB</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}