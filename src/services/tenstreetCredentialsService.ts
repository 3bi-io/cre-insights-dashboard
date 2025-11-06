import { supabase } from '@/integrations/supabase/client';

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
  pendingConfiguration: number;
  recentSyncActivity: number;
}

export class TenstreetCredentialsService {
  /**
   * Fetch all organizations with their Tenstreet configuration status
   */
  static async fetchOrganizationsWithCredentials(): Promise<OrganizationCredentialStatus[]> {
    // First, get all organizations
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, created_at')
      .order('name');

    if (orgError) throw orgError;
    if (!organizations) return [];

    // Then get credentials for each organization
    const { data: credentials, error: credError } = await supabase
      .from('tenstreet_credentials')
      .select('id, organization_id, status, mode, api_endpoint, updated_at');

    if (credError) throw credError;

    // Get application sync statistics
    const { data: syncStats, error: syncError } = await supabase
      .from('applications')
      .select('job_listing_id, tenstreet_last_sync, tenstreet_sync_status');

    if (syncError) throw syncError;

    // Get job listings to map applications to organizations
    const { data: jobListings, error: jobError } = await supabase
      .from('job_listings')
      .select('id, organization_id');

    if (jobError) throw jobError;

    // Build a map of organization sync data
    const orgSyncMap = new Map<string, { total: number; synced: number; lastSync: string | null }>();

    syncStats?.forEach(app => {
      const job = jobListings?.find(jl => jl.id === app.job_listing_id);
      if (!job) return;

      const orgId = job.organization_id;
      const existing = orgSyncMap.get(orgId) || { total: 0, synced: 0, lastSync: null };
      
      existing.total++;
      if (app.tenstreet_sync_status === 'synced') existing.synced++;
      if (app.tenstreet_last_sync && (!existing.lastSync || app.tenstreet_last_sync > existing.lastSync)) {
        existing.lastSync = app.tenstreet_last_sync;
      }

      orgSyncMap.set(orgId, existing);
    });

    // Combine all data
    const results: OrganizationCredentialStatus[] = organizations.map(org => {
      const cred = credentials?.find(c => c.organization_id === org.id);
      const syncData = orgSyncMap.get(org.id) || { total: 0, synced: 0, lastSync: null };

      // Determine connection health
      let connectionHealth: OrganizationCredentialStatus['connection_health'] = 'unknown';
      if (cred) {
        if (cred.status === 'inactive') {
          connectionHealth = 'error';
        } else if (syncData.lastSync) {
          const daysSinceSync = Math.floor(
            (Date.now() - new Date(syncData.lastSync).getTime()) / (1000 * 60 * 60 * 24)
          );
          connectionHealth = daysSinceSync <= 7 ? 'active' : 'inactive';
        } else {
          connectionHealth = 'inactive';
        }
      }

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        created_at: org.created_at,
        credential_id: cred?.id || null,
        credential_status: (cred?.status as 'active' | 'inactive') || null,
        mode: (cred?.mode as 'DEV' | 'TEST' | 'PROD') || null,
        api_endpoint: cred?.api_endpoint || null,
        credentials_updated: cred?.updated_at || null,
        total_applications: syncData.total,
        last_sync_time: syncData.lastSync,
        synced_count: syncData.synced,
        connection_health: connectionHealth,
      };
    });

    return results;
  }

  /**
   * Get summary statistics
   */
  static async getSummaryStats(): Promise<CredentialsSummary> {
    const orgs = await this.fetchOrganizationsWithCredentials();

    const totalOrganizations = orgs.length;
    const configuredOrganizations = orgs.filter(o => o.credential_id).length;
    const pendingConfiguration = totalOrganizations - configuredOrganizations;

    // Recent sync activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentSyncActivity = orgs.filter(
      o => o.last_sync_time && o.last_sync_time > oneDayAgo
    ).length;

    return {
      totalOrganizations,
      configuredOrganizations,
      pendingConfiguration,
      recentSyncActivity,
    };
  }

  /**
   * Export configuration report as CSV
   */
  static exportToCSV(organizations: OrganizationCredentialStatus[]): void {
    const headers = [
      'Organization Name',
      'Slug',
      'Configuration Status',
      'Connection Health',
      'Environment',
      'API Endpoint',
      'Last Sync Time',
      'Total Applications',
      'Synced Count'
    ];

    const rows = organizations.map(org => [
      org.name,
      org.slug,
      org.credential_id ? 'Configured' : 'Not Configured',
      org.connection_health,
      org.mode || 'N/A',
      org.api_endpoint || 'N/A',
      org.last_sync_time || 'Never',
      org.total_applications.toString(),
      org.synced_count.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tenstreet-credentials-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
