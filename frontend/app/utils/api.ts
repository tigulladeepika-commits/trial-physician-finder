export async function fetchTrials(condition: string, state: string, specialty?: string, limit?: number) {
  const params = new URLSearchParams({ condition, state });
  if (specialty) params.append("specialty", specialty);
  if (limit) params.append("limit", String(limit));

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9000";
  const res = await fetch(`${baseUrl}/api/trials?${params}`);
  return res.json();
}