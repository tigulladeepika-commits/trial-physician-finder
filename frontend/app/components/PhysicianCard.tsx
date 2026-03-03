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

  const avatarColors = [
    ["#38bdf8", "#0ea5e9"],
    ["#818cf8", "#6366f1"],
    ["#34d399", "#10b981"],
    ["#f472b6", "#ec4899"],
    ["#fb923c", "#f97316"],
  ];
  const colorPair = avatarColors[initials.charCodeAt(0) % avatarColors.length];

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        padding: "14px 16px",
        fontFamily: "'DM Sans', sans-serif",
        transition: "border-color 0.2s, background 0.2s, transform 0.15s",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(56,189,248,0.25)";
        e.currentTarget.style.background = "rgba(56,189,248,0.04)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "10px",
          background: "linear-gradient(135deg, " + colorPair[0] + ", " + colorPair[1] + ")",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "13px",
          fontWeight: 700,
          color: "#fff",
          flexShrink: 0,
          letterSpacing: "0.5px",
        }}
      >
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {displayName}
          {doctor.credential && (
            <span style={{ fontWeight: 400, color: "#64748b", marginLeft: "5px", fontSize: "11px" }}>
              {doctor.credential}
            </span>
          )}
        </div>

        {doctor.taxonomyDescription && (
          <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 500, marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {doctor.taxonomyDescription}
          </div>
        )}

        {doctor.taxonomyCode && (
          <div style={{ marginBottom: "5px" }}>
            <span style={{
              fontSize: "10px",
              fontFamily: "monospace",
              background: "rgba(99,102,241,0.12)",
              color: "#818cf8",
              padding: "2px 7px",
              borderRadius: "5px",
              border: "1px solid rgba(99,102,241,0.2)",
              letterSpacing: "0.3px",
            }}>
              {doctor.taxonomyCode}
            </span>
          </div>
        )}

        <div style={{ fontSize: "11px", color: "#475569", lineHeight: 1.4 }}>
          {[doctor.city, doctor.state].filter(Boolean).join(", ")}
          {doctor.zipCode && " " + doctor.zipCode}
        </div>

        {doctor.distance != null && (
          <div style={{ fontSize: "11px", color: "#34d399", fontWeight: 500, marginTop: "4px" }}>
            {"📍 " + doctor.distance + " km away"}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", marginTop: "6px", flexWrap: "wrap" }}>
          {doctor.phone && (
            <div
              style={{ fontSize: "11px", color: "#64748b", cursor: "pointer", transition: "color 0.15s" }}
              onClick={() => window.open("tel:" + doctor.phone)}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#38bdf8")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              {"📞 " + doctor.phone}
            </div>
          )}
          {doctor.email && (
            <div
              style={{ fontSize: "11px", color: "#64748b", cursor: "pointer", transition: "color 0.15s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              onClick={() => window.open("mailto:" + doctor.email)}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#38bdf8")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              {"✉️ " + doctor.email}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}