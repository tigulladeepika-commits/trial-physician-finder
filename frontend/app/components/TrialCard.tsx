"use client";

import { Trial } from "../types";

interface TrialCardProps {
  trial: Trial;
  onClick?: () => void;
}

export function TrialCard({ trial, onClick }: TrialCardProps) {
  const getStatusColor = (status: string) => {
    if (status.includes("Recruiting")) return "bg-green-100 text-green-800";
    if (status.includes("Completed")) return "bg-gray-100 text-gray-800";
    if (status.includes("Active")) return "bg-blue-100 text-blue-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <div
      onClick={onClick}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {trial.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600">{trial.nctId}</p>
        </div>
        <span
          className={`ml-2 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
            trial.status
          )}`}
        >
          {trial.status}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-sm text-gray-700 line-clamp-2">
          {trial.description}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {trial.phases.map((phase) => (
          <span
            key={phase}
            className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
          >
            {phase}
          </span>
        ))}
      </div>

      <div className="mt-3">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Conditions:</span>{" "}
          {trial.conditions.slice(0, 3).join(", ")}
          {trial.conditions.length > 3 && ` +${trial.conditions.length - 3}`}
        </p>
      </div>

      <div className="mt-3">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Locations:</span> {trial.locations.length}
        </p>
      </div>

      <div className="mt-3">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Sponsor:</span> {trial.sponsor}
        </p>
      </div>
    </div>
  );
}