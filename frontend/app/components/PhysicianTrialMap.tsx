"use client";

import { useEffect, useRef, useState } from "react";
import { Trial, Physician } from "../types";

type Props = {
  trial: Trial;
  physicians: Physician[];
};

export default function PhysicianTrialMap({ trial, physicians }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [radius, setRadius] = useState(50);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      const container = mapRef.current;
      if (!container) return;
      if ((container as any)._leaflet_id) return;

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const firstLoc = trial.locations?.find(
        (l) => l.lat && l.lon && l.country === "United States"
      );
      const center: [number, number] = firstLoc?.lat && firstLoc?.lon
        ? [firstLoc.lat, firstLoc.lon]
        : [39.5, -98.35];

      const map = L.map(container).setView(center, 7);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Trial location markers (blue)
      const blueIcon = L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      for (const loc of trial.locations ?? []) {
        if (!loc.lat || !loc.lon || loc.country !== "United States") continue;
        L.marker([loc.lat, loc.lon], { icon: blueIcon })
          .addTo(map)
          .bindPopup(`
            <div style="max-width:180px">
              <strong style="color:#2563eb;font-size:12px">🏥 Trial Site</strong><br/>
              <span style="font-size:11px">${loc.facility ?? ""}</span><br/>
              <span style="font-size:11px;color:#6b7280">${loc.city}, ${loc.state}</span>
            </div>
          `);
      }

      // Physician markers (green)
      const greenIcon = L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      for (const doc of physicians) {
        if (!doc.lat || !doc.lon) continue;
        L.marker([doc.lat, doc.lon], { icon: greenIcon })
          .addTo(map)
          .bindPopup(`
            <div style="max-width:180px">
              <strong style="color:#16a34a;font-size:12px">👨‍⚕️ ${doc.name}</strong><br/>
              <span style="font-size:11px">${doc.specialty ?? ""}</span><br/>
              <span style="font-size:11px;color:#6b7280">${doc.address ?? ""}, ${doc.city}, ${doc.state}</span>
            </div>
          `);
      }

      // Radius circle
      if (firstLoc?.lat && firstLoc?.lon) {
        circleRef.current = L.circle([firstLoc.lat, firstLoc.lon], {
          radius: radius * 1000,
          color: "#2563eb",
          fillColor: "#93c5fd",
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map);
      }
    })();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        circleRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(radius * 1000);
  }, [radius]);

  return (
    <div className="mt-4 border rounded-lg overflow-hidden shadow">
      <div className="bg-gray-50 px-4 py-3 border-b flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold text-gray-700">🗺️ Map View</span>

        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span style={{ background: "#2563eb" }} className="inline-block w-4 h-4 rounded-full text-white text-center leading-4 font-bold text-xs">T</span>
            Trial Sites
          </span>
          <span className="flex items-center gap-1">
            <span style={{ background: "#16a34a" }} className="inline-block w-4 h-4 rounded-full text-white text-center leading-4 font-bold text-xs">P</span>
            Physicians
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-gray-600 font-medium whitespace-nowrap">
            Radius: <span className="font-bold text-blue-600">{radius} km</span>
          </label>
          <input
            type="range"
            min={10}
            max={300}
            step={10}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-32 accent-blue-600"
          />
        </div>
      </div>

      <div ref={mapRef} style={{ height: "400px", width: "100%" }} />
    </div>
  );
}