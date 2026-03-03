"use client";

import { Physician } from "../types";

type Props = { doctor: Physician };

const AVATAR_COLORS = [
  ["#6366f1", "#818cf8"],
  ["#0ea5e9", "#38bdf8"],
  ["#10b981", "#34d399"],
  ["#f43f5e", "#fb7185"],
  ["#f59e0b", "#fbbf24"],
];

export default function PhysicianCard({ doctor }: Props) {
  const initials = doctor.name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("");
  const displayName = doctor.name.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  const [c1, c2] = AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #e8edf5",
        borderRadius: "14px",
        padding: "14px 16px",
        fontFamily: "'DM Sans', sans-serif",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
        e.currentTarget.style.boxShadow = "0 4px 18px rgba(99,102,241,0.1)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e8edf5";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: "10px", flexShrink: 0,
        background: "linear-gradient(135deg, " + c1 + ", " + c2 + ")",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", fontWeight: 700, color: "#fff", letterSpacing: "0.5px",
        boxShadow: "0 2px 8px " + c1 + "40",
      }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {displayName}
          {doctor.credential && (
            <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: "5px", fontSize: "11px" }}>{doctor.credential}</span>
          )}
        </div>

        {doctor.taxonomyDescription && (
          <div style={{ fontSize: "11px", color: "#6366f1", fontWeight: 600, marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {doctor.taxonomyDescription}
          </div>
        )}

        {doctor.taxonomyCode && (
          <div style={{ marginBottom: "5px" }}>
            <span style={{
              fontSize: "10px", fontFamily: "monospace",
              background: "rgba(99,102,241,0.07)", color: "#6366f1",
              padding: "2px 7px", borderRadius: "5px",
              border: "1px solid rgba(99,102,241,0.15)", letterSpacing: "0.3px",
            }}>
              {doctor.taxonomyCode}
            </span>
          </div>
        )}

        <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.4 }}>
          {[doctor.city, doctor.state].filter(Boolean).join(", ")}
          {doctor.zipCode && " " + doctor.zipCode}
        </div>

        {doctor.distance != null && (
          <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 600, marginTop: "3px" }}>
            {"📍 " + doctor.distance + " km away"}
          </div>
        )}

        <div style={{ display: "flex", gap: "14px", marginTop: "6px", flexWrap: "wrap" }}>
          {doctor.phone && (
            <div
              style={{ fontSize: "11px", color: "#94a3b8", cursor: "pointer", transition: "color 0.15s" }}
              onClick={() => window.open("tel:" + doctor.phone)}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6366f1")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              {"📞 " + doctor.phone}
            </div>
          )}
          {doctor.email && (
            <div
              style={{ fontSize: "11px", color: "#94a3b8", cursor: "pointer", transition: "color 0.15s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              onClick={() => window.open("mailto:" + doctor.email)}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6366f1")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              {"✉️ " + doctor.email}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}