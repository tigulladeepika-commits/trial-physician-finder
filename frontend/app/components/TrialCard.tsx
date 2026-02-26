"use client";

import { Physician, Trial } from "../types";

type TrialCardProps = {
  trial: Trial;
};

export default function TrialCard({ trial }: TrialCardProps) {
  const id = trial.protocolSection.identificationModule.nctId;
  const title = trial.protocolSection.identificationModule.briefTitle;
  const status = trial.protocolSection.statusModule.overallStatus;

  return (
    <div className="border rounded p-4 shadow space-y-3">
      <h2 className="font-bold text-lg">{title}</h2>
      <p className="text-sm text-gray-600">Trial ID: {id} | Status: {status}</p>

      <h3 className="font-semibold">Nearby Physicians</h3>

      {trial.physicians?.length ? (
        <ul className="space-y-2 mt-2">
          {trial.physicians.map((doc) => (
            <li key={doc.npi} className="border p-2 rounded">
              <p className="font-medium">{doc.name}</p>
              <p className="text-sm text-gray-500">
                {doc.city}, {doc.state}
              </p>
              <p className="text-sm italic">{doc.specialty}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No physicians found.</p>
      )}
    </div>
  );
}