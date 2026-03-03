const baseUrl =
  process.env.NEXT_PUBLIC_API_URL || "https://trial-physician-finder.onrender.com";

/**
 * Fetch clinical trials from the backend.
 * city and state are passed as separate params so the backend can
 * combine/expand them correctly via _expand_location().
 */
export async function fetchTrials(
  condition: string,
  city: string,
  state: string,
  specialty?: string,
  limit?: number,
) {
  const params = new URLSearchParams({ condition });

  // Only append if non-empty — avoids sending "city=" blank strings
  if (city?.trim())  params.append("city", city.trim());
  if (state?.trim()) params.append("state", state.trim());
  if (specialty?.trim()) params.append("specialty", specialty.trim());
  if (limit && limit > 0) params.append("limit", String(limit));

  const res = await fetch(`${baseUrl}/api/trials/?${params}`);
  if (!res.ok) {
    console.error(`Trials API error: ${res.status}`);
    return [];
  }
  const data = await res.json();
  return data.trials ?? [];
}

/**
 * Fetch physicians near a location for a given condition.
 * - condition: plain text (e.g. "diabetes") — backend maps to specialty
 * - specialty: optional override — if the user has explicitly picked one
 * - radius: search radius in km
 */
export async function fetchPhysicians(
  city?: string,
  state?: string,
  condition?: string,
  specialty?: string,   // ← explicit specialty filter (from PhysicianFilters)
  radius?: number,      // ← radius filter (from PhysicianFilters)
) {
  const params = new URLSearchParams();

  if (city?.trim())      params.append("city", city.trim());
  if (state?.trim())     params.append("state", state.trim());
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