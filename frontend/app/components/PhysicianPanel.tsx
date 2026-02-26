"use client";

import { useState } from "react";
import MapView from "./MapView";
import PhysicianFilters from "./PhysicianFilters";
import PhysicianList from "./PhysicianList";
import ExportButtons from "./ExportButtons";
import { Trial } from "../types";

type PhysicianPanelProps = {
  trial: Trial;
};

export default function PhysicianPanel({ trial }: PhysicianPanelProps) {
  const [filters, setFilters] = useState({
    specialty: "",
    radius: 50,
    city: "",
  });

  const physicians = trial.physicians.filter((doc) => {
    return (
      (!filters.specialty || doc.specialty === filters.specialty) &&
      (!filters.city || doc.city.toLowerCase().includes(filters.city.toLowerCase()))
    );
  });

  const specialties = [...new Set(trial.physicians.map((p) => p.specialty))];

  // Extract trial center coords from contactsLocationsModule
  const firstLocation = trial.contactsLocationsModule?.locations?.[0];
  const trialLat = firstLocation?.geoPoint?.lat ?? 0;
  const trialLng = firstLocation?.geoPoint?.lon ?? 0;
  const trialLocations = trial.contactsLocationsModule?.locations?.map((loc) => ({
    lat: loc.geoPoint?.lat,
    lng: loc.geoPoint?.lon,
  })) ?? [];

  return (
    <div className="mt-4">
      <PhysicianFilters filters={filters} setFilters={setFilters} specialties={specialties} />
      <MapView
        center={[trialLat, trialLng]}
        trialLocations={trialLocations}
        physicians={physicians}
        radius={filters.radius}
      />
      <ExportButtons physicians={physicians} />
      <PhysicianList physicians={physicians} />
    </div>
  );
}