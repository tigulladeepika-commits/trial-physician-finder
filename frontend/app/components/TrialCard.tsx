"use client";

import { Trial } from "../types";

type TrialCardProps = {
  trial: Trial;
};

export default function TrialCard({ trial }: TrialCardProps) {
  return (
    <div className="border rounded p-4 shadow space-y-3 mb-4">
      {/* Header */}
      <h2 className="font-bold text-lg">{trial.title}</h2>
      <p className="text-sm text-gray-600">
        Trial ID: {trial.nctId} | Status: {trial.status}
        {trial.phases && trial.phases.length > 0 && (
          <> | Phase: {trial.phases.join(", ")}</>
        )}
      </p>

      {/* Conditions */}
      {trial.conditions && trial.conditions.length > 0 && (
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Conditions: </span>
          {trial.conditions.join(", ")}
        </p>
      )}

      {/* Description */}
      {trial.description && (
        <p className="text-sm text-gray-700">{trial.description}</p>
      )}

      {/* Sponsor */}
      {trial.sponsor && (
        <p className="text-sm text-gray-500">
          <span className="font-semibold">Sponsor: </span>{trial.sponsor}
        </p>
      )}

      {/* Locations */}
      {trial.locations && trial.locations.length > 0 && (
        <div>
          <p className="text-sm font-semibold">Locations:</p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mt-1">
            {trial.locations.slice(0, 3).map((loc, i) => (
              <li key={i}>
                {[loc.facility, loc.city, loc.state, loc.country]
                  .filter(Boolean)
                  .join(", ")}
                {loc.status && (
                  <span className="ml-1 text-xs text-blue-500">({loc.status})</span>
                )}
              </li>
            ))}
            {trial.locations.length > 3 && (
              <li className="text-gray-400">+{trial.locations.length - 3} more locations</li>
            )}
          </ul>
        </div>
      )}

      {/* Inclusion Criteria */}
      {trial.inclusionCriteria && (
        <div>
          <p className="text-sm font-semibold">Inclusion Criteria:</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">{trial.inclusionCriteria}</p>
        </div>
      )}

      {/* Exclusion Criteria */}
      {trial.exclusionCriteria && (
        <div>
          <p className="text-sm font-semibold">Exclusion Criteria:</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">{trial.exclusionCriteria}</p>
        </div>
      )}

      {/* Point of Contact */}
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