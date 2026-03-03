const baseUrl =
  process.env.NEXT_PUBLIC_API_URL || "https://trial-physician-finder.onrender.com";

/**
 * Fetch clinical trials.
 * Returns { trials: Trial[], totalCount: number } from the backend.
 */
export async function fetchTrials(
  condition: string,
  city: string,
  state: string,
  specialty?: string,
  limit?: number,
  offset?: number,
  status?: string,
  phase?: string,
) {
  const params = new URLSearchParams({ condition });

  if (city?.trim())      params.append("city", city.trim());
  if (state?.trim())     params.append("state", state.trim());
  if (specialty?.trim()) params.append("specialty", specialty.trim());
  if (status?.trim())    params.append("status", status.trim());
  if (phase?.trim())     params.append("phase", phase.trim());
  if (limit  && limit  > 0) params.append("limit",  String(limit));
  if (offset && offset > 0) params.append("offset", String(offset));

  const res = await fetch(`${baseUrl}/api/trials/?${params}`);
  if (!res.ok) {
    console.error(`Trials API error: ${res.status}`);
    return { trials: [], totalCount: 0 };
  }
  return res.json(); // expects { trials: [], totalCount: number }
}

/**
 * Fetch physicians near a location.
 * - condition: plain text — backend maps to specialty
 * - specialty: explicit override from dropdown
 * - radius: km radius from city centre
 */
export async function fetchPhysicians(
  city?: string,
  state?: string,
  condition?: string,
  specialty?: string,
  radius?: number,
) {
  const params = new URLSearchParams();

  if (city?.trim())      params.append("city",      city.trim());
  if (state?.trim())     params.append("state",     state.trim());
  if (condition?.trim()) params.append("condition", condition.trim());
  if (specialty?.trim()) params.append("specialty", specialty.trim());
  if (radius && radius > 0) params.append("radius", String(radius));

  const res = await fetch(`${baseUrl}/api/physicians/?${params}`);
  if (!res.ok) {
    console.error(`Physicians API error: ${res.status}`);
    return [];
  }
  const data = await res.json();
  return data.results ?? [];
}