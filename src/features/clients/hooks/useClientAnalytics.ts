import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type {
  ClientAnalyticsData,
  PipelineStage,
  SourceBreakdown,
  ATSDeliveryStats,
  SLAMetrics,
  DailyTrend,
  ReadinessDistribution,
  DateRange,
} from '../types/clientAnalytics.types';

function getDateCutoff(range: DateRange): Date | null {
  if (range === 'all') return null;
  const now = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  now.setDate(now.getDate() - days);
  return now;
}

export function useClientAnalytics(clientId: string | null, dateRange: DateRange = '30d') {
  const { organization } = useAuth();

  return useQuery<ClientAnalyticsData | null>({
    queryKey: ['client-analytics', clientId, dateRange, organization?.id],
    queryFn: async () => {
      if (!clientId || !organization?.id) return null;

      // Fetch client info
      const { data: client } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', clientId)
        .single();

      if (!client) return null;

      // Fetch jobs for this client
      const { data: jobs } = await supabase
        .from('job_listings')
        .select('id')
        .eq('client_id', clientId)
        .eq('organization_id', organization.id);

      const jobIds = (jobs || []).map(j => j.id);
      if (jobIds.length === 0) {
        return emptyAnalytics(clientId, client.name);
      }

      // Fetch applications for these jobs
      let query = supabase
        .from('applications')
        .select('id, applied_at, status, source, ats_readiness_score, first_response_at')
        .in('job_listing_id', jobIds);

      const cutoff = getDateCutoff(dateRange);
      if (cutoff) {
        query = query.gte('applied_at', cutoff.toISOString());
      }

      const { data: applications } = await query;
      const apps = applications || [];

      // Fetch ATS sync logs
      const { data: atsConnections } = await supabase
        .from('ats_connections')
        .select('id')
        .eq('organization_id', organization.id);

      const connIds = (atsConnections || []).map(c => c.id);
      const appIds = apps.map(a => a.id);

      let syncLogs: any[] = [];
      if (connIds.length > 0 && appIds.length > 0) {
        const { data: logs } = await supabase
          .from('ats_sync_logs')
          .select('application_id, status, action')
          .in('ats_connection_id', connIds)
          .in('application_id', appIds)
          .eq('action', 'submit_application');
        syncLogs = logs || [];
      }

      // Pipeline stages
      const statusCounts: Record<string, number> = {};
      apps.forEach(a => {
        const s = a.status || 'pending';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const pipelineOrder = ['pending', 'reviewed', 'contacted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn'];
      const pipeline: PipelineStage[] = pipelineOrder
        .filter(s => statusCounts[s])
        .map(s => ({
          stage: s,
          count: statusCounts[s],
          percentage: apps.length > 0 ? Math.round((statusCounts[s] / apps.length) * 100) : 0,
        }));
      // Add any stages not in the order
      Object.keys(statusCounts)
        .filter(s => !pipelineOrder.includes(s))
        .forEach(s => pipeline.push({
          stage: s,
          count: statusCounts[s],
          percentage: apps.length > 0 ? Math.round((statusCounts[s] / apps.length) * 100) : 0,
        }));

      // Source breakdown
      const sourceCounts: Record<string, number> = {};
      apps.forEach(a => {
        const s = a.source || 'Unknown';
        sourceCounts[s] = (sourceCounts[s] || 0) + 1;
      });
      const sources: SourceBreakdown[] = Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([source, count]) => ({
          source,
          count,
          percentage: apps.length > 0 ? Math.round((count / apps.length) * 100) : 0,
        }));

      // ATS delivery
      const deliveryMap = new Map<string, string>();
      syncLogs.forEach(log => {
        if (log.application_id) deliveryMap.set(log.application_id, log.status);
      });
      let sent = 0, success = 0, errorCount = 0, pending = 0;
      deliveryMap.forEach(status => {
        sent++;
        if (status === 'success') success++;
        else if (status === 'error') errorCount++;
        else pending++;
      });
      const atsDelivery: ATSDeliveryStats = {
        total: apps.length,
        sent,
        success,
        error: errorCount,
        pending,
        successRate: sent > 0 ? Math.round((success / sent) * 100) : 0,
      };

      // SLA metrics
      const responseTimes = apps
        .filter(a => a.first_response_at && a.applied_at)
        .map(a => {
          const diff = new Date(a.first_response_at!).getTime() - new Date(a.applied_at!).getTime();
          return diff / (1000 * 60 * 60);
        })
        .sort((a, b) => a - b);

      const sla: SLAMetrics = {
        avgResponseHours: responseTimes.length > 0
          ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10
          : 0,
        medianResponseHours: responseTimes.length > 0
          ? Math.round(responseTimes[Math.floor(responseTimes.length / 2)] * 10) / 10
          : 0,
        within24h: responseTimes.filter(h => h <= 24).length,
        within48h: responseTimes.filter(h => h > 24 && h <= 48).length,
        over48h: responseTimes.filter(h => h > 48).length,
        totalWithResponse: responseTimes.length,
      };

      // Daily trends
      const trendMap: Record<string, { applications: number; deliveries: number }> = {};
      apps.forEach(a => {
        if (!a.applied_at) return;
        const day = a.applied_at.slice(0, 10);
        if (!trendMap[day]) trendMap[day] = { applications: 0, deliveries: 0 };
        trendMap[day].applications++;
        if (deliveryMap.has(a.id)) trendMap[day].deliveries++;
      });
      const trends: DailyTrend[] = Object.entries(trendMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, d]) => ({ date, ...d }));

      // Readiness distribution
      const ranges = [
        { range: '0-20', min: 0, max: 20 },
        { range: '21-40', min: 21, max: 40 },
        { range: '41-60', min: 41, max: 60 },
        { range: '61-80', min: 61, max: 80 },
        { range: '81-100', min: 81, max: 100 },
      ];
      const readinessDistribution: ReadinessDistribution[] = ranges.map(r => ({
        ...r,
        count: apps.filter(a => {
          const score = a.ats_readiness_score;
          return score != null && score >= r.min && score <= r.max;
        }).length,
      }));

      const readinessScores = apps
        .map(a => a.ats_readiness_score)
        .filter((s): s is number => s != null);
      const avgReadiness = readinessScores.length > 0
        ? Math.round(readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length)
        : 0;

      return {
        clientId,
        clientName: client.name,
        pipeline,
        sources,
        atsDelivery,
        sla,
        trends,
        readinessDistribution,
        totalApplications: apps.length,
        avgReadinessScore: avgReadiness,
      };
    },
    enabled: !!clientId && !!organization?.id,
  });
}

function emptyAnalytics(clientId: string, clientName: string): ClientAnalyticsData {
  return {
    clientId,
    clientName,
    pipeline: [],
    sources: [],
    atsDelivery: { total: 0, sent: 0, success: 0, error: 0, pending: 0, successRate: 0 },
    sla: { avgResponseHours: 0, medianResponseHours: 0, within24h: 0, within48h: 0, over48h: 0, totalWithResponse: 0 },
    trends: [],
    readinessDistribution: [],
    totalApplications: 0,
    avgReadinessScore: 0,
  };
}
