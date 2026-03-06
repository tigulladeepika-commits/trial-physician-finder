"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Trial, Physician } from "../types";
import { geocodeCity, haversineKm } from "../utils/geocode";

type Props = {
  trial: Trial;
  physicians: Physician[];
  searchCity?: string;
  searchState?: string;
};

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

declare global { interface Window { L: any; } }

function makeIcon(L: any, color: string, border: string, opacity = 1) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36" opacity="${opacity}">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="${border}" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36] });
}

type LocPoint = { lat: number; lon: number; city: string; state: string; facility: string; };

export default function PhysicianTrialMap({ trial, physicians, searchCity, searchState }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const circleRef    = useRef<any>(null);
  const physicianLayersRef = useRef<any[]>([]);
  const circleCenterRef = useRef<[number, number]>([0, 0]);

  const [radius,    setRadius]    = useState(50);
  const [mapStatus, setMapStatus] = useState<"loading" | "geocoding" | "ready" | "error">("loading");
  const [statusMsg, setStatusMsg] = useState("Loading map...");

  const buildMap = useCallback(async () => {
    if (!containerRef.current) return;
    setMapStatus("loading");
    setStatusMsg("Loading map...");

    if (mapRef.current) {
      try { mapRef.current.remove(); } catch { /* ignore */ }
      mapRef.current = null;
      circleRef.current = null;
      physicianLayersRef.current = [];
    }
    const el = containerRef.current;
    (el as any)._leaflet_id = null;
    el.innerHTML = "";

    const L = window.L;
    if (!L) { setMapStatus("error"); setStatusMsg("Map library not loaded."); return; }

    setMapStatus("geocoding");
    setStatusMsg("Locating trial sites...");

    // ── Geocode trial site locations ──────────────────────────────────────
    const trialPoints: LocPoint[] = [];
    for (const loc of trial.locations ?? []) {
      if (loc.country !== "United States") continue;
      if (loc.lat && loc.lon) {
        trialPoints.push({ lat: loc.lat, lon: loc.lon, city: loc.city ?? "", state: loc.state ?? "", facility: loc.facility ?? "" });
      } else if (loc.city && loc.state) {
        const coords = await geocodeCity(loc.city, loc.state);
        if (coords) trialPoints.push({ lat: coords[0], lon: coords[1], city: loc.city, state: loc.state, facility: loc.facility ?? "" });
      }
    }

    // ── Radius circle center ──────────────────────────────────────────────
    let circleLat: number;
    let circleLon: number;

    if (searchCity || searchState) {
      setStatusMsg("Centering on your search location...");
      const searchCoords = await geocodeCity(searchCity || searchState || "", searchState || searchCity || "");
      if (searchCoords) {
        circleLat = searchCoords[0]; circleLon = searchCoords[1];
      } else {
        circleLat = trialPoints[0]?.lat ?? 39.5; circleLon = trialPoints[0]?.lon ?? -98.35;
      }
    } else {
      circleLat = trialPoints[0]?.lat ?? 39.5; circleLon = trialPoints[0]?.lon ?? -98.35;
    }

    circleCenterRef.current = [circleLat, circleLon];

    // ── Map center & zoom ─────────────────────────────────────────────────
    let centerLat = circleLat, centerLon = circleLon;
    let zoom = searchCity || searchState ? 8 : 4;

    if (!searchCity && !searchState) {
      if (trialPoints.length === 1) {
        centerLat = trialPoints[0].lat; centerLon = trialPoints[0].lon; zoom = 9;
      } else if (trialPoints.length > 1) {
        const lats = trialPoints.map(p => p.lat);
        const lons = trialPoints.map(p => p.lon);
        centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
        zoom = 5;
      }
    }

    if (!containerRef.current) return;

    const map = L.map(containerRef.current).setView([centerLat, centerLon], zoom);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(map);
    mapRef.current = map;

    // ── Trial site markers ────────────────────────────────────────────────
    for (const loc of trialPoints) {
      L.marker([loc.lat, loc.lon], { icon: makeIcon(L, "#6366f1", "#c7d2fe") })
        .addTo(map)
        .bindPopup(`<div style="max-width:190px;font-family:system-ui,sans-serif;font-size:12px">
          <strong style="color:#6366f1">🏥 Trial Site</strong><br/>
          ${loc.facility ? `<span>${loc.facility}</span><br/>` : ""}
          <span style="color:#64748b">${[loc.city, loc.state].filter(Boolean).join(", ")}</span>
        </div>`);
    }

    // ── Radius circle ─────────────────────────────────────────────────────
    circleRef.current = L.circle([circleLat, circleLon], {
      radius: radius * 1000,
      color: "#6366f1",
      fillColor: "#6366f1",
      fillOpacity: 0.08,
      weight: 2,
      dashArray: "6 4",
    }).addTo(map);

    // ── Search center marker ──────────────────────────────────────────────
    if (searchCity || searchState) {
      L.circleMarker([circleLat, circleLon], {
        radius: 7, color: "#6366f1", fillColor: "#6366f1", fillOpacity: 0.4, weight: 2,
      }).addTo(map)
        .bindPopup(`<div style="font-family:system-ui,sans-serif;font-size:12px">
          <strong style="color:#6366f1">📍 Search Location</strong><br/>
          <span style="color:#64748b">${[searchCity, searchState].filter(Boolean).join(", ")}</span>
        </div>`);
    }

    // ── Geocode ALL physicians by city+state ──────────────────────────────
    setStatusMsg("Placing physicians on map...");

    const physicianCoords = await Promise.all(
      physicians.map(async (p) => {
        if (p.lat && p.lon) return { p, lat: p.lat, lon: p.lon };
        if (p.city && p.state) {
          const coords = await geocodeCity(p.city, p.state);
          if (coords) return { p, lat: coords[0], lon: coords[1] };
        }
        return null;
      })
    );

    // Jitter so overlapping markers (same city) are all visible
    const jitter = () => (Math.random() - 0.5) * 0.008;

    physicianLayersRef.current = [];

    for (const result of physicianCoords) {
      if (!result) continue;
      const { p, lat, lon } = result;
      const distKm = haversineKm(circleLat, circleLon, lat, lon);
      const inRadius = distKm <= radius;

      // ── Inside radius: bright green | Outside radius: grey + faded ──────
      const icon = inRadius
        ? makeIcon(L, "#10b981", "#a7f3d0", 1)      // green, fully opaque
        : makeIcon(L, "#94a3b8", "#cbd5e1", 0.45);  // grey, faded

      const marker = L.marker([lat + jitter(), lon + jitter()], { icon })
        .addTo(map)
        .bindPopup(`<div style="max-width:190px;font-family:system-ui,sans-serif;font-size:12px">
          <strong style="color:${inRadius ? "#10b981" : "#64748b"}">
            ${inRadius ? "👨‍⚕️" : "👤"} ${p.name}
          </strong><br/>
          ${p.specialty ? `<span>${p.specialty}</span><br/>` : ""}
          ${p.taxonomyCode ? `<span style="color:#6366f1;font-family:monospace;font-size:10px">${p.taxonomyCode}</span><br/>` : ""}
          <span style="color:#64748b">${[p.city, p.state].filter(Boolean).join(", ")}</span><br/>
          <span style="color:${inRadius ? "#10b981" : "#94a3b8"}">
            📍 ${Math.round(distKm)} km · ${inRadius ? "Within radius" : "Outside radius"}
          </span>
        </div>`);

      physicianLayersRef.current.push({ marker, lat, lon, distKm, p });
    }

    requestAnimationFrame(() => { if (mapRef.current) mapRef.current.invalidateSize(); });
    const ro = new ResizeObserver(() => { if (mapRef.current) mapRef.current.invalidateSize(); });
    if (containerRef.current) ro.observe(containerRef.current);

    setMapStatus("ready");
  }, [trial, physicians, searchCity, searchState, radius]);

  useEffect(() => {
    buildMap();
    return () => {
      if (mapRef.current) { try { mapRef.current.remove(); } catch { /* ignore */ } mapRef.current = null; circleRef.current = null; }
    };
  }, [buildMap]);

  // ── Update circle + marker colors when radius slider changes ─────────────
  // No full rebuild — just update the circle radius and re-style markers
  useEffect(() => {
    if (!circleRef.current || !mapRef.current) return;
    circleRef.current.setRadius(radius * 1000);

    const L = window.L;
    if (!L) return;

    const [circleLat, circleLon] = circleCenterRef.current;

    for (const layer of physicianLayersRef.current) {
      const { marker, lat, lon } = layer;
      const distKm = haversineKm(circleLat, circleLon, lat, lon);
      const inRadius = distKm <= radius;
      const icon = inRadius
        ? makeIcon(L, "#10b981", "#a7f3d0", 1)
        : makeIcon(L, "#94a3b8", "#cbd5e1", 0.45);
      marker.setIcon(icon);
    }
  }, [radius]);

  return (
    <div style={{ border: "1.5px solid #dde5f5", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 12px rgba(99,102,241,0.06)", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", padding: "11px 16px", borderBottom: "1px solid #e8edf5", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>🗺️ Map View</span>
        <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#64748b" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} /> Trial Sites
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#10b981", display: "inline-block" }} /> Within radius
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#94a3b8", opacity: 0.5, display: "inline-block" }} /> Outside radius
          </span>
          {(searchCity || searchState) && (
            <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#6366f1" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#6366f1", opacity: 0.4, display: "inline-block" }} />
              {[searchCity, searchState].filter(Boolean).join(", ")}
            </span>
          )}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "9px" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
            Radius: <strong style={{ color: "#6366f1" }}>{radius} km</strong>
          </span>
          <input type="range" min={10} max={300} step={10} value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            style={{ width: "100px", accentColor: "#6366f1" }} />
        </div>
      </div>

      {/* Map area */}
      <div style={{ position: "relative", height: "420px" }}>
        {(mapStatus === "loading" || mapStatus === "geocoding") && (
          <div style={{ position: "absolute", inset: 0, background: "#f8faff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", zIndex: 10 }}>
            <div className="geo-spin-ring" />
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>{statusMsg}</span>
          </div>
        )}
        {mapStatus === "error" && (
          <div style={{ position: "absolute", inset: 0, background: "#fef2f2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", zIndex: 10 }}>
            <span style={{ fontSize: "18px" }}>⚠️</span>
            <span style={{ fontSize: "13px", color: "#dc2626", textAlign: "center", padding: "0 24px" }}>Map failed to load.</span>
            <button onClick={buildMap} style={{ marginTop: "8px", padding: "7px 18px", background: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>Retry</button>
          </div>
        )}
        <div ref={containerRef} style={{ height: "420px", width: "100%", visibility: mapStatus === "ready" ? "visible" : "hidden" }} />
      </div>
    </div>
  );
}