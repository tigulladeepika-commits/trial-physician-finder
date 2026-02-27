const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://trial-physician-finder.onrender.com";

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

export async function fetchPhysicians(
  city: string,
  state: string,
  specialty: string
) {
  const params = new URLSearchParams({ city, state, specialty });

  const res = await fetch(`${baseUrl}/api/physicians/?${params}`);
  if (!res.ok) {
    console.error(`Physicians API error: ${res.status}`);
    return [];
  }
  const data = await res.json();
  return data.results ?? [];
}
