export interface TrialLocation {
  facility?: string;
  city?: string;
  state?: string;
  country?: string;
  status?: string;
  lat?: number;
  lon?: number;
}

export interface PointOfContact {
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
}

export interface Trial {
  nctId?: string;
  title?: string;
  status: string;
  description?: string;
  conditions?: string[];
  sponsor?: string;
  phases?: string[];
  locations?: TrialLocation[];
  inclusionCriteria?: string;
  exclusionCriteria?: string;
  pointOfContact?: PointOfContact;
}

export interface Physician {
  npi: string;
  name: string;
  credential?: string;           // e.g. "MD", "DO"
  city?: string;
  state?: string;
  address?: string;
  postal_code?: string;
  specialty?: string;
  taxonomyCode?: string;         // e.g. "207RH0003X"
  taxonomyDescription?: string;  // e.g. "Hematology & Oncology"
  lat?: number;
  lon?: number;
  distance_km?: number;
}