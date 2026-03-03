"use client";

import { useEffect, useState } from "react";
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
  useEffect(() => {
    let map: any;

    (async () => {
      try {
        console.log("[MAPQUEST] Initializing MapQuest map...");

        // Get container
        const container = document.getElementById("mapquest-map");
        if (!container) {
          console.error("[MAPQUEST] Container not found");
          return;
        }

        // Avoid re-initializing
        if ((container as any)._leaflet_id) {
          console.log("[MAPQUEST] Already initialized, skipping");
          return;
        }

        // Get L (Leaflet) from window - should be loaded by script tags in layout.tsx
        const L = (window as any).L;
        if (!L) {
          console.error("[MAPQUEST] Leaflet not found. Make sure script tags are in layout.tsx");
          return;
        }

        // Get MQ (MapQuest) from window
        const MQ = (window as any).MQ;
        if (!MQ) {
          console.error("[MAPQUEST] MapQuest not found. Make sure MQ script tag is in layout.tsx");
          return;
        }

        console.log("[MAPQUEST] Leaflet and MapQuest libraries loaded");

        // Set MapQuest key
        MQ.KEY = process.env.NEXT_PUBLIC_MAPQUEST_KEY || "YOUR_MAPQUEST_API_KEY";
        console.log("[MAPQUEST] Key set");

        // Create map using MapQuest
        map = MQ.mapquest.map("mapquest-map", {
          center: center,
          zoom: 4,
          type: "map"
        });

        console.log("[MAPQUEST] Map created");

        // Add trial location markers
        let trialMarkers = 0;
        trialLocations.forEach(({ lat, lon }) => {
          if (lat && lon) {
            MQ.mapquest.route().on("routeResponse", () => {
              // Route complete
            });
            L.marker([lat, lon])
              .bindPopup(`<strong>Trial Location</strong><br/>Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`)
              .addTo(map);
            trialMarkers++;
          }
        });
        console.log(`[MAPQUEST] Added ${trialMarkers} trial location markers`);

        // Add physician markers (in red)
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

        console.log("[MAPQUEST] Map fully initialized with MapQuest");
      } catch (error) {
        console.error("[MAPQUEST] Initialization error:", error);
      }
    })();

    return () => {
      if (map) {
        // MapQuest cleanup
        console.log("[MAPQUEST] Map cleanup");
      }
    };
  }, [center, trialLocations, physicians, radius]);

  return (
    <div
      id="mapquest-map"
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