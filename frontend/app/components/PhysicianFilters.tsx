"use client";

import { useState } from "react";

type FilterValues = {
  condition: string;
  city: string;
  state: string;
  specialty: string;
  status: string;
  phase: string;
};

type Props = {
  onFilterChange: (filters: FilterValues) => void;
};

const STATUSES = [
  "RECRUITING",
  "NOT YET RECRUITING",
  "ACTIVE, NOT RECRUITING",
  "COMPLETED",
  "TERMINATED",
];

const PHASES = ["PHASE1", "PHASE2", "PHASE3", "PHASE4"];

export default function PhysicianFilters({ onFilterChange }: Props) {
  const [values, setValues] = useState<FilterValues>({
    condition: "",
    city: "",
    state: "",
    specialty: "",
    status: "",
    phase: "",
  });

  const handleChange = (field: keyof FilterValues, value: string) => {
    const updated = { ...values, [field]: value };
    setValues(updated);
    onFilterChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
        <input
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. diabetes, cancer..."
          value={values.condition}
          onChange={e => handleChange("condition", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
        <input
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Boston"
          value={values.city}
          onChange={e => handleChange("city", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
        <input
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. MA"
          value={values.state}
          onChange={e => handleChange("state", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
        <input
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Oncology"
          value={values.specialty}
          onChange={e => handleChange("specialty", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={values.status}
          onChange={e => handleChange("status", e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={values.phase}
          onChange={e => handleChange("phase", e.target.value)}
        >
          <option value="">All phases</option>
          {PHASES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  );
}