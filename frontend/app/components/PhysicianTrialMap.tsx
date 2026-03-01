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
  const [radius, setRadius] = useState(50); // km
  const [loaded, setLoaded] = useState(false);

  const mapId = `trial-physician-map-${trial.nctId}`;

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MAPQUEST_KEY;
    if (!key || !mapRef.current) return;

    const loadMapQuest = () =>
      new Promise<void>((resolve) => {
        if (window.L && window.MQ) { resolve(); return; }

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.js";
        script.onload = () => resolve();
        document.head.appendChild(script);
      });

    loadMapQuest().then(() => {
      if (mapInstance.current) return;

      window.MQ.key = key;

      // Find center: first US trial location with coords
      const firstLoc = trial.locations?.find(
        (l) => l.lat && l.lon && l.country === "United States"
      );
      const center: [number, number] = firstLoc?.lat && firstLoc?.lon
        ? [firstLoc.lat, firstLoc.lon]
        : [39.5, -98.35];

      const map = window.MQ.map(mapId, { center, zoom: 8 });
      mapInstance.current = map;

      // Trial location markers (blue)
      for (const loc of trial.locations ?? []) {
        if (!loc.lat || !loc.lon || loc.country !== "United States") continue;
        const marker = window.MQ.marker([loc.lat, loc.lon], {
          icon: window.L.divIcon({
            className: "",
            html: `<div style="background:#2563eb;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">T</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        }).addTo(map);
        marker.bindPopup(`
          <div style="max-width:180px">
            <strong style="color:#2563eb;font-size:12px">🏥 Trial Site</strong><br/>
            <span style="font-size:11px">${loc.facility ?? ""}</span><br/>
            <span style="font-size:11px;color:#6b7280">${loc.city}, ${loc.state}</span>
          </div>
        `);
      }

      // Physician markers (green)
      for (const doc of physicians) {
        if (!doc.lat || !doc.lon) continue;
        const marker = window.MQ.marker([doc.lat, doc.lon], {
          icon: window.L.divIcon({
            className: "",
            html: `<div style="background:#16a34a;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">P</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        }).addTo(map);
        marker.bindPopup(`
          <div style="max-width:180px">
            <strong style="color:#16a34a;font-size:12px">👨‍⚕️ ${doc.name}</strong><br/>
            <span style="font-size:11px">${doc.specialty}</span><br/>
            <span style="font-size:11px;color:#6b7280">${doc.address ?? ""}, ${doc.city}, ${doc.state}</span>
          </div>
        `);
      }

      // Draw radius circle around first trial location
      if (firstLoc?.lat && firstLoc?.lon) {
        circleRef.current = window.L.circle([firstLoc.lat, firstLoc.lon], {
          radius: radius * 1000, // meters
          color: "#2563eb",
          fillColor: "#93c5fd",
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map);
      }

      setLoaded(true);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        circleRef.current = null;
        setLoaded(false);
      }
    };
  }, []);

  // Update circle radius when slider changes
  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(radius * 1000);
  }, [radius]);

  return (
    <div className="mt-4 border rounded-lg overflow-hidden shadow">
      <div className="bg-gray-50 px-4 py-3 border-b flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold text-gray-700">🗺️ Map View</span>

        {/* Legend */}
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

        {/* Radius slider */}
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

      <div id={mapId} ref={mapRef} style={{ height: "400px", width: "100%" }} />
    </div>
  );
}