"use client";

/**
 * PLACE THIS FILE AT: frontend/app/components/PhysicianTrialMap.tsx
 *
 * Geocoding: Geoapify ONLY (via ../utils/geocode)
 * Map tiles + markers: MapQuest ONLY
 * MapQuest is never called for geocoding.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Trial, Physician } from "../types";
import { geocodeCity, haversineKm } from "../utils/geocode";

type Props = { trial: Trial; physicians: Physician[] };

const MQ_KEY = process.env.NEXT_PUBLIC_MAPQUEST_KEY ?? "";

declare global {
  interface Window { L: any; MQ: any; }
}

// Singleton loader — prevents the MapQuest SDK being loaded more than once
let _mqLoading = false;
let _mqLoaded = false;
const _mqQueue: Array<() => void> = [];

function loadMapQuestSDK(): Promise<void> {
  return new Promise((resolve) => {
    if (_mqLoaded && window.MQ && window.L) { resolve(); return; }
    _mqQueue.push(resolve);
    if (_mqLoading) return;
    _mqLoading = true;

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
        _mqLoaded = true;
        _mqLoading = false;
        window.MQ.key = MQ_KEY;
        _mqQueue.forEach(cb => cb());
        _mqQueue.length = 0;
      }
    }, 50);
  });
}

type LocPoint = {
  lat: number;
  lon: number;
  city: string;
  state: string;
  facility: string;
};

export default function PhysicianTrialMap({ trial, physicians }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [radius, setRadius] = useState(50);
  const [mapStatus, setMapStatus] = useState<"loading" | "geocoding" | "ready" | "error">("loading");

  const buildMap = useCallback(async () => {
    if (!containerRef.current) return;
    setMapStatus("loading");

    // Step 1 — load MapQuest SDK (tiles + marker icons only, NOT geocoding)
    try {
      await loadMapQuestSDK();
    } catch {
      setMapStatus("error");
      return;
    }

    if (!containerRef.current) return;

    // Step 2 — safely destroy any previous Leaflet instance
    if (mapRef.current) {
      try { mapRef.current.remove(); } catch { /* ignore */ }
      mapRef.current = null;
      circleRef.current = null;
    }
    const el = containerRef.current;
    (el as any)._leaflet_id = null;
    el.innerHTML = "";

    // Step 3 — resolve coordinates for US trial locations using Geoapify
    setMapStatus("geocoding");
    const trialPoints: LocPoint[] = [];

    for (const loc of trial.locations ?? []) {
      if (loc.country !== "United States") continue;

      if (loc.lat && loc.lon) {
        // coords already in API response — use directly, no geocoding needed
        trialPoints.push({
          lat: loc.lat,
          lon: loc.lon,
          city: loc.city ?? "",
          state: loc.state ?? "",
          facility: loc.facility ?? "",
        });
      } else if (loc.city && loc.state) {
        // coords missing — resolve via Geoapify (not MapQuest)
        const coords = await geocodeCity(loc.city, loc.state);
        if (coords) {
          trialPoints.push({
            lat: coords[0],
            lon: coords[1],
            city: loc.city,
            state: loc.state,
            facility: loc.facility ?? "",
          });
        }
      }
    }

    // Step 4 — compute map center from bounding box of all trial points
    let centerLat = 39.5;   // US geographic center fallback
    let centerLon = -98.35;
    let zoom = 4;

    if (trialPoints.length === 1) {
      centerLat = trialPoints[0].lat;
      centerLon = trialPoints[0].lon;
      zoom = 9;
    } else if (trialPoints.length > 1) {
      const lats = trialPoints.map(p => p.lat);
      const lons = trialPoints.map(p => p.lon);
      centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
      zoom = 5;
    }

    if (!containerRef.current) return;

    // Step 5 — initialize MapQuest map (tiles only)
    const L = window.L;
    window.MQ.key = MQ_KEY;

    const map = L.mapquest.map(containerRef.current, {
      center: { lat: centerLat, lng: centerLon },
      layers: L.mapquest.tileLayer("map"),
      zoom,
    });
    mapRef.current = map;

    // Step 6 — place trial site markers (blue/indigo)
    for (const loc of trialPoints) {
      L.marker([loc.lat, loc.lon], {
        icon: L.mapquest.icons.marker({
          primaryColor: "#6366f1",
          secondaryColor: "#c7d2fe",
          size: "sm",
        }),
      })
        .addTo(map)
        .bindPopup(
          "<div style='max-width:190px;font-family:Inter,sans-serif;font-size:12px'>" +
          "<strong style='color:#6366f1'>🏥 Trial Site</strong><br/>" +
          (loc.facility ? "<span>" + loc.facility + "</span><br/>" : "") +
          "<span style='color:#64748b'>" +
          [loc.city, loc.state].filter(Boolean).join(", ") +
          "</span></div>"
        );
    }

    // Step 7 — draw radius circle around first trial site
    const circleLat = trialPoints[0]?.lat ?? centerLat;
    const circleLon = trialPoints[0]?.lon ?? centerLon;

    circleRef.current = L.circle([circleLat, circleLon], {
      radius: radius * 1000,
      color: "#6366f1",
      fillColor: "#c7d2fe",
      fillOpacity: 0.1,
      weight: 2,
      dashArray: "6 4",
    }).addTo(map);

    // Step 8 — place physician markers
    // If physician has no lat/lon → geocode via Geoapify only
    // Then filter by haversine distance against radius
    for (const doc of physicians) {
      let lat = doc.lat;
      let lon = doc.lon;

      if ((!lat || !lon) && doc.city && doc.state) {
        const coords = await geocodeCity(doc.city, doc.state);
        if (coords) {
          lat = coords[0];
          lon = coords[1];
        }
      }

      if (!lat || !lon) continue;

      const distKm = haversineKm(circleLat, circleLon, lat, lon);
      if (distKm > radius) continue;

      L.marker([lat, lon], {
        icon: L.mapquest.icons.marker({
          primaryColor: "#10b981",
          secondaryColor: "#a7f3d0",
          size: "sm",
        }),
      })
        .addTo(map)
        .bindPopup(
          "<div style='max-width:190px;font-family:Inter,sans-serif;font-size:12px'>" +
          "<strong style='color:#10b981'>👨‍⚕️ " + doc.name + "</strong><br/>" +
          (doc.specialty ? "<span>" + doc.specialty + "</span><br/>" : "") +
          (doc.taxonomyCode
            ? "<span style='color:#6366f1;font-family:monospace;font-size:10px'>" +
              doc.taxonomyCode + "</span><br/>"
            : "") +
          "<span style='color:#64748b'>" +
          [doc.city, doc.state].filter(Boolean).join(", ") +
          "</span><br/>" +
          "<span style='color:#10b981'>📍 " + Math.round(distKm) + " km away</span>" +
          "</div>"
        );
    }

    // Step 9 — force tile recalculation to fix the blank-map bug
    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 250);

    setMapStatus("ready");
  }, [trial, physicians]);

  // Rebuild map when trial or physicians change
  useEffect(() => {
    buildMap();
    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* ignore */ }
        mapRef.current = null;
        circleRef.current = null;
      }
    };
  }, [buildMap]);

  // Update only the radius circle — no full rebuild needed
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius * 1000);
    }
  }, [radius]);

  return (
    <div style={{
      border: "1.5px solid #dde5f5",
      borderRadius: "14px",
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(99,102,241,0.06)",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── Header bar ── */}
      <div style={{
        background: "#fff",
        padding: "11px 16px",
        borderBottom: "1px solid #e8edf5",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        flexWrap: "wrap",
      }}>
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
          <input
            type="range"
            min={10} max={300} step={10}
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            style={{ width: "100px", accentColor: "#6366f1" }}
          />
        </div>
      </div>

      {/* ── Loading / geocoding overlay ── */}
      {(mapStatus === "loading" || mapStatus === "geocoding") && (
        <div style={{
          height: "420px",
          background: "#f8faff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}>
          <style>{`@keyframes geo-spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{
            width: 32, height: 32,
            border: "3px solid rgba(99,102,241,0.15)",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "geo-spin 0.75s linear infinite",
          }} />
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            {mapStatus === "geocoding"
              ? "Locating trial sites via Geoapify..."
              : "Loading map..."}
          </span>
        </div>
      )}

      {/* ── Error overlay ── */}
      {mapStatus === "error" && (
        <div style={{
          height: "200px",
          background: "#fef2f2",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}>
          <span style={{ fontSize: "18px" }}>⚠️</span>
          <span style={{ fontSize: "13px", color: "#dc2626", textAlign: "center", padding: "0 24px" }}>
            Map failed to load. Verify NEXT_PUBLIC_MAPQUEST_KEY and NEXT_PUBLIC_GEOAPIFY_KEY in your environment variables.
          </span>
        </div>
      )}

      {/* ── Map container ── always in DOM so ref stays valid ── */}
      <div
        ref={containerRef}
        style={{
          height: "420px",
          width: "100%",
          display: mapStatus === "ready" ? "block" : "none",
        }}
      />
    </div>
  );
}