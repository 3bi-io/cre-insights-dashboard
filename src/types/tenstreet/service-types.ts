/**
 * Tenstreet Service Layer Types
 * Types used by the service layer for optimized queries
 */

export interface OrganizationCredentialStatus {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  credential_id: string | null;
  credential_status: 'active' | 'inactive' | null;
  mode: 'DEV' | 'TEST' | 'PROD' | null;
  api_endpoint: string | null;
  credentials_updated: string | null;
  total_applications: number;
  last_sync_time: string | null;
  synced_count: number;
  connection_health: 'active' | 'inactive' | 'error' | 'unknown';
}

export interface CredentialsSummary {
  totalOrganizations: number;
  configuredOrganizations: number;
  pendingOrganizations: number; // Changed from pendingConfiguration
  recentSyncActivity: number;
}
