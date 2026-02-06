/**
 * Monitor Feed Quality Edge Function
 * Runs on schedule to check feed data coverage and create alerts when thresholds are breached
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { getCorsHeaders } from '../_shared/cors-config.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { wrapHandler } from '../_shared/error-handler.ts'
import { getServiceClient } from '../_shared/supabase-client.ts'
import { createLogger } from '../_shared/logger.ts'

const logger = createLogger('monitor-feed-quality');

// Thresholds for quality alerts
const THRESHOLDS = {
  campaignCoverage: { warning: 50, critical: 30 },
  indeedApplyCoverage: { warning: 30, critical: 10 },
  dateCoverage: { warning: 40, critical: 20 },
  trackingCoverage: { warning: 20, critical: 10 },
  overallScore: { warning: 50, critical: 30 },
};

// Hayes Recruiting Solutions organization ID
const HAYES_ORG_ID = '84214b48-7b51-45bc-ad7f-723bcf50466c';

interface CoverageMetrics {
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

async function getCoverageMetrics(supabase: any): Promise<CoverageMetrics> {
  const { data, error } = await supabase
    .from('feed_data_coverage')
    .select('*');

  if (error) {
    throw new Error(`Failed to fetch coverage data: ${error.message}`);
  }

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
  const totalJobs = data.reduce((sum: number, row: any) => sum + (row.total_jobs || 0), 0);
  const jobsWithDate = data.reduce((sum: number, row: any) => sum + (row.jobs_with_date || 0), 0);
  const jobsWithIndeedApply = data.reduce((sum: number, row: any) => sum + (row.jobs_with_indeed_apply || 0), 0);
  const jobsWithTracking = data.reduce((sum: number, row: any) => sum + (row.jobs_with_tracking || 0), 0);
  const jobsWithCampaign = data.reduce((sum: number, row: any) => sum + (row.jobs_with_campaign || 0), 0);

  const dateCoveragePct = totalJobs > 0 ? (jobsWithDate / totalJobs) * 100 : 0;
  const indeedApplyCoveragePct = totalJobs > 0 ? (jobsWithIndeedApply / totalJobs) * 100 : 0;
  const trackingCoveragePct = totalJobs > 0 ? (jobsWithTracking / totalJobs) * 100 : 0;
  const campaignCoveragePct = totalJobs > 0 ? (jobsWithCampaign / totalJobs) * 100 : 0;

  // Weighted average for overall score
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

function checkThreshold(
  value: number,
  thresholds: { warning: number; critical: number }
): 'ok' | 'warning' | 'critical' {
  if (value < thresholds.critical) return 'critical';
  if (value < thresholds.warning) return 'warning';
  return 'ok';
}

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  logger.info('Feed quality monitoring started');
  const supabase = getServiceClient();

  // Get current coverage metrics
  const metrics = await getCoverageMetrics(supabase);
  logger.info('Coverage metrics calculated', { 
    totalJobs: metrics.totalJobs,
    overallScore: metrics.overallScore.toFixed(1)
  });

  if (metrics.totalJobs === 0) {
    return successResponse({ 
      message: 'No active jobs to monitor',
      metrics,
      alerts: []
    });
  }

  // Check thresholds and create alerts
  const alerts: Array<{
    alert_type: string;
    metric_name: string;
    current_value: number;
    threshold_value: number;
    severity: string;
    message: string;
  }> = [];

  // Check overall score
  const overallStatus = checkThreshold(metrics.overallScore, THRESHOLDS.overallScore);
  if (overallStatus !== 'ok') {
    alerts.push({
      alert_type: 'coverage_drop',
      metric_name: 'overall_score',
      current_value: metrics.overallScore,
      threshold_value: overallStatus === 'critical' ? THRESHOLDS.overallScore.critical : THRESHOLDS.overallScore.warning,
      severity: overallStatus,
      message: `Feed data quality score has dropped to ${metrics.overallScore.toFixed(1)}%`
    });
  }

  // Check campaign coverage
  const campaignStatus = checkThreshold(metrics.campaignCoveragePct, THRESHOLDS.campaignCoverage);
  if (campaignStatus !== 'ok') {
    alerts.push({
      alert_type: 'coverage_drop',
      metric_name: 'campaign_coverage',
      current_value: metrics.campaignCoveragePct,
      threshold_value: campaignStatus === 'critical' ? THRESHOLDS.campaignCoverage.critical : THRESHOLDS.campaignCoverage.warning,
      severity: campaignStatus,
      message: `Campaign attribution coverage is at ${metrics.campaignCoveragePct.toFixed(1)}%`
    });
  }

  // Check Indeed Apply coverage
  const indeedStatus = checkThreshold(metrics.indeedApplyCoveragePct, THRESHOLDS.indeedApplyCoverage);
  if (indeedStatus !== 'ok') {
    alerts.push({
      alert_type: 'coverage_drop',
      metric_name: 'indeed_apply_coverage',
      current_value: metrics.indeedApplyCoveragePct,
      threshold_value: indeedStatus === 'critical' ? THRESHOLDS.indeedApplyCoverage.critical : THRESHOLDS.indeedApplyCoverage.warning,
      severity: indeedStatus,
      message: `Indeed Apply integration coverage is at ${metrics.indeedApplyCoveragePct.toFixed(1)}%`
    });
  }

  // Insert alerts if any
  if (alerts.length > 0) {
    const alertsToInsert = alerts.map(alert => ({
      ...alert,
      organization_id: HAYES_ORG_ID
    }));

    const { error: insertError } = await supabase
      .from('feed_quality_alerts')
      .insert(alertsToInsert);

    if (insertError) {
      logger.error('Failed to insert alerts', insertError);
    } else {
      logger.info('Created quality alerts', { count: alerts.length });
    }
  }

  return successResponse({
    message: alerts.length > 0 
      ? `Quality check complete: ${alerts.length} alert(s) created`
      : 'Quality check complete: all metrics within thresholds',
    metrics,
    alerts,
    thresholds: THRESHOLDS
  });
}, { context: 'MonitorFeedQuality', logRequests: true });

serve(handler);
