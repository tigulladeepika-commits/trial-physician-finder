export async function fetchTrials(condition: string, city: string, state: string, specialty?: string, limit?: number) {
  const params = new URLSearchParams({ condition, city, state });
  if (specialty) params.append("specialty", specialty);
  if (limit) params.append("limit", String(limit));

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://trial-physician-finder.onrender.com";
  const res = await fetch(`${baseUrl}/api/trials/?${params}`);
  const data = await res.json();
  return data.trials ?? [];
}