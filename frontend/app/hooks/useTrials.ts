"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchTrials } from "../utils/api";
import { Trial } from "../types";

export interface UseTrialsResult {
  trials: Trial[];
  loading: boolean;
  totalCount: number;
  error: string | null;
  refetch: () => void;
  hasMore: boolean;
  loadMore: () => void;
}

export function useTrials(
  condition: string | null,
  city: string | null,
  state: string | null,
  specialty?: string,
  status?: string,
  phase?: string,
  limit: number = 20,
  offset: number = 0
): UseTrialsResult {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const isInitialMount = useRef(true);

  const locationStr = [city, state].filter(Boolean).join(", ");

  const fetch = useCallback(async () => {
    if (!condition) {
      setTrials([]);
      setTotalCount(0);
      setHasMore(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [data, total] = await fetchTrials(
        condition,
        locationStr || "",
        status || "",
        phase || "",
        specialty || "",
        limit,
        offset
      );

      if (offset === 0) {
        setTrials(data);
      } else {
        setTrials((prev) => [...prev, ...data]);
      }

      setTotalCount(total);
      setHasMore(data.length > 0 && data.length === limit);
    } catch (err) {
      console.error("Failed to fetch trials:", err);
      setError("Failed to load trials. Please try again.");
      setTrials([]);
    } finally {
      setLoading(false);
    }
  }, [condition, city, state, status, phase, specialty, limit, offset, locationStr]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetch();
  }, [fetch]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetch();
    }
  }, [loading, hasMore, fetch]);

  const refetch = useCallback(() => {
    setTrials([]);
    setTotalCount(0);
    setHasMore(true);
    fetch();
  }, [fetch]);

  return {
    trials,
    loading,
    totalCount,
    error,
    refetch,
    hasMore,
    loadMore,
  };
}