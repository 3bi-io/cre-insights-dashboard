export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  organization_id: string | null;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  status?: string;
}

export interface UpdateClientData extends CreateClientData {
  id: string;
}

export interface ConsolidatedClient {
  name: string;
  locations: string[];
  totalLocations: number;
  status: string;
  latestDate: string;
  emails: string[];
  phones: string[];
}

export interface ClientFilters {
  search?: string;
  status?: string;
  location?: string;
}