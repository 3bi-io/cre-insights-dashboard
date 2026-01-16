import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import type { ApplyPageAnalyticsData, DateRange } from '../types/applyAnalytics';

const getDateRangeFilter = (range: DateRange): Date => {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    case '90d':
      return new Date(now.setDate(now.getDate() - 90));
    case 'all':
      return new Date('2020-01-01');
  }
};

async function fetchApplyPageAnalytics(
  organizationId: string | undefined,
  dateRange: DateRange
): Promise<ApplyPageAnalyticsData> {
  const startDate = getDateRangeFilter(dateRange);
  const startDateStr = startDate.toISOString();

  // Fetch page views for /apply pages
  let pageViewsQuery = supabase
    .from('page_views')
    .select('*')
    .like('page_path', '/apply%')
    .gte('created_at', startDateStr);

  if (organizationId) {
    pageViewsQuery = pageViewsQuery.eq('organization_id', organizationId);
  }

  const { data: pageViews, error: pvError } = await pageViewsQuery;
  if (pvError) throw pvError;

  // Fetch applications for conversion calculation
  let applicationsQuery = supabase
    .from('applications')
    .select('id, created_at, job_listing_id, job_listings!inner(organization_id)')
    .gte('created_at', startDateStr);

  if (organizationId) {
    applicationsQuery = applicationsQuery.eq('job_listings.organization_id', organizationId);
  }

  const { data: applications, error: appError } = await applicationsQuery;
  if (appError) throw appError;

  const views = pageViews || [];
  const apps = applications || [];

  // Calculate metrics
  const totalViews = views.length;
  const uniqueVisitors = new Set(views.map(v => v.visitor_id)).size;
  const totalApplications = apps.length;
  const conversionRate = uniqueVisitors > 0 
    ? (totalApplications / uniqueVisitors) * 100 
    : 0;

  // Device breakdown
  const deviceCounts: Record<string, number> = {};
  views.forEach(v => {
    const device = v.device_type || 'Unknown';
    deviceCounts[device] = (deviceCounts[device] || 0) + 1;
  });
  const deviceBreakdown = Object.entries(deviceCounts).map(([device, count]) => ({
    device,
    count,
    percentage: totalViews > 0 ? (count / totalViews) * 100 : 0
  })).sort((a, b) => b.count - a.count);

  // Traffic sources (from referrer)
  const sourceCounts: Record<string, number> = {};
  views.forEach(v => {
    let source = 'Direct';
    if (v.referrer) {
      try {
        const url = new URL(v.referrer);
        source = url.hostname.replace('www.', '');
      } catch {
        source = v.referrer.substring(0, 30);
      }
    }
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  const trafficSources = Object.entries(sourceCounts).map(([source, count]) => ({
    source,
    count,
    percentage: totalViews > 0 ? (count / totalViews) * 100 : 0
  })).sort((a, b) => b.count - a.count).slice(0, 10);

  // Daily trend
  const dailyCounts: Record<string, { views: number; applications: number }> = {};
  views.forEach(v => {
    const date = new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dailyCounts[date]) {
      dailyCounts[date] = { views: 0, applications: 0 };
    }
    dailyCounts[date].views++;
  });
  apps.forEach(a => {
    const date = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dailyCounts[date]) {
      dailyCounts[date] = { views: 0, applications: 0 };
    }
    dailyCounts[date].applications++;
  });
  const dailyTrend = Object.entries(dailyCounts)
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Top referrers
  const referrerCounts: Record<string, number> = {};
  views.forEach(v => {
    if (v.referrer) {
      referrerCounts[v.referrer] = (referrerCounts[v.referrer] || 0) + 1;
    }
  });
  const topReferrers = Object.entries(referrerCounts)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Country breakdown
  const countryCounts: Record<string, number> = {};
  views.forEach(v => {
    const country = v.country || 'Unknown';
    countryCounts[country] = (countryCounts[country] || 0) + 1;
  });
  const countryBreakdown = Object.entries(countryCounts).map(([country, count]) => ({
    country,
    count,
    percentage: totalViews > 0 ? (count / totalViews) * 100 : 0
  })).sort((a, b) => b.count - a.count);

  return {
    metrics: {
      pageViews: totalViews,
      uniqueVisitors,
      applications: totalApplications,
      conversionRate,
      avgTimeOnPage: 0, // Would need session duration tracking
      bounceRate: 0, // Would need bounce tracking
    },
    deviceBreakdown,
    trafficSources,
    dailyTrend,
    topReferrers,
    countryBreakdown,
  };
}

export const useApplyPageAnalytics = (dateRange: DateRange = '30d') => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: queryKeys.analytics.applyPage(organization?.id, dateRange),
    queryFn: () => fetchApplyPageAnalytics(organization?.id, dateRange),
    staleTime: 5 * 60 * 1000,
  });
};
