"use client";

import { useState, useEffect, useRef } from "react";
import { fetchTrials } from "../utils/api";
import { Trial } from "../types";

const DEBOUNCE_MS = 400;

export function useTrials(
  condition: string | null,
  city: string | null,
  state: string | null,
  specialty?: string,
  limit?: number,
) {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);

  useEffect(() => {
    if (!condition?.trim()) {
      setTrials([]);
      return;
    }

    const currentId = ++requestId.current;
    setError(null);

    // Debounce so rapid typing doesn't fire a request on every keystroke
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Pass city and state separately — the backend combines them
        const data: Trial[] = await fetchTrials(
          condition,
          city ?? "",
          state ?? "",
          specialty,
          limit,
        );

        if (currentId !== requestId.current) return;
        setTrials(data);
      } catch (err) {
        if (currentId !== requestId.current) return;
        console.error("Failed to fetch trials:", err);
        setError("Failed to load trials. Please try again.");
        setTrials([]);
      } finally {
        if (currentId === requestId.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [condition, city, state, specialty, limit]);

  return { trials, loading, error };
}