import { supabase } from '@/integrations/supabase/client';
import type { OrganizationCredentialStatus, CredentialsSummary } from '@/types/tenstreet/service-types';

export type { OrganizationCredentialStatus, CredentialsSummary };

export class TenstreetCredentialsService {
  /**
   * Fetch all organizations with their Tenstreet credentials and sync status
   * Now uses optimized single RPC call instead of 5 separate queries
   */
  static async fetchOrganizationsWithCredentials(): Promise<OrganizationCredentialStatus[]> {
    try {
      const { data, error } = await supabase.rpc('get_organizations_credentials_summary');

      if (error) {
        console.error('Error fetching organizations credentials summary:', error);
        throw error;
      }

      // Transform database results to match interface
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        created_at: row.created_at,
        credential_id: row.credential_id,
        credential_status: row.credential_status as 'active' | 'inactive' | null,
        mode: row.mode as 'DEV' | 'TEST' | 'PROD' | null,
        api_endpoint: row.api_endpoint,
        credentials_updated: row.credentials_updated,
        total_applications: Number(row.total_applications),
        last_sync_time: row.last_sync_time,
        synced_count: Number(row.synced_count),
        connection_health: row.connection_health as 'active' | 'inactive' | 'error' | 'unknown',
      }));
    } catch (error) {
      console.error('Failed to fetch organization credentials:', error);
      throw error;
    }
  }

  /**
   * Get summary statistics
   */
  static async getSummaryStats(): Promise<CredentialsSummary> {
    const orgs = await this.fetchOrganizationsWithCredentials();

    const totalOrganizations = orgs.length;
    const configuredOrganizations = orgs.filter(o => o.credential_id).length;
    const pendingOrganizations = totalOrganizations - configuredOrganizations;

    // Recent sync activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentSyncActivity = orgs.filter(
      o => o.last_sync_time && o.last_sync_time > oneDayAgo
    ).length;

    return {
      totalOrganizations,
      configuredOrganizations,
      pendingOrganizations,
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
