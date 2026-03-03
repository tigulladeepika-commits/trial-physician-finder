"use client";

import { useEffect, useState } from "react";

type Filters = {
  specialty: string;
  radius: number;
  city: string;
};

type Props = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  specialties: string[];
  loading?: boolean;
};

export default function PhysicianFilters({
  filters,
  setFilters,
  specialties,
  loading = false,
}: Props) {
  // Local city state so we can debounce — avoids a fetch on every keypress
  const [cityInput, setCityInput] = useState(filters.city);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, city: cityInput }));
    }, 400);
    return () => clearTimeout(timer);
  }, [cityInput, setFilters]);

  // Keep local input in sync if filters.city is reset externally
  useEffect(() => {
    setCityInput(filters.city);
  }, [filters.city]);

  return (
    <div className="p-4 border rounded space-y-3">
      {/* Specialty filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Specialty
        </label>
        <select
          className="border p-2 w-full rounded disabled:opacity-50"
          value={filters.specialty}
          disabled={loading}
          onChange={(e) =>
            setFilters((f) => ({ ...f, specialty: e.target.value }))
          }
        >
          <option value="">All Specialties</option>
          {specialties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* City filter — debounced */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filter by City
        </label>
        <input
          className="border p-2 w-full rounded disabled:opacity-50"
          placeholder="e.g. Boston"
          value={cityInput}
          disabled={loading}
          onChange={(e) => setCityInput(e.target.value)}
        />
      </div>

      {/* Radius filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Radius: {filters.radius > 0 ? `${filters.radius} km` : "Any"}
        </label>
        <input
          type="range"
          min={0}
          max={500}
          step={25}
          className="w-full disabled:opacity-50"
          value={filters.radius}
          disabled={loading}
          onChange={(e) =>
            setFilters((f) => ({ ...f, radius: Number(e.target.value) }))
          }
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Any</span>
          <span>500 km</span>
        </div>
      </div>

      {/* Clear filters */}
      {(filters.specialty || filters.city || filters.radius > 0) && (
        <button
          className="text-sm text-blue-600 underline hover:text-blue-800"
          onClick={() => {
            setCityInput("");
            setFilters({ specialty: "", radius: 0, city: "" });
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}