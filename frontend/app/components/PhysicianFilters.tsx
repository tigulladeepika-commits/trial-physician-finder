"use client";

type Props = {
  filters: { specialty: string; gender: string; radius: number; city: string };
  setFilters: React.Dispatch<React.SetStateAction<{ specialty: string; gender: string; radius: number; city: string }>>;
  specialties: string[];
};

export default function PhysicianFilters({ filters, setFilters, specialties }: Props) {
  return (
    <div className="p-4 border rounded space-y-3">
      <select
        className="border p-2 w-full"
        value={filters.specialty}
        onChange={(e) => setFilters((f) => ({ ...f, specialty: e.target.value }))}
      >
        <option value="">All Specialties</option>
        {specialties.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        className="border p-2 w-full"
        value={filters.gender}
        onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}
      >
        <option value="">Any Gender</option>
        <option value="M">Male</option>
        <option value="F">Female</option>
      </select>

      <input
        className="border p-2 w-full"
        placeholder="Filter by city"
        value={filters.city}
        onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
      />

      <input
        type="number"
        className="border p-2 w-full"
        placeholder="Radius (miles)"
        value={filters.radius}
        onChange={(e) => setFilters((f) => ({ ...f, radius: Number(e.target.value) }))}
      />
    </div>
  );
}