"use client";

import { useState } from "react";
import { useTrials } from "./hooks/useTrials";
import { usePhysicians } from "./hooks/usePhysicians";
import TrialCard from "./components/TrialCard";
import PhysicianCard from "./components/PhysicianCard";

export default function Page() {
  const [condition, setCondition] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { trials, loading: trialsLoading } = useTrials(
    submitted ? condition : null,
    submitted ? city : null,
    submitted ? state : null
  );

  const { physicians, loading: physiciansLoading } = usePhysicians(
    submitted ? city : null,
    submitted ? state : null,
    submitted ? condition : null  // using condition as specialty search term
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Trial Physician Finder</h1>

      <div className="flex gap-2 mb-6">
        <input
          className="border p-2 rounded w-full"
          placeholder="Condition (e.g. diabetes)"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        />
        <input
          className="border p-2 rounded w-full"
          placeholder="City (e.g. Dallas)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          className="border p-2 rounded w-full"
          placeholder="State (e.g. TX)"
          value={state}
          onChange={(e) => setState(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded whitespace-nowrap"
          onClick={() => setSubmitted(true)}
        >
          Search
        </button>
      </div>

      {!submitted && <p className="text-gray-500">Enter a condition, city, and state to search.</p>}

      {/* Trials Section */}
      {submitted && trialsLoading && <p>Loading trials...</p>}
      {submitted && !trialsLoading && trials.length === 0 && <p>No trials found.</p>}
      {submitted && !trialsLoading && trials.map((trial) => (
        <TrialCard key={trial.nctId} trial={trial} />
      ))}

      {/* Physicians Section */}
      {submitted && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-3">Nearby Physicians</h2>
          {physiciansLoading && <p>Loading physicians...</p>}
          {!physiciansLoading && physicians.length === 0 && (
            <p className="text-gray-500">No physicians found.</p>
          )}
          {!physiciansLoading && physicians.map((doctor) => (
            <PhysicianCard key={doctor.npi} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}
