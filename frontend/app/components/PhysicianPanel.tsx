"use client";

import { useState } from "react";
import MapView from "./MapView";
import PhysicianFilters from "./PhysicianFilters";
import PhysicianList from "./PhysicianList";
import ExportButtons from "./ExportButtons";
import { Physician, Trial } from "../types";

type PhysicianPanelProps = {
  trial: Trial;
};

export default function PhysicianPanel({ trial }: PhysicianPanelProps) {
  const [filters, setFilters] = useState({
    specialty: "",
    gender: "",
    radius: 50,
    city: "",
  });

  const physicians = trial.physicians.filter((doc) => {
    return (
      (!filters.specialty || doc.specialty === filters.specialty) &&
      (!filters.gender || doc.gender === filters.gender) &&
      (!filters.city || doc.city.toLowerCase().includes(filters.city.toLowerCase()))
    );
  });

  const specialties = [...new Set(trial.physicians.map((p) => p.specialty))];

  return (
    <div className="mt-4">
      <PhysicianFilters filters={filters} setFilters={setFilters} specialties={specialties} />
      <MapView center={[trial.lat, trial.lng]} trialLocations={trial.locations} physicians={physicians} radius={filters.radius} />
      <ExportButtons physicians={physicians} />
      <PhysicianList physicians={physicians} />
    </div>
  );
}