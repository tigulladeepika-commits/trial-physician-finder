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

  const allPhysicians = trial.physicians ?? [];

  const physicians = allPhysicians.filter((doc) => {
    return (
      (!filters.specialty || doc.specialty === filters.specialty) &&
      (!filters.city || (doc.city ?? "").toLowerCase().includes(filters.city.toLowerCase()))
    );
  });

  const specialties = [...new Set(allPhysicians.map((p) => p.specialty).filter((s): s is string => s !== undefined))];

  const firstLocation = trial.contactsLocationsModule?.locations?.[0];
  const trialLat = firstLocation?.geoPoint?.lat ?? 0;
  const trialLng = firstLocation?.geoPoint?.lon ?? 0;
  const trialLocations = trial.contactsLocationsModule?.locations?.map((loc) => ({
  lat: loc.geoPoint?.lat ?? 0,
  lng: loc.geoPoint?.lon ?? 0,
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