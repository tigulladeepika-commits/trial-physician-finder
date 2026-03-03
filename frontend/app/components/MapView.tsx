"use client";

import { useEffect, useRef, useState } from "react";
import { Physician } from "../types";

type MapViewProps = {
  center: [number, number];
  trialLocations: { lat: number; lon: number }[];
  physicians: Physician[];
  radius: number;
};

export default function MapView({ center, trialLocations, physicians, radius }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="w-full h-96 bg-gray-200 rounded animate-pulse" />;
  }

  return <MapQuestMap center={center} trialLocations={trialLocations} physicians={physicians} radius={radius} />;
}

function MapQuestMap({ center, trialLocations, physicians, radius }: MapViewProps) {
  // FIX 1: Use refs to track the map instance and container
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        console.log("[MAPQUEST] Initializing MapQuest map...");

        const container = containerRef.current;
        if (!container) {
          console.error("[MAPQUEST] Container not found");
          return;
        }

        const L = (window as any).L;
        if (!L) {
          console.error("[MAPQUEST] Leaflet not found. Make sure script tags are in layout.tsx");
          return;
        }

        const MQ = (window as any).MQ;
        if (!MQ) {
          console.error("[MAPQUEST] MapQuest not found. Make sure MQ script tag is in layout.tsx");
          return;
        }

        // FIX 2: Destroy the previous map instance before rebuilding.
        // The old code checked `_leaflet_id` and returned early — this meant
        // the map NEVER re-rendered after the first load, causing infinite loading.
        if (mapRef.current) {
          try {
            mapRef.current.remove();
          } catch (e) {
            console.warn("[MAPQUEST] Error removing previous map:", e);
          }
          mapRef.current = null;
        }

        // Clear Leaflet's internal container ID so it can be reused
        (container as any)._leaflet_id = null;
        container.innerHTML = "";

        console.log("[MAPQUEST] Libraries confirmed, rebuilding map...");

        MQ.KEY = process.env.NEXT_PUBLIC_MAPQUEST_KEY || "YOUR_MAPQUEST_API_KEY";

        const map = MQ.mapquest.map(container, {
          center: center,
          zoom: 4,
          type: "map",
        });

        // Guard: if effect was cleaned up while async work was in progress, tear down
        if (cancelled) {
          try { map.remove(); } catch { /* ignore */ }
          return;
        }

        // FIX 3: Store map instance in ref so cleanup and re-renders work correctly
        mapRef.current = map;
        console.log("[MAPQUEST] Map created");

        // Add trial location markers
        let trialMarkers = 0;
        trialLocations.forEach(({ lat, lon }) => {
          if (lat && lon) {
            L.marker([lat, lon])
              .bindPopup(`<strong>Trial Location</strong><br/>Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`)
              .addTo(map);
            trialMarkers++;
          }
        });
        console.log(`[MAPQUEST] Added ${trialMarkers} trial location markers`);

        // Add physician markers (red)
        let physicianMarkers = 0;
        physicians.forEach((p) => {
          if (p.lat && p.lon) {
            const redIcon = L.icon({
              iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
              shadowUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
            });
            L.marker([p.lat, p.lon], { icon: redIcon })
              .bindPopup(`<strong>${p.name}</strong><br/>${p.specialty ?? "N/A"}`)
              .addTo(map);
            physicianMarkers++;
          }
        });
        console.log(`[MAPQUEST] Added ${physicianMarkers} physician markers`);

        // Add radius circle
        if (radius > 0) {
          L.circle(center, {
            radius: radius * 1609.34, // miles to meters
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.1,
            weight: 2,
          }).addTo(map);
          console.log("[MAPQUEST] Added radius circle");
        }

        // FIX 4: Force map to recalculate container size after React paint.
        // Without this, tiles can stay grey/stuck after the container becomes visible.
        setTimeout(() => {
          if (mapRef.current) mapRef.current.invalidateSize();
        }, 250);

        console.log("[MAPQUEST] Map fully initialized");
      } catch (error) {
        console.error("[MAPQUEST] Initialization error:", error);
      }
    })();

    // Cleanup: remove map when component unmounts or deps change
    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* ignore */ }
        mapRef.current = null;
      }
    };
  }, [center, trialLocations, physicians, radius]);

  // FIX 5: Use ref instead of hard-coded id so multiple instances don't conflict
  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "8px",
        zIndex: 0,
        backgroundColor: "#f0f4f8",
      }}
    />
  );
}