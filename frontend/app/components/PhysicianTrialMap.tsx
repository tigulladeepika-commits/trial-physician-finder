"use client";

import { useEffect, useRef, useState } from "react";
import { Trial, Physician } from "../types";

type Props = {
  trial: Trial;
  physicians: Physician[];
};

const MQ_KEY = "Ykpe3tfSmVqKRYujfcgRw8ddU79yLJ5j";

declare global {
  interface Window { L: any; MQ: any; }
}

function loadMapQuest(): Promise<void> {
  return new Promise((resolve) => {
    if (window.MQ && window.L) { resolve(); return; }

    const existing = document.querySelector('script[src*="mapquest"]');
    if (!existing) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.js";
      document.head.appendChild(script);
    }

    const interval = setInterval(() => {
      if (window.MQ && window.L) {
        clearInterval(interval);
        window.MQ.key = MQ_KEY;
        resolve();
      }
    }, 50);
  });
}

export default function PhysicianTrialMap({ trial, physicians }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [radius, setRadius] = useState(50);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const firstUsLoc = trial.locations?.find(l => l.lat && l.lon && l.country === "United States");
  const center: [number, number] = firstUsLoc ? [firstUsLoc.lat!, firstUsLoc.lon!] : [39.5, -98.35];

  useEffect(() => {
    if (!isClient) return;

    let cancelled = false;

    const init = async () => {
      await loadMapQuest();
      if (cancelled || !mapRef.current) return;

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        circleRef.current = null;
      }
      const container = mapRef.current;
      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = undefined;
      }

      const L = window.L;
      window.MQ.key = MQ_KEY;

      const map = L.mapquest.map(container, {
        center,
        layers: L.mapquest.tileLayer("map"),
        zoom: 8,
      });
      mapInstance.current = map;

      for (const loc of trial.locations ?? []) {
        if (!loc.lat || !loc.lon || loc.country !== "United States") continue;
        L.marker([loc.lat, loc.lon], { icon: L.mapquest.icons.marker({ primaryColor: "#1a56db", secondaryColor: "#bfdbfe", size: "sm" }) })
          .addTo(map)
          .bindPopup(`
            <div style="max-width:180px;font-family:sans-serif">
              <strong style="font-size:11px;color:#1a56db">🏥 Trial Site</strong><br/>
              <span style="font-size:11px">${loc.facility ?? ""}</span><br/>
              <span style="font-size:10px;color:#6b7280">${[loc.city, loc.state].filter(Boolean).join(", ")}</span>
            </div>
          `);
      }

      for (const doc of physicians) {
        if (!doc.lat || !doc.lon) continue;
        L.marker([doc.lat, doc.lon], { icon: L.mapquest.icons.marker({ primaryColor: "#16a34a", secondaryColor: "#bbf7d0", size: "sm" }) })
          .addTo(map)
          .bindPopup(`
            <div style="max-width:180px;font-family:sans-serif">
              <strong style="font-size:11px;color:#16a34a">👨‍⚕️ ${doc.name}</strong><br/>
              <span style="font-size:11px">${doc.specialty ?? ""}</span><br/>
              ${doc.taxonomyCode ? `<span style="font-size:10px;color:#6b7280;font-family:monospace">${doc.taxonomyCode}</span><br/>` : ""}
              <span style="font-size:10px;color:#6b7280">${[doc.city, doc.state].filter(Boolean).join(", ")}</span>
            </div>
          `);
      }

      circleRef.current = L.circle(center, {
        radius: radius * 1000,
        color: "#1a56db",
        fillColor: "#bfdbfe",
        fillOpacity: 0.12,
        weight: 2,
      }).addTo(map);
    };

    init();
    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        circleRef.current = null;
      }
    };
  }, [trial, physicians, isClient]);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(radius * 1000);
  }, [radius]);

  if (!isClient) {
    return (
      <div style={{ border: "1px solid #e8eaed", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ background: "#f8fafc", padding: "10px 16px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>🗺️ Map View</span>
        </div>
        <div style={{ height: "400px", background: "#f1f5f9" }} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #e8eaed", borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ background: "#f8fafc", padding: "10px 16px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>🗺️ Map View</span>
        <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#6b7280" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#1a56db", display: "inline-block" }} /> Trial Sites
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} /> Physicians
          </span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500, whiteSpace: "nowrap" }}>
            Radius: <strong style={{ color: "#1a56db" }}>{radius} km</strong>
          </label>
          <input type="range" min={10} max={300} step={10} value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            style={{ width: "120px", accentColor: "#1a56db" }} />
        </div>
      </div>
      <div ref={mapRef} style={{ height: "400px", width: "100%" }} />
    </div>
  );
}