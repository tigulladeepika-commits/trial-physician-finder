"use client";

import { useState } from "react";
import { Trial } from "../types";

type TrialCardProps = {
  trial: Trial;
};

export default function TrialCard({ trial }: TrialCardProps) {
  const [showAllLocations, setShowAllLocations] = useState(false);

  const visibleLocations = showAllLocations
    ? trial.locations ?? []
    : (trial.locations ?? []).slice(0, 3);

  return (
    <div className="border rounded p-4 shadow space-y-3 mb-4">

      <h2 className="font-bold text-lg">{trial.title}</h2>
      <p className="text-sm text-gray-600">
        Trial ID: {trial.nctId} | Status: {trial.status}
        {trial.phases && trial.phases.length > 0 && (
          <> | Phase: {trial.phases.join(", ")}</>
        )}
      </p>

      {trial.conditions && trial.conditions.length > 0 && (
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Conditions: </span>
          {trial.conditions.join(", ")}
        </p>
      )}

      {trial.description && (
        <p className="text-sm text-gray-700">{trial.description}</p>
      )}

      {trial.sponsor && (
        <p className="text-sm text-gray-500">
          <span className="font-semibold">Sponsor: </span>{trial.sponsor}
        </p>
      )}

      {trial.locations && trial.locations.length > 0 && (
        <div>
          <p className="text-sm font-semibold">Locations:</p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mt-1">
            {visibleLocations.map((loc, i) => (
              <li key={i}>
                {[loc.facility, loc.city, loc.state, loc.country]
                  .filter(Boolean)
                  .join(", ")}
                {loc.status && (
                  <span className="ml-1 text-xs text-blue-500">({loc.status})</span>
                )}
              </li>
            ))}
          </ul>
          {trial.locations.length > 3 && (
            <button
              className="text-sm text-blue-600 hover:underline mt-1"
              onClick={() => setShowAllLocations(!showAllLocations)}
            >
              {showAllLocations
                ? "Show less"
                : `+${trial.locations.length - 3} more locations`}
            </button>
          )}
        </div>
      )}

      {trial.inclusionCriteria && (
        <div>
          <p className="text-sm font-semibold">Inclusion Criteria:</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">{trial.inclusionCriteria}</p>
        </div>
      )}

      {trial.exclusionCriteria && (
        <div>
          <p className="text-sm font-semibold">Exclusion Criteria:</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">{trial.exclusionCriteria}</p>
        </div>
      )}

      {trial.pointOfContact && (
        <div>
          <p className="text-sm font-semibold">Point of Contact:</p>
          <p className="text-sm text-gray-600">
            {trial.pointOfContact.name}
            {trial.pointOfContact.role && ` (${trial.pointOfContact.role})`}
          </p>
          {trial.pointOfContact.phone && (
            <p className="text-sm text-gray-500">Phone: {trial.pointOfContact.phone}</p>
          )}
          {trial.pointOfContact.email && (
            <p className="text-sm text-gray-500">Email: {trial.pointOfContact.email}</p>
          )}
        </div>
      )}
    </div>
  );
}