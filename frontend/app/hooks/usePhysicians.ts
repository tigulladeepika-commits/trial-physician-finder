"use client";

import { useState, useEffect } from "react";
import { fetchPhysicians } from "../utils/api";
import { Physician } from "../types";

export function usePhysicians(
  locations: Array<{ city: string; state: string }> | null,
  condition?: string | null,
) {
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPhysicians([]);

    const fetchAll = async () => {
      try {
        if (locations && locations.length > 0) {
          const uniqueLocations = deduplicateLocations(locations);
          const allResults = await Promise.all(
            uniqueLocations.map(({ city, state }) =>
              fetchPhysicians(city, state, condition ?? undefined)
            )
          );

          const seen = new Set<string>();
          const merged: Physician[] = [];
          for (const batch of allResults) {
            for (const doc of batch) {
              if (!seen.has(doc.npi)) {
                seen.add(doc.npi);
                merged.push(doc);
              }
            }
          }
          setPhysicians(merged);
        } else {
          const results = await fetchPhysicians(undefined, undefined, condition ?? undefined);
          setPhysicians(results);
        }
      } catch (err) {
        console.error("Failed to fetch physicians:", err);
        setPhysicians([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [JSON.stringify(locations), condition]);

  return { physicians, loading };
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