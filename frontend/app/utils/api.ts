/**
 * api.ts
 * Pure data-fetching utilities.
 * No geocoding here — all geocoding is handled by utils/geocode.ts (Geoapify only).
 */

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL || "https://trial-physician-finder.onrender.com";

export async function fetchTrials(
  condition: string,
  city: string,
  state: string,
  specialty?: string,
  limit?: number,
  // FIX: Added status, phase, offset — previously missing entirely.
  // useTrials was passing them to this function's call site but this
  // function never added them to the URL, so the backend never saw them.
  status?: string,
  phase?: string,
  offset?: number
) {
  const params = new URLSearchParams({ condition });

  // FIX: city and state sent as separate params, not joined.
  // useTrials was doing: fetchTrials(condition, "boston, MA", "", ...)
  // which sent city="boston, MA" and state="" — backend location filter broken.
  if (city)  params.append("city",  city);
  if (state) params.append("state", state);

  if (specialty) params.append("specialty", specialty);
  if (limit)     params.append("limit",     String(limit));
  if (offset)    params.append("offset",    String(offset));

  // FIX: status and phase now actually sent to the backend
  if (status && status !== "all" && status !== "") params.append("status", status);
  if (phase  && phase  !== "all" && phase  !== "") params.append("phase",  phase);

  const res = await fetch(`${baseUrl}/api/trials/?${params}`);
  if (!res.ok) {
    console.error(`Trials API error: ${res.status}`);
    throw new Error(`Failed to fetch trials: ${res.status}`);
  }
  const data = await res.json();
  // Return both trials and totalCount so useTrials can paginate correctly
  return { trials: data.trials ?? [], total: data.pagination?.total ?? 0 };
}

/**
 * Fetch physicians near a city/state for a given condition.
 * Omit city + state to get national results.
 * Note: coordinate resolution for map display is done separately via geocode.ts.
 */
export async function fetchPhysicians(
  city?: string,
  state?: string,
  condition?: string
) {
  const params = new URLSearchParams();
  if (city)      params.append("city",      city);
  if (state)     params.append("state",     state);
  if (condition) params.append("condition", condition);

  const res = await fetch(`${baseUrl}/api/physicians/?${params}`);
  if (!res.ok) {
    console.error(`Physicians API error: ${res.status}`);
    return [];
  }
  const data = await res.json();
  return data.results ?? [];
}