import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeedDataCoverage {
  totalJobs: number;
  jobsWithDate: number;
  jobsWithIndeedApply: number;
  jobsWithTracking: number;
  jobsWithCampaign: number;
  dateCoveragePct: number;
  indeedApplyCoveragePct: number;
  trackingCoveragePct: number;
  campaignCoveragePct: number;
  overallScore: number;
}

interface FeedDataCoverageRow {
  client_id: string | null;
  total_jobs: number;
  jobs_with_date: number;
  jobs_with_indeed_apply: number;
  jobs_with_tracking: number;
  jobs_with_campaign: number;
}

function aggregateCoverage(data: FeedDataCoverageRow[] | null): FeedDataCoverage {
  if (!data || data.length === 0) {
    return {
      totalJobs: 0,
      jobsWithDate: 0,
      jobsWithIndeedApply: 0,
      jobsWithTracking: 0,
      jobsWithCampaign: 0,
      dateCoveragePct: 0,
      indeedApplyCoveragePct: 0,
      trackingCoveragePct: 0,
      campaignCoveragePct: 0,
      overallScore: 0,
    };
  }

  // Aggregate across all clients
  const totalJobs = data.reduce((sum, row) => sum + (row.total_jobs || 0), 0);
  const jobsWithDate = data.reduce((sum, row) => sum + (row.jobs_with_date || 0), 0);
  const jobsWithIndeedApply = data.reduce((sum, row) => sum + (row.jobs_with_indeed_apply || 0), 0);
  const jobsWithTracking = data.reduce((sum, row) => sum + (row.jobs_with_tracking || 0), 0);
  const jobsWithCampaign = data.reduce((sum, row) => sum + (row.jobs_with_campaign || 0), 0);

  const dateCoveragePct = totalJobs > 0 ? (jobsWithDate / totalJobs) * 100 : 0;
  const indeedApplyCoveragePct = totalJobs > 0 ? (jobsWithIndeedApply / totalJobs) * 100 : 0;
  const trackingCoveragePct = totalJobs > 0 ? (jobsWithTracking / totalJobs) * 100 : 0;
  const campaignCoveragePct = totalJobs > 0 ? (jobsWithCampaign / totalJobs) * 100 : 0;

  // Weighted average for overall score
  // Campaign attribution is most important (40%), followed by Indeed Apply (30%), date (20%), tracking (10%)
  const overallScore = 
    (campaignCoveragePct * 0.4) + 
    (indeedApplyCoveragePct * 0.3) + 
    (dateCoveragePct * 0.2) + 
    (trackingCoveragePct * 0.1);

  return {
    totalJobs,
    jobsWithDate,
    jobsWithIndeedApply,
    jobsWithTracking,
    jobsWithCampaign,
    dateCoveragePct,
    indeedApplyCoveragePct,
    trackingCoveragePct,
    campaignCoveragePct,
    overallScore,
  };
}

export function useFeedDataCoverage() {
  return useQuery({
    queryKey: ['feed-data-coverage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_data_coverage')
        .select('*');

      if (error) throw error;
      return aggregateCoverage(data as FeedDataCoverageRow[]);
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
