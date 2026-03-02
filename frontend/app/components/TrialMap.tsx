"use client";

import { useEffect, useRef } from "react";
import { Trial } from "../types";

type Props = {
  trials: Trial[];
  searchedCity?: string;
  searchedState?: string;
};

declare global {
  interface Window { L: any; }
}

export default function TrialMap({ trials, searchedCity, searchedState }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const hasLocationFilter = !!(searchedCity || searchedState);

  useEffect(() => {
    // Cleanup previous map instance when location changes
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    if (!mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      const container = mapRef.current;
      if (!container) return;
      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = undefined;
      }

      const map = L.map(container).setView([39.5, -98.35], hasLocationFilter ? 7 : 4);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const points: { lat: number; lon: number; title: string; nctId: string }[] = [];

      for (const trial of trials) {
        for (const loc of trial.locations ?? []) {
          if (!loc.lat || !loc.lon || loc.country !== "United States") continue;

          // If location searched, only show markers in that city/state
          if (hasLocationFilter) {
            const cityMatch = searchedCity
              ? (loc.city ?? "").toLowerCase().includes(searchedCity.toLowerCase())
              : true;
            const stateMatch = searchedState
              ? (loc.state ?? "").toLowerCase().includes(searchedState.toLowerCase())
              : true;
            // Must match city OR state (not both required)
            if (searchedCity && searchedState) {
              if (!cityMatch && !stateMatch) continue;
            } else if (searchedCity && !cityMatch) continue;
            else if (searchedState && !stateMatch) continue;
          }

          points.push({
            lat: loc.lat,
            lon: loc.lon,
            title: trial.title ?? trial.nctId ?? "",
            nctId: trial.nctId ?? "",
          });
        }
      }

      for (const p of points) {
        L.marker([p.lat, p.lon])
          .addTo(map)
          .bindPopup(`
            <div style="max-width:200px;font-family:sans-serif">
              <strong style="font-size:12px;color:#1a56db">${p.nctId}</strong><br/>
              <span style="font-size:11px;color:#555">${p.title.slice(0, 80)}${p.title.length > 80 ? "..." : ""}</span>
            </div>
          `);
      }

      if (points.length > 0) {
        const lats = points.map((p) => p.lat);
        const lons = points.map((p) => p.lon);
        // Tighter zoom when location is filtered
        const pad = hasLocationFilter ? 0.3 : 1;
        map.fitBounds([
          [Math.min(...lats) - pad, Math.min(...lons) - pad],
          [Math.max(...lats) + pad, Math.max(...lons) + pad],
        ]);
      }
    })();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [trials, searchedCity, searchedState]);

  const locationLabel = [searchedCity, searchedState].filter(Boolean).join(", ");

  return (
    <div className="mb-6 border rounded-lg overflow-hidden shadow">
      <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-700">📍 Trial Locations Map</span>
        <span className="text-xs text-gray-400">
          {hasLocationFilter
            ? `Showing trial sites in ${locationLabel}`
            : `Showing all US locations for ${trials.length} trial${trials.length !== 1 ? "s" : ""}`
          }
        </span>
        {hasLocationFilter && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 ml-auto">
            Filtered to {locationLabel}
          </span>
        )}
      </div>
      <div ref={mapRef} style={{ height: "350px", width: "100%" }} />
    </div>
  );
}