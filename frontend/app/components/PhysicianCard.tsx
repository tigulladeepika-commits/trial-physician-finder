"use client";

import { Physician } from "../types";

type Props = {
  doctor: Physician;
};

export default function PhysicianCard({ doctor }: Props) {
  return (
    <div className="border p-3 rounded shadow">
      <h3 className="font-bold">{doctor.name}</h3>
      <p className="text-sm italic">{doctor.specialty}</p>
      <p className="text-sm">{doctor.address && `${doctor.address}, `}{doctor.city}, {doctor.state} {doctor.postal_code}</p>
      {doctor.distance_km != null && (
        <p className="text-xs text-blue-500">{doctor.distance_km} km away</p>
      )}
    </div>
  );
}