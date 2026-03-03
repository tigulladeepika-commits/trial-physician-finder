"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Trial, Physician } from "../types";

type Props = { trial: Trial; physicians: Physician[] };

const MQ_KEY = process.env.NEXT_PUBLIC_MAPQUEST_KEY ?? "";
const GEO_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY ?? "";

declare global { interface Window { L: any; MQ: any; } }

async function geocode(city: string, state: string): Promise<[number, number] | null> {
  if (!GEO_KEY) return null;
  try {
    const q = encodeURIComponent(city + ", " + state + ", USA");
    const res = await fetch(
      "https://api.geoapify.com/v1/geocode/search?text=" + q + "&limit=1&apiKey=" + GEO_KEY
    );
    const data = await res.json();
    const f = data?.features?.[0];
    if (!f) return null;
    const [lon, lat] = f.geometry.coordinates;
    return [lat, lon];
  } catch { return null; }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let mqLoading = false;
let mqLoaded = false;
const mqCallbacks: Array<() => void> = [];

function loadMapQuest(): Promise<void> {
  return new Promise((resolve) => {
    if (mqLoaded && window.MQ && window.L) { resolve(); return; }
    mqCallbacks.push(resolve);
    if (mqLoading) return;
    mqLoading = true;

    if (!document.querySelector('link[href*="mapquest"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.css";
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[src*="mapquest"]')) {
      const script = document.createElement("script");
      script.src = "https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.js";
      document.head.appendChild(script);
    }

    const iv = setInterval(() => {
      if (window.MQ && window.L) {
        clearInterval(iv);
        mqLoaded = true;
        mqLoading = false;
        window.MQ.key = MQ_KEY;
        mqCallbacks.forEach(cb => cb());
        mqCallbacks.length = 0;
      }
    }, 50);
  });
}

export default function PhysicianTrialMap({ trial, physicians }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [radius, setRadius] = useState(50);
  const [status, setStatus] = useState<"loading" | "geocoding" | "ready" | "error">("loading");

  const buildMap = useCallback(async () => {
    if (!containerRef.current) return;
    setStatus("loading");

    try {
      await loadMapQuest();
    } catch {
      setStatus("error"); return;
    }

    if (!containerRef.current) return;

    // Destroy old map properly
    if (mapRef.current) {
      try { mapRef.current.remove(); } catch {}
      mapRef.current = null;
      circleRef.current = null;
    }

    // Clear any leftover leaflet state on the DOM node
    const el = containerRef.current;
    (el as any)._leaflet_id = null;
    el.innerHTML = "";

    const L = window.L;
    window.MQ.key = MQ_KEY;

    // Determine center — prefer a trial location with coords, else geocode
    let centerLat = 39.5;
    let centerLon = -98.35;
    let zoom = 4;

    setStatus("geocoding");

    // Collect all US trial locations with coords (geocode missing ones)
    type LocPoint = { lat: number; lon: number; city: string; state: string; facility: string };
    const trialPoints: LocPoint[] = [];

    for (const loc of trial.locations ?? []) {
      if (loc.country !== "United States") continue;
      if (loc.lat && loc.lon) {
        trialPoints.push({ lat: loc.lat, lon: loc.lon, city: loc.city ?? "", state: loc.state ?? "", facility: loc.facility ?? "" });
      } else if (loc.city && loc.state && GEO_KEY) {
        const coords = await geocode(loc.city, loc.state);
        if (coords) trialPoints.push({ lat: coords[0], lon: coords[1], city: loc.city, state: loc.state, facility: loc.facility ?? "" });
      }
    }

    if (trialPoints.length > 0) {
      centerLat = trialPoints[0].lat;
      centerLon = trialPoints[0].lon;
      zoom = trialPoints.length === 1 ? 9 : 6;
    } else {
      // Try geocoding the first US city/state
      const firstUS = trial.locations?.find(l => l.country === "United States" && l.city && l.state);
      if (firstUS && GEO_KEY) {
        const coords = await geocode(firstUS.city, firstUS.state);
        if (coords) { centerLat = coords[0]; centerLon = coords[1]; zoom = 9; }
      }
    }

    if (!containerRef.current) return;

    // Init map
    const map = L.mapquest.map(containerRef.current, {
      center: { lat: centerLat, lng: centerLon },
      layers: L.mapquest.tileLayer("map"),
      zoom,
    });
    mapRef.current = map;

    // Trial site markers (blue/indigo)
    for (const loc of trialPoints) {
      L.marker([loc.lat, loc.lon], {
        icon: L.mapquest.icons.marker({ primaryColor: "#6366f1", secondaryColor: "#c7d2fe", size: "sm" }),
      }).addTo(map).bindPopup(
        "<div style='max-width:190px;font-family:Inter,sans-serif;font-size:12px'>" +
        "<strong style='color:#6366f1'>🏥 Trial Site</strong><br/>" +
        (loc.facility ? "<span>" + loc.facility + "</span><br/>" : "") +
        "<span style='color:#64748b'>" + [loc.city, loc.state].filter(Boolean).join(", ") + "</span>" +
        "</div>"
      );
    }

    // Radius circle from first trial site
    const circleCenterLat = trialPoints[0]?.lat ?? centerLat;
    const circleCenterLon = trialPoints[0]?.lon ?? centerLon;

    circleRef.current = L.circle([circleCenterLat, circleCenterLon], {
      radius: radius * 1000,
      color: "#6366f1",
      fillColor: "#c7d2fe",
      fillOpacity: 0.1,
      weight: 2,
      dashArray: "6 4",
    }).addTo(map);

    // Physician markers — geocode if needed, filter by radius
    for (const doc of physicians) {
      let lat = doc.lat;
      let lon = doc.lon;
      if ((!lat || !lon) && doc.city && doc.state && GEO_KEY) {
        const coords = await geocode(doc.city, doc.state);
        if (coords) { lat = coords[0]; lon = coords[1]; }
      }
      if (!lat || !lon) continue;

      const distKm = haversineKm(circleCenterLat, circleCenterLon, lat, lon);
      if (distKm > radius) continue;

      L.marker([lat, lon], {
        icon: L.mapquest.icons.marker({ primaryColor: "#10b981", secondaryColor: "#a7f3d0", size: "sm" }),
      }).addTo(map).bindPopup(
        "<div style='max-width:190px;font-family:Inter,sans-serif;font-size:12px'>" +
        "<strong style='color:#10b981'>👨‍⚕️ " + doc.name + "</strong><br/>" +
        (doc.specialty ? "<span>" + doc.specialty + "</span><br/>" : "") +
        (doc.taxonomyCode ? "<span style='color:#64748b;font-family:monospace;font-size:10px'>" + doc.taxonomyCode + "</span><br/>" : "") +
        "<span style='color:#64748b'>" + [doc.city, doc.state].filter(Boolean).join(", ") + "</span><br/>" +
        "<span style='color:#10b981'>📍 " + Math.round(distKm) + " km away</span>" +
        "</div>"
      );
    }

    // Force map to recalculate size (fixes blank tile issue)
    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 200);

    setStatus("ready");
  }, [trial, physicians]);

  useEffect(() => {
    buildMap();
    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
        circleRef.current = null;
      }
    };
  }, [buildMap]);

  // Update radius circle without rebuilding the whole map
  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(radius * 1000);
  }, [radius]);

  return (
    <div style={{ border: "1.5px solid #dde5f5", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 12px rgba(99,102,241,0.06)", fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", padding: "11px 16px", borderBottom: "1px solid #e8edf5", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>🗺️ Map View</span>
        <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#64748b" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
            Trial Sites
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            Physicians
          </span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "9px" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
            Radius: <strong style={{ color: "#6366f1" }}>{radius} km</strong>
          </span>
          <input type="range" min={10} max={300} step={10} value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            style={{ width: "100px", accentColor: "#6366f1" }}
          />
        </div>
      </div>

      {/* Status overlays */}
      {(status === "loading" || status === "geocoding") && (
        <div style={{ height: "420px", background: "#f8faff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(99,102,241,0.15)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "tc-spin 0.75s linear infinite" }} />
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            {status === "geocoding" ? "Locating trial sites..." : "Loading map..."}
          </span>
        </div>
      )}

      {status === "error" && (
        <div style={{ height: "200px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "13px", color: "#dc2626" }}>Failed to load map. Check your API keys.</span>
        </div>
      )}

      {/* Map container — always in DOM so ref stays valid */}
      <div
        ref={containerRef}
        style={{
          height: "420px",
          width: "100%",
          display: status === "ready" ? "block" : "none",
        }}
      />
    </div>
  );
}