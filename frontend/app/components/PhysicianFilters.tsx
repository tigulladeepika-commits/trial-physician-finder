"use client";

import { useState } from "react";

interface PhysicianFiltersProps {
  onFilterChange: (filters: {
    condition: string;
    city: string;
    state: string;
    specialty: string;
    status: string;
    phase: string;
  }) => void;
}

const SPECIALTIES = [
  "Cardiology",
  "Oncology",
  "Endocrinology",
  "Neurology",
  "Pulmonology",
  "Gastroenterology",
  "Nephrology",
  "Rheumatology",
  "Infectious Disease",
  "Allergy/Immunology",
];

const STATUSES = [
  "Recruiting",
  "Active, not recruiting",
  "Completed",
  "Not yet recruiting",
  "Suspended",
];

const PHASES = [
  "Phase 1",
  "Phase 2",
  "Phase 3",
  "Phase 4",
  "Phase 1/2",
  "Phase 2/3",
];

export function PhysicianFilters({ onFilterChange }: PhysicianFiltersProps) {
  const [filters, setFilters] = useState({
    condition: "",
    city: "",
    state: "",
    specialty: "",
    status: "",
    phase: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const handleReset = () => {
    setFilters({
      condition: "",
      city: "",
      state: "",
      specialty: "",
      status: "",
      phase: "",
    });
    onFilterChange({
      condition: "",
      city: "",
      state: "",
      specialty: "",
      status: "",
      phase: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Condition / Disease
        </label>
        <input
          type="text"
          name="condition"
          value={filters.condition}
          onChange={handleChange}
          placeholder="e.g., diabetes, cancer"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            type="text"
            name="city"
            value={filters.city}
            onChange={handleChange}
            placeholder="e.g., Los Angeles"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            State
          </label>
          <input
            type="text"
            name="state"
            value={filters.state}
            onChange={handleChange}
            placeholder="e.g., CA"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Specialty
        </label>
        <select
          name="specialty"
          value={filters.specialty}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Specialties</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phase
          </label>
          <select
            name="phase"
            value={filters.phase}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Phases</option>
            {PHASES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
    </form>
  );
}