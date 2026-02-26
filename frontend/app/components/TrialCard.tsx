"use client";

import { Trial } from "../types";

type TrialCardProps = {
  trial: Trial;
};

export default function TrialCard({ trial }: TrialCardProps) {
  return (
    <div className="border rounded p-4 shadow space-y-3">
      <h2 className="font-bold text-lg">{trial.title}</h2>
      <p className="text-sm text-gray-600">
        Trial ID: {trial.nctId} | Status: {trial.status}
      </p>
      {trial.description && (
        <p className="text-sm text-gray-700">{trial.description}</p>
      )}
      {trial.sponsor && (
        <p className="text-sm text-gray-500">Sponsor: {trial.sponsor}</p>
      )}

      <h3 className="font-semibold">Nearby Physicians</h3>

      {trial.physicians?.length ? (
        <ul className="space-y-2 mt-2">
          {trial.physicians.map((doc) => (
            <li key={doc.npi} className="border p-2 rounded">
              <p className="font-medium">{doc.name}</p>
              <p className="text-sm text-gray-500">
                {doc.address && `${doc.address}, `}{doc.city}, {doc.state} {doc.postal_code}
              </p>
              <p className="text-sm italic">{doc.specialty}</p>
              {doc.distance_km != null && (
                <p className="text-xs text-blue-500">{doc.distance_km} km away</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No physicians found.</p>
      )}
    </div>
  );
}
