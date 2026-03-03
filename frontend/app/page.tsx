"use client";

import { useState } from "react";
import PhysicianFilters from "./components/PhysicianFilters";
import TrialCard from "./components/TrialCard";
import { Trial } from "./types";
import { useTrials } from "./hooks/useTrials";

export default function Home() {
  const [condition, setCondition] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [phase, setPhase] = useState<string | undefined>(undefined);

  const { trials, loading, totalCount, error, refetch, hasMore, loadMore } = useTrials(
    condition,
    city,
    state,
    specialty,
    status,
    phase
  );

  const handleFilterChange = (filters: {
    condition: string;
    city: string;
    state: string;
    specialty: string;
    status: string;
    phase: string;
  }) => {
    setCondition(filters.condition || null);
    setCity(filters.city || null);
    setState(filters.state || null);
    setSpecialty(filters.specialty || undefined);
    setStatus(filters.status || undefined);
    setPhase(filters.phase || undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Clinical Trial & Physician Finder</h1>
          <p className="mt-2 text-gray-600">Find clinical trials and matching physicians</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Filters</h2>
              <PhysicianFilters onFilterChange={handleFilterChange} />
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading trials...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {!loading && !error && trials.length === 0 && condition && (
              <div className="text-center py-12">
                <p className="text-gray-600">No trials found matching your criteria.</p>
                <button
                  onClick={refetch}
                  className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Try Different Filters
                </button>
              </div>
            )}

            {!loading && !error && trials.length > 0 && (
              <div>
                <div className="mb-4">
                  <p className="text-gray-600">
                    Found {totalCount} trials (showing {trials.length})
                  </p>
                </div>

                <div className="space-y-4">
                  {trials.map((trial: Trial) => (
                    <TrialCard
                      key={trial.nctId}
                      trial={trial}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={loadMore}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      Load More Trials
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}