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

  const load = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (!condition) return;
      setLoading(true);
      setError(null);
      try {
        const locationStr = [city, state].filter(Boolean).join(", ");
        const data: Trial[] = await fetchTrials(
          condition,
          locationStr || "",
          "",
          specialty,
          PAGE_SIZE
        );
        const fetched = data ?? [];
        setTrials(prev => replace ? fetched : [...prev, ...fetched]);
        setTotalCount(prev => replace ? fetched.length : prev + fetched.length);
        setHasMore(fetched.length === PAGE_SIZE);
      } catch (e) {
        setError("Failed to load trials. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [condition, city, state, specialty]
  );

  useEffect(() => {
    setPage(1);
    setTrials([]);
    setTotalCount(0);
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

  return { trials, loading, error, totalCount, hasMore, refetch, loadMore };
}