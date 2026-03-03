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

function copyToClipboard(text: string, btn: HTMLButtonElement) {
  navigator.clipboard.writeText(text).then(() => {
    const prev = btn.textContent;
    btn.textContent = "✓";
    btn.style.color = "#10b981";
    setTimeout(() => { btn.textContent = prev; btn.style.color = ""; }, 1400);
  });
}

export default function PhysicianCard({ doctor }: Props) {
  const initials = doctor.name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("");
  const displayName = doctor.name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  const [c1, c2] = AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];
  const address = [doctor.city, doctor.state].filter(Boolean).join(", ") + (doctor.zipCode ? " " + doctor.zipCode : "");

  return (
    <div
      style={{ background: "#fff", border: "1.5px solid #e8edf5", borderRadius: "13px", padding: "13px 15px", fontFamily: "'Inter', -apple-system, sans-serif", transition: "border-color 0.18s, box-shadow 0.18s, transform 0.15s", display: "flex", gap: "11px", alignItems: "flex-start" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.boxShadow = "0 3px 16px rgba(99,102,241,0.09)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8edf5"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Avatar */}
      <div style={{ width: 36, height: 36, borderRadius: "9px", flexShrink: 0, background: `linear-gradient(135deg,${c1},${c2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff", boxShadow: `0 2px 6px ${c1}35`, userSelect: "none" }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Name */}
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", userSelect: "text" }}>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</span>
          {doctor.credential && <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: "11px" }}>{doctor.credential}</span>}
          <button className="contact-copy-btn" title="Copy name" onClick={e => copyToClipboard(displayName + (doctor.credential ? ", " + doctor.credential : ""), e.currentTarget)}>⎘</button>
        </div>

        {/* Specialty */}
        {doctor.taxonomyDescription && (
          <div style={{ fontSize: "11px", color: "#6366f1", fontWeight: 500, marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", userSelect: "text" }}>
            {doctor.taxonomyDescription}
          </div>
        )}

        {/* Taxonomy code */}
        {doctor.taxonomyCode && (
          <div style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "10px", fontFamily: "monospace", background: "rgba(99,102,241,0.07)", color: "#6366f1", padding: "2px 6px", borderRadius: "5px", border: "1px solid rgba(99,102,241,0.14)", userSelect: "text" }}>
              {doctor.taxonomyCode}
            </span>
            <button className="contact-copy-btn" title="Copy taxonomy code" onClick={e => copyToClipboard(doctor.taxonomyCode!, e.currentTarget)}>⎘</button>
          </div>
        )}

        {/* NPI */}
        {doctor.npi && (
          <div style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px", userSelect: "text" }}>
            <span style={{ fontFamily: "monospace" }}>NPI: {doctor.npi}</span>
            <button className="contact-copy-btn" title="Copy NPI" onClick={e => copyToClipboard(doctor.npi, e.currentTarget)}>⎘</button>
          </div>
        )}

        {/* Address */}
        {address && (
          <div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px", userSelect: "text" }}>
            <span>{address}</span>
            <button className="contact-copy-btn" title="Copy address" onClick={e => copyToClipboard(address, e.currentTarget)}>⎘</button>
          </div>
        )}

        {doctor.distance != null && (
          <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 500, marginTop: "2px", userSelect: "text" }}>
            📍 {doctor.distance} km away
          </div>
        )}

        {/* Phone + Email */}
        <div style={{ display: "flex", gap: "12px", marginTop: "5px", flexWrap: "wrap" }}>
          {doctor.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <span className="contact-field" style={{ fontSize: "11px", color: "#94a3b8" }}>📞 {doctor.phone}</span>
              <button className="contact-copy-btn" title="Copy phone" onClick={e => copyToClipboard(doctor.phone!, e.currentTarget)}>⎘</button>
              <button className="contact-copy-btn" title="Dial" style={{ fontSize: "10px" }} onClick={() => window.open("tel:" + doctor.phone)}>↗</button>
            </div>
          )}
          {doctor.email && (
            <div style={{ display: "flex", alignItems: "center", gap: "3px", minWidth: 0 }}>
              <span className="contact-field" style={{ fontSize: "11px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>✉️ {doctor.email}</span>
              <button className="contact-copy-btn" title="Copy email" onClick={e => copyToClipboard(doctor.email!, e.currentTarget)}>⎘</button>
              <button className="contact-copy-btn" title="Send email" style={{ fontSize: "10px" }} onClick={() => window.open("mailto:" + doctor.email)}>↗</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}