"use client";

import { useState } from "react";
import { Trial, Physician } from "../types";
import { fetchPhysicians } from "../utils/api";
import PhysicianCard from "./PhysicianCard";
import PhysicianTrialMap from "./PhysicianTrialMap";  // ✅ new import

type TrialCardProps = {
  trial: Trial;
};

const NON_US = [
  "Israel", "Germany", "India", "Spain", "Italy", "Australia",
  "Finland", "Poland", "Netherlands", "Sweden", "United Kingdom",
  "Canada", "France", "Taiwan", "South Korea", "Greece",
];

export default function TrialCard({ trial }: TrialCardProps) {
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState(false);
  const [showMap, setShowMap] = useState(false);  // ✅ new

  const handleFetchPhysicians = async () => {
    if (fetched) {
      // Toggle — if already fetched, collapse
      setFetched(false);
      setPhysicians([]);
      setShowMap(false);  // ✅ also hide map when collapsing
      return;
    }

    setLoading(true);
    setError(false);

    try {
      // Extract unique US locations from this trial
      const usLocations: Array<{ city: string; state: string }> = [];
      const seen = new Set<string>();

      for (const loc of trial.locations ?? []) {
        const country = loc.country ?? "";
        const isNonUS = NON_US.some((c) => country.includes(c));
        if (isNonUS) continue;

        const city = loc.city ?? "";
        const state = loc.state ?? "";
        if (!city || !state) continue;

        const key = `${city.toLowerCase()},${state.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          usLocations.push({ city, state });
        }
      }

      // Use first condition from trial for specialty mapping
      const condition = trial.conditions?.[0] ?? "";

      // Fetch from up to 3 locations in parallel
      const locationsToQuery = usLocations.slice(0, 3);

      let results: Physician[] = [];

      if (locationsToQuery.length > 0) {
        const allResults = await Promise.all(
          locationsToQuery.map(({ city, state }) =>
            fetchPhysicians(city, state, condition)
          )
        );

        // Flatten and deduplicate by NPI
        const npiSeen = new Set<string>();
        for (const batch of allResults) {
          for (const doc of batch) {
            if (!npiSeen.has(doc.npi)) {
              npiSeen.add(doc.npi);
              results.push(doc);
            }
          }
        }
      } else {
        // No US locations — fetch nationally by condition
        results = await fetchPhysicians(undefined, undefined, condition);
      }

      setPhysicians(results);
      setFetched(true);
    } catch (err) {
      console.error("Failed to fetch physicians:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

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
            {trial.locations.map((loc, i) => (
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

      {/* Fetch Physicians Button + Visualize Button */}
      <div className="pt-2 border-t mt-2 flex flex-wrap gap-2">
        <button
          onClick={handleFetchPhysicians}
          disabled={loading}
          className={`text-sm px-4 py-2 rounded font-semibold transition-colors ${
            fetched
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-blue-600 text-white hover:bg-blue-700"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading
            ? "Finding physicians..."
            : fetched
            ? "Hide Physicians"
            : "Find Physicians for this Trial"}
        </button>

        {/* ✅ Visualize button — only shown after physicians are fetched */}
        {fetched && !loading && (
          <button
            onClick={() => setShowMap((prev) => !prev)}
            className={`text-sm px-4 py-2 rounded font-semibold transition-colors ${
              showMap
                ? "bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {showMap ? "Hide Map" : "🗺️ Visualize on Map"}
          </button>
        )}
      </div>

      {/* Physicians results inline */}
      {error && (
        <p className="text-sm text-red-500">Failed to load physicians. Please try again.</p>
      )}

      {/* ✅ Map — shown when Visualize clicked */}
      {fetched && showMap && (
        <PhysicianTrialMap trial={trial} physicians={physicians} />
      )}

      {fetched && !loading && (
        <div className="mt-3 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Physicians near trial locations
            {trial.conditions?.[0] && (
              <span className="font-normal text-gray-400">
                {" "}· related to {trial.conditions[0]}
              </span>
            )}
          </h3>
          {physicians.length === 0 ? (
            <p className="text-sm text-gray-500">No physicians found for this trial's locations.</p>
          ) : (
            physicians.map((doctor) => (
              <PhysicianCard key={doctor.npi} doctor={doctor} />
            ))
          )}
        </div>
      )}
    </div>
  );
}