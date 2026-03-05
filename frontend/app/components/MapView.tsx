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

  return (
    <MapQuestMap
      center={center}
      trialLocations={trialLocations}
      physicians={physicians}
      radius={radius}
    />
  );
}

function MapQuestMap({ center, trialLocations, physicians, radius }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const container = containerRef.current;
        if (!container) return;

        const L = (window as any).L;
        const MQ = (window as any).MQ;

        if (!L) { console.error("[MAP] Leaflet not loaded"); return; }
        if (!MQ) { console.error("[MAP] MapQuest SDK not loaded"); return; }

        // Tear down existing map before rebuilding
        if (mapRef.current) {
          try { mapRef.current.remove(); } catch { /* ignore */ }
          mapRef.current = null;
        }
        (container as any)._leaflet_id = null;
        container.innerHTML = "";

        // Set API key before any MQ calls
        MQ.KEY = process.env.NEXT_PUBLIC_MAPQUEST_KEY || "YOUR_MAPQUEST_API_KEY";

        // Create the MapQuest map
        const map = MQ.mapquest.map(container, {
          center: { lat: center[0], lng: center[1] },
          zoom: 4,
          type: "map", // "map" | "sat" | "hyb"
        });

        if (cancelled) {
          try { map.remove(); } catch { /* ignore */ }
          return;
        }

        mapRef.current = map;

        // ------------------------------------------------------------------
        // Trial location markers — use MQ.marker() so they work with MQ map
        // ------------------------------------------------------------------
        trialLocations.forEach(({ lat, lon }) => {
          if (!lat || !lon) return;
          MQ.marker({ lat, lng: lon })
            .bindPopup(
              `<strong>Trial Location</strong><br/>Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`
            )
            .addTo(map);
        });

        // ------------------------------------------------------------------
        // Physician markers — use MQ.marker() with a custom blue icon
        // ------------------------------------------------------------------
        physicians.forEach((p) => {
          if (!p.lat || !p.lon) return;

          // MQ.marker supports a custom icon via L.icon since MQ extends Leaflet
          const blueIcon = L.icon({
            iconUrl:
              "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
            shadowUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
          });

          MQ.marker({ lat: p.lat, lng: p.lon }, { icon: blueIcon })
            .bindPopup(`<strong>${p.name}</strong><br/>${p.specialty ?? "N/A"}`)
            .addTo(map);
        });

        // ------------------------------------------------------------------
        // Radius circle — L.circle works fine on MQ maps (MQ extends Leaflet)
        // ------------------------------------------------------------------
        if (radius > 0) {
          L.circle([center[0], center[1]], {
            radius: radius * 1609.34, // miles → meters
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.1,
            weight: 2,
          }).addTo(map);
        }

        // Force tile refresh after React paints the container
        setTimeout(() => {
          if (mapRef.current) mapRef.current.invalidateSize();
        }, 250);

        console.log("[MAP] MapQuest map initialized");
      } catch (error) {
        console.error("[MAP] Initialization error:", error);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* ignore */ }
        mapRef.current = null;
      }
    };
  }, [center, trialLocations, physicians, radius]);

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