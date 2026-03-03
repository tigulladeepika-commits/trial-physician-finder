/**
 * PLACE THIS FILE AT: frontend/app/utils/geocode.ts
 *
 * All geocoding in this app uses Geoapify ONLY.
 * MapQuest is NEVER called for geocoding — only for map tiles and marker icons.
 */

const GEO_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY ?? "";

// In-memory cache — avoids re-geocoding the same city/state within a session
const geoCache = new Map<string, [number, number] | null>();

/**
 * Geocode a US city + state string using Geoapify.
 * Returns [lat, lon] or null if not found.
 */
export async function geocodeCity(
  city: string,
  state: string
): Promise<[number, number] | null> {
  if (!GEO_KEY) {
    console.warn(
      "[geocode] NEXT_PUBLIC_GEOAPIFY_KEY is not set. " +
      "Add it to .env.local and Vercel environment variables."
    );
    return null;
  }

  const cacheKey = (city + "|" + state).toLowerCase().trim();
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey)!;

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
      console.error("[geocode] Geoapify responded with HTTP", res.status);
      geoCache.set(cacheKey, null);
      return null;
    }

    const data = await res.json();
    const feature = data?.features?.[0];

    if (!feature) {
      console.warn("[geocode] No result for:", city, state);
      geoCache.set(cacheKey, null);
      return null;
    }

    // Geoapify returns [longitude, latitude] — swap to [lat, lon]
    const [lon, lat] = feature.geometry.coordinates as [number, number];
    const result: [number, number] = [lat, lon];
    geoCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error("[geocode] Geoapify fetch failed:", err);
    geoCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Haversine formula — straight-line distance between two lat/lon points in km.
 * Used for radius filtering on the map.
 */
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