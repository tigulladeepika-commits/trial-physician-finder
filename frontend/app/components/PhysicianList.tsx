"use client";

import { Physician } from "../types";
import PhysicianCard from "./PhysicianCard";

type Props = {
  physicians: Physician[];
};

export default function PhysicianList({ physicians }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {physicians.map((doc) => (
        <PhysicianCard key={doc.npi} doctor={doc} />
      ))}
    </div>
  );
}