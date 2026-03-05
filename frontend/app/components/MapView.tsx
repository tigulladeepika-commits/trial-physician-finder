"use client";

import { useEffect, useRef, useState } from "react";
import { Physician } from "../types";

type MapViewProps = {
  center: [number, number];
  trialLocations: { lat: number; lon: number }[];
  physicians: Physician[];
  radius: number;
};

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export default function MapView({ center, trialLocations, physicians, radius }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  if (!isClient) return <div className="w-full h-96 bg-gray-200 rounded animate-pulse" />;
  return <MapQuestMap center={center} trialLocations={trialLocations} physicians={physicians} radius={radius} />;
}

function MapQuestMap({ center, trialLocations, physicians, radius }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const container = containerRef.current;
      if (!container) return;
      const L = (window as any).L;
      if (!L) { console.error("[MAP] Leaflet not loaded"); return; }

      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* ignore */ }
        mapRef.current = null;
      }
      (container as any)._leaflet_id = null;
      container.innerHTML = "";

      const map = L.map(container).setView([center[0], center[1]], 4);
      if (cancelled) { try { map.remove(); } catch { /* ignore */ } return; }
      mapRef.current = map;

      L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(map);

      trialLocations.forEach(({ lat, lon }) => {
        if (!lat || !lon) return;
        L.marker([lat, lon])
          .bindPopup(`<strong>Trial Location</strong><br/>Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`)
          .addTo(map);
      });

      physicians.forEach((p) => {
        if (!p.lat || !p.lon) return;
        const greenIcon = L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
        });
        L.marker([p.lat, p.lon], { icon: greenIcon })
          .bindPopup(`<strong>${p.name}</strong><br/>${p.specialty ?? "N/A"}`)
          .addTo(map);
      });

      if (radius > 0) {
        L.circle([center[0], center[1]], {
          radius: radius * 1609.34,
          color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.1, weight: 2,
        }).addTo(map);
      }

      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 250);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) { try { mapRef.current.remove(); } catch { /* ignore */ } mapRef.current = null; }
    };
  }, [center, trialLocations, physicians, radius]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "400px", borderRadius: "8px", zIndex: 0, backgroundColor: "#f0f4f8" }} />
  );
}