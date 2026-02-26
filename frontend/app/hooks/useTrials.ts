"use client";

import { useState, useEffect } from "react";
import { fetchTrials } from "../utils/api";
import { Trial } from "../types";

export function useTrials(condition: string, state: string, specialty?: string, limit?: number) {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrials(condition, state, specialty, limit).then((data) => {
      setTrials(data);
      setLoading(false);
    });
  }, [condition, state, specialty, limit]);

  return { trials, loading };
}