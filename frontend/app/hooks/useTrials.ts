"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTrials } from "../utils/api";
import { Trial } from "../types";

const PAGE_SIZE = 10;

export function useTrials(
  condition: string | null,
  city: string | null,
  state: string | null,
  specialty?: string,
  status?: string,
  phase?: string
) {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const hasAnyFilter = !!(condition || city || state || specialty || status || phase);

  const load = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (!condition && !city && !state && !specialty && !status && !phase) return;

      setLoading(true);
      setError(null);
      try {
        const offset = (pageNum - 1) * PAGE_SIZE;

        // FIX 1: city and state were being joined into a single string and passed
        // as the city param, with an empty string for state.
        // e.g. fetchTrials(cond, "boston, MA", "", ...) — state filter never worked.
        // Now city and state are passed as separate params as the API expects.
        //
        // FIX 2: status and phase were accepted by this hook but NEVER forwarded
        // to fetchTrials, so the backend never received them. Now passed correctly.
        const result = await fetchTrials(
          condition || "",
          city    || "",
          state   || "",
          specialty || undefined,
          PAGE_SIZE,
          status    || undefined,
          phase     || undefined,
          offset    || undefined
        );

        const fetched: Trial[] = result.trials ?? [];
        const total: number    = result.total   ?? fetched.length;

        setTrials(prev => replace ? fetched : [...prev, ...fetched]);
        setTotalCount(total);
        // FIX 3: hasMore was based on fetched.length === PAGE_SIZE which breaks
        // when the last page happens to be exactly PAGE_SIZE. Use total count instead.
        setHasMore((pageNum * PAGE_SIZE) < total);
      } catch {
        setError("Failed to load trials. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [condition, city, state, specialty, status, phase]
  );

  useEffect(() => {
    setPage(1);
    setTrials([]);
    setTotalCount(0);
    setHasMore(false);
    load(1, true);
  }, [condition, city, state, specialty, status, phase]);

  const refetch = () => {
    setPage(1);
    setTrials([]);
    setTotalCount(0);
    load(1, true);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next, false);
  };

  return { trials, loading, error, totalCount, hasMore, refetch, loadMore, hasAnyFilter };
}