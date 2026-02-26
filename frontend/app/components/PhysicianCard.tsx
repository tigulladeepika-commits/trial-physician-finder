"use client";

export default function PhysicianCard({ doctor }: any) {
  return (
    <div className="border p-3 rounded shadow">
      <h3 className="font-bold">{doctor.name}</h3>
      <p>{doctor.specialty}</p>
      <p>{doctor.city}, {doctor.state}</p>
      <p>Gender: {doctor.gender}</p>
    </div>
  );
}