"use client";

import { Physician } from "../types";

type Props = {
  doctor: Physician;
};

export default function PhysicianCard({ doctor }: Props) {
  const initials = doctor.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  return (
    <div style={{
      background: "white",
      border: "1.5px solid #e8eaed",
      borderRadius: "10px",
      padding: "14px 16px",
      fontFamily: "'DM Sans', sans-serif",
      transition: "border-color 0.15s, box-shadow 0.15s",
      display: "flex",
      gap: "12px",
      alignItems: "flex-start",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "#bfdbfe";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(26,86,219,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#e8eaed";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
        border: "1.5px solid #bfdbfe",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: 700,
        color: "#1d4ed8",
        flexShrink: 0,
        letterSpacing: "0.5px",
      }}>
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "2px" }}>
          {doctor.name.split(" ").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}
        </div>
        {doctor.specialty && (
          <div style={{ fontSize: "11px", color: "#1d4ed8", fontWeight: 500, marginBottom: "4px" }}>
            {doctor.specialty}
          </div>
        )}
        <div style={{ fontSize: "11px", color: "#9ca3af", lineHeight: 1.4 }}>
          {[doctor.city, doctor.state].filter(Boolean).join(", ")}
          {doctor.postal_code && ` ${doctor.postal_code}`}
        </div>
        {doctor.distance_km != null && (
          <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 500, marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {doctor.distance_km} km away
          </div>
        )}
      </div>
    </div>
  );
}
