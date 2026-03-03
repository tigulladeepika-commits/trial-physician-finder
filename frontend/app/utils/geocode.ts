/**
 * geocode.ts
 * All geocoding in this app goes through Geoapify ONLY.
 * MapQuest is never used for geocoding — only for map tile display.
 */

const GEO_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY ?? "";

// Simple in-memory cache so we don't re-geocode the same city/state
const cache = new Map<string, [number, number] | null>();

/**
 * Geocode a city + state (US) using Geoapify.
 * Returns [lat, lon] or null if not found / key missing.
 */
export async function geocodeCity(
  city: string,
  state: string
): Promise<[number, number] | null> {
  if (!GEO_KEY) {
    console.warn("[geocode] NEXT_PUBLIC_GEOAPIFY_KEY is not set.");
    return null;
  }

  const key = (city + "," + state).toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  try {
    const query = encodeURIComponent(city + ", " + state + ", USA");
    const url =
      "https://api.geoapify.com/v1/geocode/search" +
      "?text=" + query +
      "&limit=1" +
      "&filter=countrycode:us" +
      "&apiKey=" + GEO_KEY;

    const res = await fetch(url);
    if (!res.ok) {
      console.error("[geocode] Geoapify HTTP error:", res.status);
      cache.set(key, null);
      return null;
    }

    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature) {
      cache.set(key, null);
      return null;
    }

    const [lon, lat] = feature.geometry.coordinates as [number, number];
    const result: [number, number] = [lat, lon];
    cache.set(key, result);
    return result;
  } catch (err) {
    console.error("[geocode] Geoapify request failed:", err);
    cache.set(key, null);
    return null;
  }
}

/**
 * Geocode a full address string using Geoapify.
 * Useful when you have street-level detail.
 */
export async function geocodeAddress(
  address: string
): Promise<[number, number] | null> {
  if (!GEO_KEY) {
    console.warn("[geocode] NEXT_PUBLIC_GEOAPIFY_KEY is not set.");
    return null;
  }

  const key = address.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  try {
    const query = encodeURIComponent(address);
    const url =
      "https://api.geoapify.com/v1/geocode/search" +
      "?text=" + query +
      "&limit=1" +
      "&apiKey=" + GEO_KEY;

    const res = await fetch(url);
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }

    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature) {
      cache.set(key, null);
      return null;
    }

    const [lon, lat] = feature.geometry.coordinates as [number, number];
    const result: [number, number] = [lat, lon];
    cache.set(key, result);
    return result;
  } catch (err) {
    console.error("[geocode] Geoapify address request failed:", err);
    cache.set(key, null);
    return null;
  }
}

/** Haversine distance between two lat/lon points in km */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}