export type Physician = {
  npi: string;
  name: string;
  city: string;
  state: string;
  address: string;
  postal_code: string;
  specialty: string;
  lat: number | null;
  lon: number | null;
  distance_km: number;
};

export type Trial = {
  nctId: string;
  title: string;
  status: string;
  description: string;
  conditions: string[];
  sponsor: string;
  contactsLocationsModule: {
    locations: {
      city: string;
      state: string;
      geoPoint: { lat: number; lon: number };
    }[];
  };
  physicians: Physician[];
};