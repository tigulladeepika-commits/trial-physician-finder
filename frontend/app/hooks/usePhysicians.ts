"use client";

import { useState, useEffect } from "react";
import { fetchPhysicians } from "../utils/api";
import { Physician } from "../types";

export function usePhysicians(city: string | null, state: string | null, specialty: string | null) {
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city || !state || !specialty) return;

    setLoading(true);
    fetchPhysicians(city, state, specialty)
      .then((data) => setPhysicians(data))
      .catch(() => setPhysicians([]))
      .finally(() => setLoading(false));
  }, [city, state, specialty]);

  return { physicians, loading };
}
