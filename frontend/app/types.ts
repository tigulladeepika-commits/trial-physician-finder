export type Physician = {
  id: string;
  npi: string;
  name: string;
  city: string;
  state: string;
  specialty: string;
  gender: string;
};

export type Trial = {
  lat: number;
  lng: number;
  locations: { lat: number; lng: number }[];
  physicians: Physician[];
  protocolSection: {
    identificationModule: { nctId: string; briefTitle: string };
    statusModule: { overallStatus: string };
  };
};