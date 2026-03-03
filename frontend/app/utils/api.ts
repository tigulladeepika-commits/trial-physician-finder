export interface Trial {
  nctId: string;
  title: string;
  status: string;
  description: string;
  conditions: string[];
  sponsor: string;
  phases: string[];
  locations: TrialLocation[];
  inclusionCriteria: string;
  exclusionCriteria: string;
  pointOfContact?: {
    name: string;
    role: string;
    phone: string;
    email: string;
  };
}

export interface TrialLocation {
  facility: string;
  city: string;
  state: string;
  country: string;
  status: string;
  lat: number | null;
  lon: number | null;
}

export interface FetchTrialsParams {
  condition: string;
  location: string;
  status: string;
  phase: string;
  specialty: string;
  limit: number;
  offset: number;
}

export async function fetchTrials(
  condition: string,
  location: string,
  status: string,
  phase: string,
  specialty: string,
  limit: number,
  offset: number
): Promise<[Trial[], number]> {
  const params = new URLSearchParams({
    condition: condition.trim(),
    location: location.trim(),
    status: status.trim(),
    phase: phase.trim(),
    specialty: specialty.trim(),
    limit: limit.toString(),
    offset: offset.toString(),
  });

  try {
    const response = await fetch(`/api/trials?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    // Handle both array and object responses
    if (Array.isArray(data)) {
      return [data, 0];
    }

    if (data.trials && typeof data.totalCount === "number") {
      return [data.trials, data.totalCount];
    }

    // Fallback: assume data is the trials array
    return [data, data.length];
  } catch (error) {
    console.error("API fetch error:", error);
    throw error;
  }
}