export type Trial = {
  nctId: string;
  title: string;
  status: string;
  description?: string;
  conditions?: string[];
  sponsor?: string;
  phases?: string[];
  locations?: {
    facility?: string;
    city?: string;
    state?: string;
    country?: string;
    status?: string;
  }[];
  inclusionCriteria?: string;
  exclusionCriteria?: string;
  pointOfContact?: {
    name?: string;
    role?: string;
    phone?: string;
    email?: string;
  } | null;
  physicians?: {
    npi: string;
    name: string;
    specialty?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    distance_km?: number | null;
  }[];
  contactsLocationsModule?: {
    locations?: {
      geoPoint?: { lat?: number; lon?: number };
      facility?: string;
      city?: string;
      state?: string;
      country?: string;
    }[];
    centralContacts?: {
      name?: string;
      role?: string;
      phone?: string;
      email?: string;
    }[];
  };
};

export type Physician = {
  npi: string;
  name: string;
  specialty?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  distance_km?: number | null;
};