"use client";

import { useState } from "react";
import { useTrials } from "./hooks/useTrials";
import { usePhysicians } from "./hooks/usePhysicians";
import TrialCard from "./components/TrialCard";
import PhysicianCard from "./components/PhysicianCard";
import { Physician } from "./types";

export default function Page() {
  const [condition, setCondition] = useState("");
  const [otherTerms, setOtherTerms] = useState("");
  const [intervention, setIntervention] = useState("");
  const [location, setLocation] = useState("");
  const [studyStatus, setStudyStatus] = useState("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [ageGroup, setAgeGroup] = useState("");
  const [phase, setPhase] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Parse "Dallas, TX" or "dallas,TX" into city and state
  const parseLocation = (loc: string) => {
    const parts = loc.split(",").map((s) => s.trim());
    return { city: parts[0] || "", state: parts[1] || "" };
  };

  const { city, state } = parseLocation(location);

  const { trials, loading: trialsLoading } = useTrials(
    submitted ? (condition || " ") : null,
    submitted ? (city || " ") : null,
    submitted ? (state || " ") : null,
    submitted ? otherTerms : undefined,
    undefined
  );

  const { physicians, loading: physiciansLoading } = usePhysicians(
    submitted && city ? city : null,
    submitted && state ? state : null,
    submitted && condition ? condition : null
  );

  const handleSearch = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setCondition("");
    setOtherTerms("");
    setIntervention("");
    setLocation("");
    setStudyStatus("all");
    setAgeGroup("");
    setPhase("");
    setSubmitted(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Trial Physician Finder</h1>

      <div className="border rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-100 px-4 py-3">
          <span className="font-semibold text-sm">
            Focus Your Search{" "}
            <span className="text-gray-500 font-normal">(all filters optional)</span>
          </span>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Condition / disease</label>
            <input
              className="border rounded w-full p-2 text-sm"
              placeholder="e.g. diabetes, heart attack"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Other terms</label>
            <input
              className="border rounded w-full p-2 text-sm"
              placeholder="e.g. biomarker, genetic"
              value={otherTerms}
              onChange={(e) => setOtherTerms(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Intervention / treatment</label>
            <input
              className="border rounded w-full p-2 text-sm"
              placeholder="e.g. aspirin, surgery"
              value={intervention}
              onChange={(e) => setIntervention(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Location</label>
            <p className="text-xs text-gray-500 mb-1">Search by city and state, e.g. "Dallas, TX"</p>
            <input
              className="border rounded w-full p-2 text-sm"
              placeholder="e.g. Dallas, TX"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Study Status</label>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="studyStatus"
                  value="all"
                  checked={studyStatus === "all"}
                  onChange={() => setStudyStatus("all")}
                  className="accent-blue-600"
                />
                All studies
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="studyStatus"
                  value="recruiting"
                  checked={studyStatus === "recruiting"}
                  onChange={() => setStudyStatus("recruiting")}
                  className="accent-blue-600"
                />
                Recruiting and not yet recruiting studies
              </label>
            </div>
          </div>

          <div>
            <button
              className="flex items-center text-sm font-semibold text-gray-700 hover:text-blue-600 border-t pt-3 w-full"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
            >
              <span>More Filters</span>
              <span className="ml-auto text-lg">{showMoreFilters ? "−" : "+"}</span>
            </button>

            {showMoreFilters && (
              <div className="mt-3 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Age group</label>
                  <select
                    className="border rounded w-full p-2 text-sm"
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                  >
                    <option value="">Any</option>
                    <option value="child">Child (birth–17)</option>
                    <option value="adult">Adult (18–64)</option>
                    <option value="older_adult">Older adult (65+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Study phase</label>
                  <select
                    className="border rounded w-full p-2 text-sm"
                    value={phase}
                    onChange={(e) => setPhase(e.target.value)}
                  >
                    <option value="">Any</option>
                    <option value="early_phase1">Early Phase 1</option>
                    <option value="phase1">Phase 1</option>
                    <option value="phase2">Phase 2</option>
                    <option value="phase3">Phase 3</option>
                    <option value="phase4">Phase 4</option>
                    <option value="na">Not Applicable</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t">
          <button
            className="text-sm text-gray-500 hover:text-gray-700 underline"
            onClick={handleReset}
          >
            Clear all
          </button>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-blue-700"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
      </div>

      {submitted && trialsLoading && <p className="text-sm text-gray-500">Loading trials...</p>}
      {submitted && !trialsLoading && trials.length === 0 && (
        <p className="text-sm text-gray-500">No trials found.</p>
      )}
      {submitted && !trialsLoading && trials.map((trial) => (
        <TrialCard key={trial.nctId} trial={trial} />
      ))}

      {submitted && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-3">Nearby Physicians</h2>
          {physiciansLoading && <p className="text-sm text-gray-500">Loading physicians...</p>}
          {!physiciansLoading && physicians.length === 0 && (
            <p className="text-sm text-gray-500">No physicians found.</p>
          )}
          {!physiciansLoading && physicians.map((doctor: Physician) => (
            <PhysicianCard key={doctor.npi} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}