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

export interface Physician {
  npi: string;
  name: string;
  credential: string;  // Added this field
  specialty: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  distance?: number;
  lat?: number;
  lon?: number;
}

export interface FilterState {
  condition: string;
  city: string;
  state: string;
  specialty: string;
  status: string;
  phase: string;
  radius: number;
}

export interface ApiResponse<T> {
  data: T;
  totalCount: number;
  error?: string;
}