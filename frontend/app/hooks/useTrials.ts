"use client";

import { useState, useEffect } from "react";
import { fetchTrials } from "../utils/api";
import { Trial } from "../types";

export function useTrials(
  condition: string | null,
  city: string | null,
  state: string | null,
  specialty?: string,
  limit?: number
) {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!condition) return;

    setLoading(true);
    fetchTrials(condition, city ?? "", state ?? "", specialty, limit)
      .then((data: Trial[]) => setTrials(data))
      .catch(() => setTrials([]))
      .finally(() => setLoading(false));
  }, [condition, city, state, specialty, limit]);

  return { trials, loading };
}