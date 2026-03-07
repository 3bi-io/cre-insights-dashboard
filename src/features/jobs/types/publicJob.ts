/**
 * Type definitions for public job listings
 * Used on the /jobs page and related public-facing components
 */

export interface PublicJobOrganization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
}

export interface PublicJobClient {
  id: string;
  name: string;
  logo_url?: string | null;
}

export interface PublicJobCategory {
  name: string;
}

export interface PublicJobVoiceAgent {
  global: boolean;
}

/**
 * Represents a job listing as returned from the public jobs query
 */
export interface PublicJob {
  id: string;
  title?: string | null;
  job_title?: string | null;
  job_summary?: string | null;
  description?: string | null;
  city?: string | null;
  state?: string | null;
  location?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_type?: string | null;
  job_type?: string | null;
  created_at: string;
  dest_city?: string | null;
  dest_state?: string | null;
  organization_id?: string | null;
  client_id?: string | null;
  client_id?: string | null;
  organizations?: PublicJobOrganization | null;
  clients?: PublicJobClient | null;
  job_categories?: PublicJobCategory | null;
  voiceAgent?: PublicJobVoiceAgent;
}

/**
 * Sort options for public job listings
 */
export type PublicJobSortOption = 'recent' | 'title' | 'salary-high' | 'salary-low';

/**
 * Filter state for public jobs page
 */
export interface PublicJobFilters {
  searchTerm: string;
  locationFilter: string;
  clientFilter: string;
  categoryFilter: string;
  sortBy: PublicJobSortOption;
}

/**
 * Client option for filter dropdown
 */
export interface PublicClientOption {
  id: string;
  name: string;
  logo_url?: string | null;
}
