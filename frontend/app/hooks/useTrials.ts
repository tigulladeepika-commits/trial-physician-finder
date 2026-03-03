"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchTrials } from "../utils/api";
import { Trial } from "../types";

const DEBOUNCE_MS = 450;
const PAGE_SIZE = 10;

export function useTrials(
  condition: string | null,
  city: string | null,
  state: string | null,
  specialty?: string,
  status?: string,
  phase?: string,
) {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const requestId = useRef(0);

  // Core fetch — exported so page.tsx refetch button works
  const doFetch = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!condition?.trim()) {
        setTrials([]); setTotalCount(0); return;
      }
      const currentId = ++requestId.current;
      setLoading(true);
      setError(null);

      try {
        const data = await fetchTrials(
          condition,
          city ?? "",
          state ?? "",
          specialty,
          PAGE_SIZE,
          (pageNum - 1) * PAGE_SIZE,
          status,
          phase,
        );

        if (currentId !== requestId.current) return;

        // Backend returns { trials, totalCount } or just an array
        const newTrials: Trial[] = Array.isArray(data) ? data : (data.trials ?? []);
        const total: number = Array.isArray(data) ? newTrials.length : (data.totalCount ?? newTrials.length);

        setTrials((prev) => append ? [...prev, ...newTrials] : newTrials);
        setTotalCount(total);
      } catch (err) {
        if (currentId !== requestId.current) return;
        console.error("Failed to fetch trials:", err);
        setError("Failed to load trials. Please try again.");
      } finally {
        if (currentId === requestId.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [condition, city, state, specialty, status, phase]
  );

  // Reset to page 1 and re-fetch whenever filters change (debounced)
  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => doFetch(1, false), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [doFetch]);

  const refetch = useCallback(() => {
    setPage(1);
    doFetch(1, false);
  }, [doFetch]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    doFetch(next, true);
  }, [page, doFetch]);

  const hasMore = trials.length < totalCount;

  return { trials, loading, error, totalCount, hasMore, refetch, loadMore };
}