import { useState, useEffect } from "react";
import { fetchTrials } from "../utils/api";
import { Trial } from "../types";

export function useTrials(condition: string | null, state: string | null, specialty?: string, limit?: number) {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!condition || !state) return;

    setLoading(true);
    fetchTrials(condition, state, specialty, limit)
      .then((data) => setTrials(data))
      .catch(() => setTrials([]))
      .finally(() => setLoading(false));
  }, [condition, state, specialty, limit]);

  return { trials, loading };
}