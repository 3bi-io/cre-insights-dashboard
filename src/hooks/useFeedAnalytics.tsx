import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';

interface FeedAccessLog {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  feed_type: string;
  platform: string | null;
  job_group_id: string | null;
  request_ip: string | null;
  user_agent: string | null;
  job_count: number;
  response_time_ms: number;
  created_at: string;
}

interface FeedMetrics {
  totalRequests: number;
  uniqueRequestors: number;
  totalJobsDistributed: number;
  avgResponseTime: number;
  mostPopularPlatform: string | null;
}

interface PlatformStats {
  platform: string;
  count: number;
}

interface DailyStats {
  date: string;
  count: number;
  feed_type?: string;
}

export const useFeedAnalytics = (days: number = 30) => {
  const startDate = startOfDay(subDays(new Date(), days));

  // Fetch recent feed access logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['feed-access-logs', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_access_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as FeedAccessLog[];
    },
  });

  // Fetch aggregated metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['feed-metrics', days],
    queryFn: async () => {
      if (!logs) return null;

      const uniqueIps = new Set(logs.map(log => log.request_ip).filter(Boolean));
      const totalRequests = logs.length;
      const totalJobsDistributed = logs.reduce((sum, log) => sum + (log.job_count || 0), 0);
      const avgResponseTime = logs.length > 0
        ? logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / logs.length
        : 0;

      // Find most popular platform
      const platformCounts: Record<string, number> = {};
      logs.forEach(log => {
        const platform = log.platform || 'unknown';
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });

      const mostPopularPlatform = Object.entries(platformCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

      return {
        totalRequests,
        uniqueRequestors: uniqueIps.size,
        totalJobsDistributed,
        avgResponseTime: Math.round(avgResponseTime),
        mostPopularPlatform,
      } as FeedMetrics;
    },
    enabled: !!logs,
  });

  // Fetch platform distribution
  const { data: platformStats, isLoading: platformStatsLoading } = useQuery({
    queryKey: ['feed-platform-stats', days],
    queryFn: async () => {
      if (!logs) return [];

      const stats: Record<string, number> = {};
      logs.forEach(log => {
        const platform = log.platform || 'unknown';
        stats[platform] = (stats[platform] || 0) + 1;
      });

      return Object.entries(stats)
        .map(([platform, count]) => ({ platform, count }))
        .sort((a, b) => b.count - a.count) as PlatformStats[];
    },
    enabled: !!logs,
  });

  // Fetch daily request counts
  const { data: dailyStats, isLoading: dailyStatsLoading } = useQuery({
    queryKey: ['feed-daily-stats', days],
    queryFn: async () => {
      if (!logs) return [];

      const stats: Record<string, Record<string, number>> = {};
      logs.forEach(log => {
        const date = format(new Date(log.created_at), 'yyyy-MM-dd');
        const feedType = log.feed_type || 'unknown';
        
        if (!stats[date]) stats[date] = {};
        stats[date][feedType] = (stats[date][feedType] || 0) + 1;
      });

      // Flatten the data for charting
      const result: DailyStats[] = [];
      Object.entries(stats).forEach(([date, feedTypes]) => {
        Object.entries(feedTypes).forEach(([feed_type, count]) => {
          result.push({ date, count, feed_type });
        });
      });

      return result.sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!logs,
  });

  return {
    logs,
    metrics,
    platformStats,
    dailyStats,
    isLoading: logsLoading || metricsLoading || platformStatsLoading || dailyStatsLoading,
  };
};
