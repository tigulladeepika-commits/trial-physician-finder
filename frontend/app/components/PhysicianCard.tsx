"use client";

import { Physician } from "../types";

interface PhysicianCardProps {
  doctor: Physician;
  onClick?: () => void;
}

export default function PhysicianCard({ doctor, onClick }: PhysicianCardProps) {
  const displayName = doctor.name;
  const credential = doctor.credential || "";
  const taxonomyDescription = doctor.taxonomyDescription || "";

  return (
    <div
      onClick={onClick}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {displayName}
          </h3>
          {credential && (
            <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: "4px", fontSize: "11px" }}>
              {credential}
            </span>
          )}
          {taxonomyDescription && (
            <div style={{ fontSize: "11px", color: "#1d4ed8", fontWeight: 500, marginBottom: "3px" }}>
              {taxonomyDescription}
            </div>
          )}
          <p className="mt-1 text-sm text-gray-600">{doctor.specialty}</p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Location:</span> {doctor.city}, {doctor.state} {doctor.zipCode}
        </p>
      </div>

      <div className="mt-3">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Phone:</span> {doctor.phone}
        </p>
      </div>

      {doctor.email && (
        <div className="mt-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Email:</span> {doctor.email}
          </p>
        </div>
      )}

      {doctor.distance !== undefined && (
        <div className="mt-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Distance:</span> {doctor.distance.toFixed(1)} miles
          </p>
        </div>
      )}
    </div>
  );
}