"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Trial, Physician } from "../types";

type Props = { trial: Trial; physicians: Physician[] };

const MQ_KEY = process.env.NEXT_PUBLIC_MAPQUEST_KEY ?? "";
const GEO_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY ?? "";

declare global { interface Window { L: any; MQ: any; } }

// In-memory geocode cache - persists across map re-renders
const geoCache = new Map<string, [number, number] | null>();

async function geocodeSingle(city: string, state: string): Promise<[number, number] | null> {
  const key = city.toLowerCase() + "," + state.toLowerCase();
  if (geoCache.has(key)) return geoCache.get(key)!;
  if (!GEO_KEY) { geoCache.set(key, null); return null; }
  try {
    const q = encodeURIComponent(city + ", " + state + ", USA");
    const res = await fetch(
      "https://api.geoapify.com/v1/geocode/search?text=" + q + "&limit=1&apiKey=" + GEO_KEY
    );
    const data = await res.json();
    const f = data?.features?.[0];
    if (!f) { geoCache.set(key, null); return null; }
    const [lon, lat] = f.geometry.coordinates;
    const result: [number, number] = [lat, lon];
    geoCache.set(key, result);
    return result;
  } catch { geoCache.set(key, null); return null; }
}

// Batch geocode all unique city+state pairs in parallel chunks of 5
async function batchGeocode(locs: Array<{ city: string; state: string }>) {
  const unique = new Map<string, { city: string; state: string }>();
  for (const loc of locs) {
    const key = loc.city.toLowerCase() + "," + loc.state.toLowerCase();
    if (!geoCache.has(key)) unique.set(key, loc);
  }
  const entries = Array.from(unique.values());
  const CHUNK = 5;
  for (let i = 0; i < entries.length; i += CHUNK) {
    await Promise.all(
      entries.slice(i, i + CHUNK).map(loc => geocodeSingle(loc.city, loc.state))
    );
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// MapQuest SDK singleton loader
let mqState: "idle" | "loading" | "ready" = "idle";
const mqQueue: Array<() => void> = [];

function loadMapQuest(): Promise<void> {
  return new Promise((resolve) => {
    if (mqState === "ready" && window.MQ && window.L) { resolve(); return; }
    mqQueue.push(resolve);
    if (mqState === "loading") return;
    mqState = "loading";
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
        mqState = "ready";
        window.MQ.key = MQ_KEY;
        mqQueue.forEach(cb => cb());
        mqQueue.length = 0;
      }
    }, 50);
  });
}

export default function PhysicianTrialMap({ trial, physicians }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [radius, setRadius] = useState(50);
  const [phase, setPhase] = useState<"idle" | "geocoding" | "rendering" | "ready" | "error">("idle");

  const buildMap = useCallback(async () => {
    if (!containerRef.current) return;

    // STEP 1: Collect all locations needing geocoding
    setPhase("geocoding");

    type LocPoint = { lat: number; lon: number; city: string; state: string; facility: string };
    const trialPoints: LocPoint[] = [];
    const needGeo: Array<{ city: string; state: string }> = [];

    for (const loc of trial.locations ?? []) {
      if (loc.country !== "United States") continue;
      if (loc.lat && loc.lon) {
        trialPoints.push({ lat: loc.lat, lon: loc.lon, city: loc.city ?? "", state: loc.state ?? "", facility: loc.facility ?? "" });
      } else if (loc.city && loc.state) {
        needGeo.push({ city: loc.city, state: loc.state });
      }
    }

    // Only geocode physicians that truly have no coords
    const physNeedGeo: Array<{ city: string; state: string }> = [];
    for (const doc of physicians) {
      if (!doc.lat || !doc.lon) {
        if (doc.city && doc.state) physNeedGeo.push({ city: doc.city, state: doc.state });
      }
    }

    // Batch geocode everything at once (deduped, parallel)
    await batchGeocode([...needGeo, ...physNeedGeo]);

    // Resolve geocoded trial sites
    for (const loc of needGeo) {
      const coords = geoCache.get(loc.city.toLowerCase() + "," + loc.state.toLowerCase());
      if (coords) {
        const src = trial.locations?.find(l => l.city === loc.city && l.state === loc.state);
        trialPoints.push({ lat: coords[0], lon: coords[1], city: loc.city, state: loc.state, facility: src?.facility ?? "" });
      }
    }

    // Build physician coord lookup
    const physCoords = new Map<string, [number, number]>();
    for (const doc of physicians) {
      if (doc.lat && doc.lon) {
        physCoords.set(doc.npi, [doc.lat, doc.lon]);
      } else if (doc.city && doc.state) {
        const coords = geoCache.get(doc.city.toLowerCase() + "," + doc.state.toLowerCase());
        if (coords) physCoords.set(doc.npi, coords);
      }
    }

    // STEP 2: All coords ready — now render the map
    setPhase("rendering");

    try { await loadMapQuest(); } catch { setPhase("error"); return; }
    if (!containerRef.current) return;

    // Destroy previous map cleanly
    if (mapRef.current) {
      try { mapRef.current.remove(); } catch {}
      mapRef.current = null; circleRef.current = null;
    }
    const el = containerRef.current;
    (el as any)._leaflet_id = null;
    el.innerHTML = "";

    // Determine center + zoom
    let cLat = 39.5, cLon = -98.35, zoom = 4;
    if (trialPoints.length === 1) { cLat = trialPoints[0].lat; cLon = trialPoints[0].lon; zoom = 9; }
    else if (trialPoints.length > 1) { cLat = trialPoints[0].lat; cLon = trialPoints[0].lon; zoom = 6; }

    const L = window.L;
    window.MQ.key = MQ_KEY;

    const map = L.mapquest.map(el, {
      center: { lat: cLat, lng: cLon },
      layers: L.mapquest.tileLayer("map"),
      zoom,
    });
    mapRef.current = map;

    // Trial site markers (indigo)
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

    // Radius circle
    const rLat = trialPoints[0]?.lat ?? cLat;
    const rLon = trialPoints[0]?.lon ?? cLon;
    circleRef.current = L.circle([rLat, rLon], {
      radius: radius * 1000,
      color: "#6366f1", fillColor: "#c7d2fe",
      fillOpacity: 0.1, weight: 2, dashArray: "6 4",
    }).addTo(map);

    // Physician markers (green) — filtered by radius
    for (const doc of physicians) {
      const coords = physCoords.get(doc.npi);
      if (!coords) continue;
      const distKm = haversineKm(rLat, rLon, coords[0], coords[1]);
      if (distKm > radius) continue;
      L.marker([coords[0], coords[1]], {
        icon: L.mapquest.icons.marker({ primaryColor: "#10b981", secondaryColor: "#a7f3d0", size: "sm" }),
      }).addTo(map).bindPopup(
        "<div style='max-width:190px;font-family:Inter,sans-serif;font-size:12px'>" +
        "<strong style='color:#10b981'>👨‍⚕️ " + doc.name + "</strong><br/>" +
        (doc.specialty ? "<span>" + doc.specialty + "</span><br/>" : "") +
        (doc.taxonomyCode ? "<span style='font-family:monospace;font-size:10px;color:#64748b'>" + doc.taxonomyCode + "</span><br/>" : "") +
        "<span style='color:#64748b'>" + [doc.city, doc.state].filter(Boolean).join(", ") + "</span><br/>" +
        "<span style='color:#10b981'>📍 " + Math.round(distKm) + " km away</span>" +
        "</div>"
      );
    }

    // Fix blank tiles after DOM is visible
    setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 150);
    setPhase("ready");
  }, [trial, physicians]);

  useEffect(() => {
    buildMap();
    return () => {
      if (mapRef.current) { try { mapRef.current.remove(); } catch {} mapRef.current = null; circleRef.current = null; }
    };
  }, [buildMap]);

  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(radius * 1000);
  }, [radius]);

  const isLoading = phase === "geocoding" || phase === "rendering";

  return (
    <div style={{ border: "1.5px solid #dde5f5", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 12px rgba(99,102,241,0.06)", fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", padding: "11px 16px", borderBottom: "1px solid #e8edf5", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>🗺️ Map View</span>
        <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#64748b" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />Trial Sites
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />Physicians
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

      {/* Loading */}
      {isLoading && (
        <div style={{ height: "420px", background: "#f8faff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <style>{`@keyframes mq-spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(99,102,241,0.15)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "mq-spin 0.7s linear infinite" }} />
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            {phase === "geocoding" ? "Resolving locations..." : "Rendering map..."}
          </span>
        </div>
      )}

      {phase === "error" && (
        <div style={{ height: "140px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "13px", color: "#dc2626" }}>Failed to load map. Check your API keys.</span>
        </div>
      )}

      {/* Map canvas — always in DOM so ref stays valid */}
      <div ref={containerRef} style={{ height: "420px", width: "100%", display: phase === "ready" ? "block" : "none" }} />
    </div>
  );
}