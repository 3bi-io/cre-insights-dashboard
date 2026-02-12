import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { PortfolioClientRow, PortfolioSummary, DateRange } from '../types/clientAnalytics.types';

interface UseClientPortfolioAnalyticsReturn {
  clients: PortfolioClientRow[];
  summary: PortfolioSummary;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

function getDateCutoff(range: DateRange): Date | null {
  if (range === 'all') return null;
  const now = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  now.setDate(now.getDate() - days);
  return now;
}

export function useClientPortfolioAnalytics(dateRange: DateRange = '30d'): UseClientPortfolioAnalyticsReturn {
  const { organization } = useAuth();
  const cutoff = getDateCutoff(dateRange);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['client-portfolio-analytics', organization?.id, dateRange],
    queryFn: async () => {
      if (!organization?.id) return { clients: [], summary: emptySummary() };

      // Fetch clients with jobs and applications
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id, name, status, logo_url, city, state,
          job_listings (
            id, status,
            applications (
              id, applied_at, status, source,
              ats_readiness_score, first_response_at
            )
          )
        `)
        .eq('organization_id', organization.id)
        .order('name');

      if (clientsError) throw new Error(clientsError.message);

      // Fetch ATS sync logs for this org's connections
      const { data: atsConnections } = await supabase
        .from('ats_connections')
        .select('id')
        .eq('organization_id', organization.id);

      const connectionIds = (atsConnections || []).map(c => c.id);

      let syncLogs: any[] = [];
      if (connectionIds.length > 0) {
        const { data: logs } = await supabase
          .from('ats_sync_logs')
          .select('application_id, status, action')
          .in('ats_connection_id', connectionIds)
          .eq('action', 'submit_application');
        syncLogs = logs || [];
      }

      // Build a map of application_id -> delivery status
      const deliveryMap = new Map<string, string>();
      syncLogs.forEach(log => {
        if (log.application_id) {
          deliveryMap.set(log.application_id, log.status);
        }
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Process each client
      const clientRows: PortfolioClientRow[] = (clientsData || []).map((client: any) => {
        const jobs = client.job_listings || [];
        const allApps = jobs.flatMap((j: any) => j.applications || []);

        // Filter by date range
        const apps = cutoff
          ? allApps.filter((a: any) => a.applied_at && new Date(a.applied_at) >= cutoff)
          : allApps;

        const recentApps = allApps.filter((a: any) =>
          a.applied_at && new Date(a.applied_at) >= thirtyDaysAgo
        );

        // ATS delivery rate
        let delivered = 0;
        let attempted = 0;
        apps.forEach((a: any) => {
          const status = deliveryMap.get(a.id);
          if (status) {
            attempted++;
            if (status === 'success') delivered++;
          }
        });

        // Avg readiness
        const readinessScores = apps
          .map((a: any) => a.ats_readiness_score)
          .filter((s: any) => s != null) as number[];
        const avgReadiness = readinessScores.length > 0
          ? Math.round(readinessScores.reduce((a: number, b: number) => a + b, 0) / readinessScores.length)
          : 0;

        // Avg SLA hours
        const slaHours = apps
          .filter((a: any) => a.first_response_at && a.applied_at)
          .map((a: any) => {
            const diff = new Date(a.first_response_at).getTime() - new Date(a.applied_at).getTime();
            return diff / (1000 * 60 * 60);
          });
        const avgSla = slaHours.length > 0
          ? Math.round((slaHours.reduce((a, b) => a + b, 0) / slaHours.length) * 10) / 10
          : 0;

        // Top source
        const sourceCounts: Record<string, number> = {};
        apps.forEach((a: any) => {
          const s = a.source || 'Unknown';
          sourceCounts[s] = (sourceCounts[s] || 0) + 1;
        });
        const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Sparkline: last 7 days of application counts
        const sparkline: number[] = [];
        for (let i = 6; i >= 0; i--) {
          const day = new Date();
          day.setDate(day.getDate() - i);
          const dayStr = day.toISOString().slice(0, 10);
          const count = allApps.filter((a: any) =>
            a.applied_at && a.applied_at.slice(0, 10) === dayStr
          ).length;
          sparkline.push(count);
        }

        return {
          id: client.id,
          name: client.name,
          logoUrl: client.logo_url,
          city: client.city,
          state: client.state,
          status: client.status,
          jobCount: jobs.length,
          activeJobCount: jobs.filter((j: any) => j.status === 'active').length,
          applicationCount: apps.length,
          recentApplications: recentApps.length,
          atsDeliveryRate: attempted > 0 ? Math.round((delivered / attempted) * 100) : 0,
          avgReadinessScore: avgReadiness,
          avgSlaHours: avgSla,
          topSource,
          sparklineData: sparkline,
        };
      });

      // Summary
      const totalApps = clientRows.reduce((s, c) => s + c.applicationCount, 0);
      const totalDeliveryNumerator = clientRows.reduce((s, c) => s + (c.atsDeliveryRate * c.applicationCount), 0);
      const overallDeliveryRate = totalApps > 0 ? Math.round(totalDeliveryNumerator / totalApps) : 0;
      const allReadiness = clientRows.filter(c => c.avgReadinessScore > 0);
      const avgReadiness = allReadiness.length > 0
        ? Math.round(allReadiness.reduce((s, c) => s + c.avgReadinessScore, 0) / allReadiness.length)
        : 0;
      const allSla = clientRows.filter(c => c.avgSlaHours > 0);
      const avgSla = allSla.length > 0
        ? Math.round((allSla.reduce((s, c) => s + c.avgSlaHours, 0) / allSla.length) * 10) / 10
        : 0;

      const summary: PortfolioSummary = {
        totalApplications: totalApps,
        totalClients: clientRows.length,
        activeClients: clientRows.filter(c => c.status === 'active').length,
        totalJobs: clientRows.reduce((s, c) => s + c.jobCount, 0),
        overallDeliveryRate,
        avgReadinessScore: avgReadiness,
        avgSlaHours: avgSla,
        activeJobs: clientRows.reduce((s, c) => s + c.activeJobCount, 0),
      };

      return { clients: clientRows, summary };
    },
    enabled: !!organization?.id,
  });

  return {
    clients: data?.clients || [],
    summary: data?.summary || emptySummary(),
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

function emptySummary(): PortfolioSummary {
  return {
    totalApplications: 0,
    totalClients: 0,
    activeClients: 0,
    totalJobs: 0,
    overallDeliveryRate: 0,
    avgReadinessScore: 0,
    avgSlaHours: 0,
    activeJobs: 0,
  };
}
