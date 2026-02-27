"use client";

import { Trial } from "../types";

type TrialCardProps = {
  trial: Trial;
};

export default function TrialCard({ trial }: TrialCardProps) {
  return (
    <div className="border rounded p-4 shadow space-y-3 mb-4">
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
    </div>
  );
}
