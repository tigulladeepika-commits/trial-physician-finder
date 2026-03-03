"use client";

import { useEffect, useRef, useState } from "react";
import { Trial, Physician } from "../types";

type Props = {
  trial: Trial;
  physicians: Physician[];
};

// Keys from environment variables only — never hardcoded
const MQ_KEY = process.env.NEXT_PUBLIC_MAPQUEST_KEY ?? "";
const GEO_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY ?? "";

declare global {
  interface Window { L: any; MQ: any; }
}

// Geocode a city+state using Geoapify (free tier, no MapQuest credits used)
async function geocode(city: string, state: string): Promise<[number, number] | null> {
  if (!GEO_KEY) return null;
  try {
    const q = encodeURIComponent(city + ", " + state + ", USA");
    const url = "https://api.geoapify.com/v1/geocode/search?text=" + q + "&limit=1&apiKey=" + GEO_KEY;
    const res = await fetch(url);
    const data = await res.json();
    const f = data?.features?.[0];
    if (!f) return null;
    const [lon, lat] = f.geometry.coordinates;
    return [lat, lon];
  } catch {
    return null;
  }
}

function loadMapQuest(): Promise<void> {
  return new Promise((resolve) => {
    if (window.MQ && window.L) { resolve(); return; }
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
        window.MQ.key = MQ_KEY;
        resolve();
      }
    }, 50);
  });
}

// Haversine distance in km between two lat/lon points
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function PhysicianTrialMap({ trial, physicians }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [radius, setRadius] = useState(50);
  const [isClient, setIsClient] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  // Find the best center point: prefer trial location with lat/lon, else geocode first US location
  const [center, setCenter] = useState<[number, number]>([39.5, -98.35]);

  useEffect(() => {
    const directLoc = trial.locations?.find(l => l.lat && l.lon && l.country === "United States");
    if (directLoc) {
      setCenter([directLoc.lat!, directLoc.lon!]);
      return;
    }
    // Fallback: geocode the first US location via Geoapify
    const firstUS = trial.locations?.find(l => l.country === "United States" && l.city && l.state);
    if (firstUS && GEO_KEY) {
      setGeocoding(true);
      geocode(firstUS.city, firstUS.state).then(coords => {
        if (coords) setCenter(coords);
        setGeocoding(false);
      });
    }
  }, [trial]);

  // Build and render the map
  useEffect(() => {
    if (!isClient || geocoding) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      await loadMapQuest();
      if (cancelled || !mapRef.current) return;

      // Destroy previous instance
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        circleRef.current = null;
        markersRef.current = [];
      }
      const container = mapRef.current;
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }

      const L = window.L;
      window.MQ.key = MQ_KEY;

      const map = L.mapquest.map(container, {
        center: { lat: center[0], lng: center[1] },
        layers: L.mapquest.tileLayer("map"),
        zoom: 9,
      });
      mapInstance.current = map;

      // Geocode trial locations that are missing lat/lon
      const trialLocations: Array<{ lat: number; lon: number; city: string; state: string; facility: string }> = [];

      for (const loc of trial.locations ?? []) {
        if (loc.country !== "United States") continue;
        if (loc.lat && loc.lon) {
          trialLocations.push({ lat: loc.lat, lon: loc.lon, city: loc.city ?? "", state: loc.state ?? "", facility: loc.facility ?? "" });
        } else if (loc.city && loc.state && GEO_KEY) {
          const coords = await geocode(loc.city, loc.state);
          if (coords) trialLocations.push({ lat: coords[0], lon: coords[1], city: loc.city, state: loc.state, facility: loc.facility ?? "" });
        }
        if (cancelled) return;
      }

      // Add trial site markers (blue)
      for (const loc of trialLocations) {
        const marker = L.marker([loc.lat, loc.lon], {
          icon: L.mapquest.icons.marker({ primaryColor: "#6366f1", secondaryColor: "#c7d2fe", size: "sm" }),
        })
          .addTo(map)
          .bindPopup(
            "<div style='max-width:180px;font-family:sans-serif'>" +
            "<strong style='font-size:11px;color:#6366f1'>🏥 Trial Site</strong><br/>" +
            "<span style='font-size:11px'>" + (loc.facility || "") + "</span><br/>" +
            "<span style='font-size:10px;color:#6b7280'>" + [loc.city, loc.state].filter(Boolean).join(", ") + "</span>" +
            "</div>"
          );
        markersRef.current.push(marker);
      }

      // Add radius circle centered on first trial site (or map center)
      const circleCenter = trialLocations[0]
        ? [trialLocations[0].lat, trialLocations[0].lon]
        : center;

      circleRef.current = L.circle(circleCenter, {
        radius: radius * 1000,
        color: "#6366f1",
        fillColor: "#c7d2fe",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "6 4",
      }).addTo(map);

      // Add physician markers — only those within radius
      for (const doc of physicians) {
        let lat = doc.lat;
        let lon = doc.lon;

        // If physician has no coords, geocode via Geoapify
        if ((!lat || !lon) && doc.city && doc.state && GEO_KEY) {
          const coords = await geocode(doc.city, doc.state);
          if (coords) { lat = coords[0]; lon = coords[1]; }
        }
        if (!lat || !lon) continue;
        if (cancelled) return;

        // Radius filter: check distance from circle center
        const distKm = haversineKm(circleCenter[0] as number, circleCenter[1] as number, lat, lon);
        if (distKm > radius) continue;

        const marker = L.marker([lat, lon], {
          icon: L.mapquest.icons.marker({ primaryColor: "#10b981", secondaryColor: "#a7f3d0", size: "sm" }),
        })
          .addTo(map)
          .bindPopup(
            "<div style='max-width:190px;font-family:sans-serif'>" +
            "<strong style='font-size:11px;color:#10b981'>👨‍⚕️ " + doc.name + "</strong><br/>" +
            "<span style='font-size:11px'>" + (doc.specialty ?? "") + "</span><br/>" +
            (doc.taxonomyCode ? "<span style='font-size:10px;color:#6b7280;font-family:monospace'>" + doc.taxonomyCode + "</span><br/>" : "") +
            "<span style='font-size:10px;color:#6b7280'>" + [doc.city, doc.state].filter(Boolean).join(", ") + "</span><br/>" +
            "<span style='font-size:10px;color:#10b981'>📍 " + Math.round(distKm) + " km away</span>" +
            "</div>"
          );
        markersRef.current.push(marker);
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        circleRef.current = null;
        markersRef.current = [];
      }
    };
  }, [trial, physicians, isClient, center, geocoding]);

  // Update circle radius without rebuilding map
  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(radius * 1000);
  }, [radius]);

  const mapHeader = (
    <div style={{
      background: "#fff",
      padding: "12px 18px",
      borderBottom: "1px solid #e8edf5",
      display: "flex", alignItems: "center",
      gap: "16px", flexWrap: "wrap",
    }}>
      <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", fontFamily: "'DM Sans', sans-serif" }}>
        🗺️ Map View
      </span>
      <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "#64748b" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
          Trial Sites
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          Physicians
        </span>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
        <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>
          Radius:{" "}
          <strong style={{ color: "#6366f1" }}>{radius} km</strong>
        </label>
        <input
          type="range" min={10} max={300} step={10} value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          style={{ width: "110px", accentColor: "#6366f1" }}
        />
      </div>
    </div>
  );

  if (!isClient) {
    return (
      <div style={{ border: "1.5px solid #e8edf5", borderRadius: "14px", overflow: "hidden" }}>
        {mapHeader}
        <div style={{ height: "420px", background: "#f8faff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#94a3b8", fontSize: "13px" }}>Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: "1.5px solid #e8edf5", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 16px rgba(99,102,241,0.07)" }}>
      {mapHeader}
      {geocoding && (
        <div style={{ padding: "8px 18px", background: "#f8faff", fontSize: "12px", color: "#6366f1", borderBottom: "1px solid #e8edf5" }}>
          ⏳ Geocoding trial locations...
        </div>
      )}
      <div ref={mapRef} style={{ height: "420px", width: "100%" }} />
    </div>
  );
}