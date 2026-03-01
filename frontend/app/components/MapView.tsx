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

  return <LeafletMap center={center} trialLocations={trialLocations} physicians={physicians} radius={radius} />;
}

function LeafletMap({ center, trialLocations, physicians, radius }: MapViewProps) {
  useEffect(() => {
    // Dynamically import to avoid SSR issues
    let map: any;
    let L: any;

    (async () => {
      L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default marker icons broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const container = document.getElementById("leaflet-map");
      if (!container) return;

      // Avoid re-initializing if already mounted
      if ((container as any)._leaflet_id) return;

      map = L.map("leaflet-map").setView(center, 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Trial location markers (blue default)
      trialLocations.forEach(({ lat, lon }) => {
        L.marker([lat, lon])
          .addTo(map)
          .bindPopup("Trial Location");
      });

      // Physician markers (red)
      const redIcon = L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      physicians.forEach((p) => {
        if (p.lat && p.lon) {
          L.marker([p.lat, p.lon], { icon: redIcon })
            .addTo(map)
            .bindPopup(`<strong>${p.name}</strong><br/>${p.specialty ?? ""}`);
        }
      });

      // Draw radius circle around center
      if (radius > 0) {
        L.circle(center, {
          radius: radius * 1609.34, // miles to meters
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.1,
        }).addTo(map);
      }
    })();

    return () => {
      map?.remove();
    };
  }, [center, trialLocations, physicians, radius]);

  return (
    <div
      id="leaflet-map"
      className="w-full rounded"
      style={{ height: "400px", zIndex: 0 }}
    />
  );
}