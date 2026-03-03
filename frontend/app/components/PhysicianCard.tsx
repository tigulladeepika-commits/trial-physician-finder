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

  const displayName = doctor.name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return (
    <div
      style={{
        background: "white",
        border: "1.5px solid #e8eaed",
        borderRadius: "10px",
        padding: "14px 16px",
        fontFamily: "'DM Sans', sans-serif",
        transition: "border-color 0.15s, box-shadow 0.15s",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#bfdbfe";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(26,86,219,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e8eaed";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Avatar */}
      <div
        style={{
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
        }}
      >
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + credential */}
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "2px",
          }}
        >
          {displayName}
          {doctor.credential && (
            <span
              style={{
                fontWeight: 400,
                color: "#9ca3af",
                marginLeft: "4px",
                fontSize: "11px",
              }}
            >
              {doctor.credential}
            </span>
          )}
        </div>

        {/* Taxonomy description */}
        {doctor.taxonomyDescription && (
          <div
            style={{
              fontSize: "11px",
              color: "#1d4ed8",
              fontWeight: 500,
              marginBottom: "3px",
            }}
          >
            {doctor.taxonomyDescription}
          </div>
        )}

        {/* Taxonomy code badge */}
        {doctor.taxonomyCode && (
          <div style={{ marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "monospace",
                background: "#f1f5f9",
                color: "#64748b",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid #e2e8f0",
                letterSpacing: "0.3px",
              }}
            >
              {doctor.taxonomyCode}
            </span>
          </div>
        )}

        {/* Location */}
        <div style={{ fontSize: "11px", color: "#9ca3af", lineHeight: 1.4 }}>
          {[doctor.city, doctor.state].filter(Boolean).join(", ")}
          {doctor.zipCode && " " + doctor.zipCode}
        </div>

        {/* Distance */}
        {doctor.distance != null && (
          <div
            style={{
              fontSize: "11px",
              color: "#10b981",
              fontWeight: 500,
              marginTop: "4px",
            }}
          >
            {"\uD83D\uDCCD"} {doctor.distance} km away
          </div>
        )}

        {/* Phone */}
        {doctor.phone && (
          <div
            style={{
              fontSize: "11px",
              color: "#1a56db",
              marginTop: "6px",
              cursor: "pointer",
            }}
            onClick={() => window.open("tel:" + doctor.phone)}
          >
            {"\uD83D\uDCDE"} {doctor.phone}
          </div>
        )}

        {/* Email */}
        {doctor.email && (
          <div
            style={{
              fontSize: "11px",
              color: "#1a56db",
              marginTop: "2px",
              cursor: "pointer",
            }}
            onClick={() => window.open("mailto:" + doctor.email)}
          >
            {"\u2709\uFE0F"} {doctor.email}
          </div>
        )}
      </div>
    </div>
  );
}