"use client";

import { useEffect, useRef } from "react";
import { Trial } from "../types";

type Props = {
  trials: Trial[];
};

export default function TrialMap({ trials }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      const container = mapRef.current;
      if (!container) return;
      if ((container as any)._leaflet_id) return;

      const map = L.map(container).setView([39.5, -98.35], 4);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

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

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      for (const p of points) {
        L.marker([p.lat, p.lon])
          .addTo(map)
          .bindPopup(`
            <div style="max-width:200px">
              <strong style="font-size:12px">${p.nctId}</strong><br/>
              <span style="font-size:11px">${p.title.slice(0, 80)}${p.title.length > 80 ? "..." : ""}</span>
            </div>
          `);
      }

      if (points.length > 0) {
        const lats = points.map((p) => p.lat);
        const lons = points.map((p) => p.lon);
        map.fitBounds([
          [Math.min(...lats) - 1, Math.min(...lons) - 1],
          [Math.max(...lats) + 1, Math.max(...lons) + 1],
        ]);
      }
    })();

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
      <div ref={mapRef} style={{ height: "350px", width: "100%" }} />
    </div>
  );
}