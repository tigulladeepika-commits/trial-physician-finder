"use client";

import { Trial } from "../types";

interface TrialCardProps {
  trial: Trial;
  onClick?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  RECRUITING:             "bg-green-100 text-green-800",
  ACTIVE_NOT_RECRUITING:  "bg-blue-100 text-blue-800",
  COMPLETED:              "bg-gray-100 text-gray-800",
  NOT_YET_RECRUITING:     "bg-yellow-100 text-yellow-800",
  TERMINATED:             "bg-red-100 text-red-800",
  WITHDRAWN:              "bg-red-100 text-red-800",
  SUSPENDED:              "bg-orange-100 text-orange-800",
};

function getStatusColor(status: string): string {
  // Try exact key match first, then substring match
  if (STATUS_COLORS[status]) return STATUS_COLORS[status];
  for (const [key, cls] of Object.entries(STATUS_COLORS)) {
    if (status.toUpperCase().includes(key)) return cls;
  }
  return "bg-yellow-100 text-yellow-800";
}

// Both named and default export so any import style works
export function TrialCard({ trial, onClick }: TrialCardProps) {
  return (
    <div
      onClick={onClick}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 leading-snug">
            {trial.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{trial.nctId}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(trial.status)}`}>
          {trial.status.replace(/_/g, " ")}
        </span>
      </div>

      {trial.description && (
        <p className="mt-3 text-sm text-gray-700 line-clamp-2">{trial.description}</p>
      )}

      {trial.phases?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {trial.phases.map((phase) => (
            <span key={phase} className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700 border border-purple-100">
              {phase.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {trial.conditions?.length > 0 && (
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium">Conditions:</span>{" "}
          {trial.conditions.slice(0, 3).join(", ")}
          {trial.conditions.length > 3 && (
            <span className="text-gray-400"> +{trial.conditions.length - 3} more</span>
          )}
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
        {trial.sponsor && (
          <span><span className="font-medium">Sponsor:</span> {trial.sponsor}</span>
        )}
        {trial.locations?.length > 0 && (
          <span><span className="font-medium">Locations:</span> {trial.locations.length}</span>
        )}
      </div>
    </div>
  );
}

export default TrialCard;