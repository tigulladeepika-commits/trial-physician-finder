// app/utils/api.ts
export async function fetchTrials(condition: string, state: string, specialty?: string, limit?: number) {
  const params = new URLSearchParams({ condition, state });
  if (specialty) params.append("specialty", specialty);
  if (limit) params.append("limit", String(limit));

  const res = await fetch(`http://127.0.0.1:9000/api/trials?${params}`);
  return res.json();
}