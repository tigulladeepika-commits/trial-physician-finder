"use client";

import { useEffect } from "react";
import { Physician } from "../types";

type MapViewProps = {
  center: [number, number];
  trialLocations: { lat: number; lng: number }[];
  physicians: Physician[];
  radius: number;
};

export default function MapView({ center, trialLocations, physicians, radius }: MapViewProps) {
  useEffect(() => {
    console.log("Map mounted:", { center, trialLocations, physicians, radius });
  }, [center, trialLocations, physicians, radius]);

  return (
    <div className="w-full h-64 bg-gray-200 rounded">
      <p className="text-center mt-24 text-gray-600">Map showing physician locations</p>
    </div>
  );
}