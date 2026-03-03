const baseUrl =
  process.env.NEXT_PUBLIC_API_URL || "https://trial-physician-finder.onrender.com";

export async function fetchTrials(
  condition: string,
  city: string,
  state: string,
  specialty?: string,
  limit?: number
) {
  const params = new URLSearchParams({ condition, city, state });
  if (specialty) params.append("specialty", specialty);
  if (limit) params.append("limit", String(limit));

  const res = await fetch(`${baseUrl}/api/trials/?${params}`);
  const data = await res.json();
  return data.trials ?? [];
}

// All params optional — omit city+state for national results
export async function fetchPhysicians(
  city?: string,
  state?: string,
  condition?: string  // sent as "condition", mapped to specialty on backend
) {
  const params = new URLSearchParams();
  if (city) params.append("city", city);
  if (state) params.append("state", state);
  if (condition) params.append("condition", condition);

  const res = await fetch(`${baseUrl}/api/physicians/?${params}`);
  if (!res.ok) {
    console.error(`Physicians API error: ${res.status}`);
    return [];
  }
  const data = await res.json();
  return data.results ?? [];
}