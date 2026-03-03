"use client";

import { useState, useEffect, useRef } from "react";
import { fetchPhysicians } from "../utils/api";
import { Physician } from "../types";

export function usePhysicians(
  locations: Array<{ city: string; state: string }> | null,
  condition?: string | null,
  specialty?: string | null,   // ← now accepted directly so filter changes re-fetch
  radius?: number | null,
) {
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable serialised keys — avoids the JSON.stringify-in-deps footgun
  const locKey = locations
    ? [...locations]
        .sort((a, b) => `${a.city}${a.state}`.localeCompare(`${b.city}${b.state}`))
        .map(({ city, state }) => `${city.toLowerCase()},${state.toLowerCase()}`)
        .join("|")
    : "";

  // Track the latest request so stale responses from earlier fetches are ignored
  const requestId = useRef(0);

  useEffect(() => {
    const currentId = ++requestId.current;

    setLoading(true);
    setError(null);
    setPhysicians([]);

    const fetchAll = async () => {
      try {
        let results: Physician[];

        if (locations && locations.length > 0) {
          const uniqueLocations = deduplicateLocations(locations);

          const batches = await Promise.all(
            uniqueLocations.map(({ city, state }) =>
              fetchPhysicians(city, state, condition ?? "", specialty ?? "", radius ?? undefined)
            )
          );

          const seen = new Set<string>();
          results = [];
          for (const batch of batches) {
            for (const doc of batch) {
              if (!seen.has(doc.npi)) {
                seen.add(doc.npi);
                results.push(doc);
              }
            }
          }
        } else {
          results = await fetchPhysicians(
            undefined,
            undefined,
            condition ?? "",
            specialty ?? "",
            radius ?? undefined,
          );
        }

        // Ignore result if a newer request has already been fired
        if (currentId !== requestId.current) return;

        setPhysicians(results);
      } catch (err) {
        if (currentId !== requestId.current) return;
        console.error("Failed to fetch physicians:", err);
        setError("Failed to load physicians. Please try again.");
        setPhysicians([]);
      } finally {
        if (currentId === requestId.current) setLoading(false);
      }
    };

    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locKey, condition, specialty, radius]);

  return { physicians, loading, error };
}

function deduplicateLocations(locations: Array<{ city: string; state: string }>) {
  const seen = new Set<string>();
  return locations.filter(({ city, state }) => {
    const key = `${city.toLowerCase()},${state.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}