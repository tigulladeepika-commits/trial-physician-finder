"use client";

import PhysicianCard from "./PhysicianCard";

export default function PhysicianList({ physicians }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {physicians.map((doc: any) => (
        <PhysicianCard key={doc.npi} doctor={doc} />
      ))}
    </div>
  );
}