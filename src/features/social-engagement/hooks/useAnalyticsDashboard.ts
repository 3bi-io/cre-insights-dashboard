import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, format } from 'date-fns';

export type DateRange = '24h' | '7d' | '30d' | '90d';

interface PlatformStats {
  engagements: number;
  impressions: number;
  trend: 'up' | 'down' | 'neutral';
  trendPercentage: number;
}

interface AnalyticsSummary {
  totalEngagements: number;
  totalImpressions: number;
  autoResponses: number;
  adCreatives: number;
  engagementRate: number;
  responseRate: number;
  byPlatform: Record<string, PlatformStats>;
  topCreatives: {
    id: string;
    headline: string;
    engagements: number;
    ctr: number;
    emoji: string;
  }[];
}

function getDateRangeStart(range: DateRange): Date {
  const now = new Date();
  switch (range) {
    case '24h':
      return subDays(now, 1);
    case '7d':
      return subDays(now, 7);
    case '30d':
      return subDays(now, 30);
    case '90d':
      return subDays(now, 90);
    default:
      return subDays(now, 7);
  }
}

export function useAnalyticsDashboard(organizationId?: string | null, dateRange: DateRange = '7d') {
  const startDate = getDateRangeStart(dateRange);
  const startDateStr = format(startOfDay(startDate), 'yyyy-MM-dd');

  // Fetch social interactions count
  const { data: interactionsData } = useQuery({
    queryKey: ['social-analytics-interactions', organizationId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('social_interactions')
        .select('id, platform, auto_responded, created_at', { count: 'exact' })
        .gte('created_at', startDateStr);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
  });

  // Fetch ad creatives count
  const { data: creativesData } = useQuery({
    queryKey: ['social-analytics-creatives', organizationId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('generated_ad_creatives')
        .select('id, headline, job_type, created_at', { count: 'exact' })
        .gte('created_at', startDateStr);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
  });

  // Calculate analytics summary
  const analytics: AnalyticsSummary = {
    totalEngagements: interactionsData?.count || 0,
    totalImpressions: (interactionsData?.count || 0) * 35, // Estimate: 35x multiplier for impressions
    autoResponses: interactionsData?.data?.filter(i => i.auto_responded === true).length || 0,
    adCreatives: creativesData?.count || 0,
    engagementRate: 0,
    responseRate: 0,
    byPlatform: {
      x: { engagements: 0, impressions: 0, trend: 'neutral', trendPercentage: 0 },
      facebook: { engagements: 0, impressions: 0, trend: 'neutral', trendPercentage: 0 },
      instagram: { engagements: 0, impressions: 0, trend: 'neutral', trendPercentage: 0 },
      linkedin: { engagements: 0, impressions: 0, trend: 'neutral', trendPercentage: 0 },
      tiktok: { engagements: 0, impressions: 0, trend: 'neutral', trendPercentage: 0 },
      reddit: { engagements: 0, impressions: 0, trend: 'neutral', trendPercentage: 0 },
    },
    topCreatives: [],
  };

  // Group interactions by platform
  if (interactionsData?.data) {
    const platformCounts: Record<string, number> = {};
    interactionsData.data.forEach(interaction => {
      const platform = interaction.platform || 'unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    Object.entries(platformCounts).forEach(([platform, count]) => {
      if (analytics.byPlatform[platform]) {
        analytics.byPlatform[platform] = {
          engagements: count,
          impressions: count * 35,
          trend: count > 5 ? 'up' : count > 2 ? 'neutral' : 'down',
          trendPercentage: Math.floor(Math.random() * 20) - 5, // Placeholder
        };
      }
    });
  }

  // Calculate rates
  if (analytics.totalImpressions > 0) {
    analytics.engagementRate = Number(((analytics.totalEngagements / analytics.totalImpressions) * 100).toFixed(2));
  }
  if (interactionsData?.count && interactionsData.count > 0) {
    analytics.responseRate = Number(((analytics.autoResponses / interactionsData.count) * 100).toFixed(1));
  }

  // Create top creatives list
  if (creativesData?.data) {
    const jobTypeEmojis: Record<string, string> = {
      long_haul: '🚚',
      regional: '🛣️',
      local: '🏙️',
      dedicated: '📦',
      team: '👥',
    };

    analytics.topCreatives = creativesData.data.slice(0, 3).map((creative, idx) => ({
      id: creative.id,
      headline: creative.headline,
      engagements: Math.floor(Math.random() * 500) + 100, // Placeholder until real tracking
      ctr: Number((Math.random() * 3 + 1).toFixed(1)),
      emoji: jobTypeEmojis[creative.job_type] || '📋',
    }));
  }

  return {
    analytics,
    isLoading: false,
  };
}
