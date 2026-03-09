/**
 * PLACE THIS FILE AT: frontend/app/utils/geocode.ts
 *
 * All geocoding in this app uses Geoapify ONLY.
 */

const GEO_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY ?? "";

// In-memory cache — avoids re-geocoding the same city/state within a session
const geoCache = new Map<string, [number, number] | null>();

/**
 * Geocode a US city + optional state string using Geoapify.
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

  const cityClean  = (city  || "").trim();
  const stateClean = (state || "").trim();

  if (!cityClean && !stateClean) return null;

  const cacheKey = (cityClean + "|" + stateClean).toLowerCase();
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey)!;

  try {
    // Build query string — omit state segment if empty so Geoapify
    // doesn't get confused by "portland, , USA" and pick the wrong city.
    const queryParts = [cityClean, stateClean, "USA"].filter(Boolean);
    const query = encodeURIComponent(queryParts.join(", "));

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
      console.warn("[geocode] No result for:", cityClean, stateClean);
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