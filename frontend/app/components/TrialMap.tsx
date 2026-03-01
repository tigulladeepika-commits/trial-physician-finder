"use client";

import { useEffect, useRef } from "react";
import { Trial } from "../types";

type Props = {
  trials: Trial[];
};

declare global {
  interface Window {
    L: any;
    MQ: any;
  }
}

export default function TrialMap({ trials }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const key = process.env.NEXT_PUBLIC_MAPQUEST_KEY;
    if (!key) return;

    // Load MapQuest scripts dynamically
    const loadMapQuest = () => {
      return new Promise<void>((resolve) => {
        if (window.L && window.MQ) { resolve(); return; }

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = `https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.js`;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    loadMapQuest().then(() => {
      window.MQ.key = key;

      const map = window.MQ.map("trial-overview-map", {
        center: [39.5, -98.35],
        zoom: 4,
      });

      mapInstance.current = map;

      // Collect all US trial locations
      const points: { lat: number; lon: number; title: string; nctId: string }[] = [];

      for (const trial of trials) {
        for (const loc of trial.locations ?? []) {
          if (loc.lat && loc.lon && loc.country === "United States") {
            points.push({
              lat: loc.lat,
              lon: loc.lon,
              title: trial.title ?? trial.nctId ?? "",
              nctId: trial.nctId ?? "",
            });
          }
        }
      }

      // Add markers
      for (const p of points) {
        const marker = window.MQ.marker([p.lat, p.lon]).addTo(map);
        marker.bindPopup(`
          <div style="max-width:200px">
            <strong style="font-size:12px">${p.nctId}</strong><br/>
            <span style="font-size:11px">${p.title.slice(0, 80)}${p.title.length > 80 ? "..." : ""}</span>
          </div>
        `);
      }

      // Fit bounds if we have points
      if (points.length > 0) {
        const lats = points.map((p) => p.lat);
        const lons = points.map((p) => p.lon);
        const bounds = window.L.latLngBounds(
          [Math.min(...lats) - 1, Math.min(...lons) - 1],
          [Math.max(...lats) + 1, Math.max(...lons) + 1]
        );
        map.fitBounds(bounds);
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [trials]);

  return (
    <div className="mb-6 border rounded-lg overflow-hidden shadow">
      <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">📍 Trial Locations Map</span>
        <span className="text-xs text-gray-400">
          Showing US locations for {trials.length} trial{trials.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div id="trial-overview-map" ref={mapRef} style={{ height: "350px", width: "100%" }} />
    </div>
  );
}