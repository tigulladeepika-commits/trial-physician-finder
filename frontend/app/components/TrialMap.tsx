"use client";

import { useEffect, useRef, useState } from "react";
import { Trial } from "../types";

type Props = {
  trials: Trial[];
  searchedCity?: string;
  searchedState?: string;
};

const MQ_KEY = process.env.NEXT_PUBLIC_MAPQUEST_KEY ?? "";

declare global {
  interface Window { L: any; MQ: any; }
}

function loadMapQuest(): Promise<void> {
  return new Promise((resolve) => {
    if (window.MQ && window.L) { resolve(); return; }

    const existing = document.querySelector('script[src*="mapquest"]');
    if (!existing) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.js";
      document.head.appendChild(script);
    }

    const interval = setInterval(() => {
      if (window.MQ && window.L) {
        clearInterval(interval);
        window.MQ.key = MQ_KEY;
        resolve();
      }
    }, 50);
  });
}

export default function TrialMap({ trials, searchedCity, searchedState }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [radius, setRadius] = useState(100);
  const [isClient, setIsClient] = useState(false);
  const hasLocationFilter = !!(searchedCity || searchedState);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      const init = async () => {
        await loadMapQuest();
        if (cancelled || !mapRef.current) return;

        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
          circleRef.current = null;
        }
        const container = mapRef.current;
        if ((container as any)._leaflet_id) {
          (container as any)._leaflet_id = undefined;
        }

        const L = window.L;
        window.MQ.key = MQ_KEY;

        const map = L.mapquest.map(container, {
          center: [39.5, -98.35],
          layers: L.mapquest.tileLayer("map"),
          zoom: hasLocationFilter ? 8 : 4,
        });
        mapInstance.current = map;

        const points: { lat: number; lon: number; title: string; nctId: string }[] = [];
        for (const trial of trials) {
          for (const loc of trial.locations ?? []) {
            if (!loc.lat || !loc.lon || loc.country !== "United States") continue;
            if (hasLocationFilter) {
              const cityMatch = searchedCity
                ? (loc.city ?? "").toLowerCase().includes(searchedCity.toLowerCase()) : true;
              const stateMatch = searchedState
                ? (loc.state ?? "").toLowerCase().includes(searchedState.toLowerCase()) : true;
              if (searchedCity && searchedState && !cityMatch && !stateMatch) continue;
              else if (searchedCity && !searchedState && !cityMatch) continue;
              else if (searchedState && !searchedCity && !stateMatch) continue;
            }
            points.push({ lat: loc.lat, lon: loc.lon, title: trial.title ?? "", nctId: trial.nctId ?? "" });
          }
        }

        for (const p of points) {
          L.marker([p.lat, p.lon], { icon: L.mapquest.icons.marker() })
            .addTo(map)
            .bindPopup(`
              <div style="max-width:200px;font-family:sans-serif">
                <strong style="font-size:12px;color:#1a56db">${p.nctId}</strong><br/>
                <span style="font-size:11px;color:#555">${p.title.slice(0, 80)}${p.title.length > 80 ? "..." : ""}</span>
              </div>
            `);
        }

        if (hasLocationFilter && points.length > 0) {
          const centerLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
          const centerLon = points.reduce((s, p) => s + p.lon, 0) / points.length;
          circleRef.current = L.circle([centerLat, centerLon], {
            radius: radius * 1000,
            color: "#1a56db",
            fillColor: "#bfdbfe",
            fillOpacity: 0.15,
            weight: 2,
          }).addTo(map);
        }

        if (points.length > 0) {
          const lats = points.map(p => p.lat);
          const lons = points.map(p => p.lon);
          const pad = hasLocationFilter ? 0.3 : 1;
          map.fitBounds([
            [Math.min(...lats) - pad, Math.min(...lons) - pad],
            [Math.max(...lats) + pad, Math.max(...lons) + pad],
          ]);
        }
      };

      init();
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        circleRef.current = null;
      }
    };
  }, [trials, searchedCity, searchedState, isClient]);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(radius * 1000);
  }, [radius]);

  const locationLabel = [searchedCity, searchedState].filter(Boolean).join(", ");

  if (!isClient) {
    return (
      <div style={{ marginBottom: "24px", border: "1px solid #e8eaed", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ background: "#f8fafc", padding: "10px 16px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>📍 Trial Locations</span>
        </div>
        <div style={{ height: "350px", background: "#f1f5f9" }} />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "24px", border: "1px solid #e8eaed", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ background: "#f8fafc", padding: "10px 16px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>📍 Trial Locations</span>
        <span style={{ fontSize: "12px", color: "#9ca3af" }}>
          {hasLocationFilter ? `Filtered to ${locationLabel}` : `All US locations · ${trials.length} trial${trials.length !== 1 ? "s" : ""}`}
        </span>
        {hasLocationFilter && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500, whiteSpace: "nowrap" }}>
              Radius: <strong style={{ color: "#1a56db" }}>{radius} km</strong>
            </label>
            <input type="range" min={10} max={500} step={10} value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              style={{ width: "120px", accentColor: "#1a56db" }} />
          </div>
        )}
      </div>
      <div ref={mapRef} style={{ height: "350px", width: "100%" }} />
    </div>
  );
}