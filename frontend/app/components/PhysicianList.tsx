"use client";

import PhysicianCard from "./PhysicianCard";
import { Physician } from "../types";

interface PhysicianListProps {
  physicians: Physician[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

export function PhysicianList({ physicians, loading, error, hasMore, loadMore }: PhysicianListProps) {
  return (
    <div>
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading physicians...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {physicians.length > 0 && (
        <div className="space-y-4">
          {physicians.map((doctor) => (
            <PhysicianCard
              key={doctor.npi}
              doctor={doctor}
              onClick={() => console.log("Physician clicked:", doctor.npi)}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Load More Physicians
          </button>
        </div>
      )}
    </div>
  );
}