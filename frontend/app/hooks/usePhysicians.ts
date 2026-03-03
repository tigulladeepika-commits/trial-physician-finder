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

  // FIX: Derive a stable primitive key instead of using JSON.stringify() inside
  // the dependency array. JSON.stringify creates a new string reference on every
  // render even when data hasn't changed, causing missed or duplicate fetches.
  const locationKey = locations
    ? locations.map((l) => `${l.city.toLowerCase()},${l.state.toLowerCase()}`).join("|")
    : "";

  useEffect(() => {
    setLoading(true);
    setPhysicians([]);

    const fetchAll = async () => {
      try {
        if (locations && locations.length > 0) {
          const uniqueLocations = deduplicateLocations(locations);
          const allResults = await Promise.all(
            uniqueLocations.map(({ city, state }) =>
              fetchPhysicians(city, state, condition ?? "")
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
          const results = await fetchPhysicians(undefined, undefined, condition ?? "");
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
  }, [locationKey, condition]); // ✅ stable primitive deps — no more JSON.stringify

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