export interface User {
  id: string;
  name: string;
  email?: string;
  role: "REPORTER" | "ADMIN";
}

export interface Location {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Report {
  _id?: string;
  userId?: string;
  description: string;
  image?: string;
  location: Location;
  emergencyType?: string;
  incidentId?: string;
  createdAt?: string;
  status?: string;
}

export interface Incident {
  _id: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  location: Location;
  summary: string;
  status: "REPORTED" | "VERIFIED" | "RESPONDING" | "RESOLVED";
  reportCount: number;
  reportIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface IncidentsResponse {
  stats: {
    total: number;
    active: number;
    critical: number;
  };
  incidents: Incident[];
}
