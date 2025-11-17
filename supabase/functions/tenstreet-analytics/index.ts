/**
 * Tenstreet Analytics Data Processor
 * Fetches and caches analytics data from Tenstreet API
 */

import { getCorsHeaders } from '../_shared/cors-config.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts';
import { createLogger } from '../_shared/logger.ts';
import { enforceAuth } from '../_shared/serverAuth.ts';

const logger = createLogger('tenstreet-analytics');

interface AnalyticsRequest {
  type: 'application_metrics' | 'source_performance' | 'conversion_funnel';
  startDate?: string;
  endDate?: string;
  forceRefresh?: boolean;
}

Deno.serve(wrapHandler(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }
    // Authenticate user
    const authContext = await enforceAuth(req, 'user');
    if (authContext instanceof Response) return authContext;

    const supabase = getServiceClient();
    const { type, startDate, endDate, forceRefresh = false } = await req.json() as AnalyticsRequest;

  if (!type) {
    throw new ValidationError('Analytics type is required');
  }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cacheKey = `${authContext.organizationId}_${type}_${startDate}_${endDate}`;
      const { data: cachedData, error: cacheError } = await supabase
        .from('tenstreet_analytics_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (!cacheError && cachedData) {
      logger.info('Cache hit', { type });
      return successResponse(cachedData.data, 'Analytics data retrieved from cache', {}, origin);
    }
  }

    // Get organization's Tenstreet credentials
    const { data: credentials, error: credError } = await supabase
      .from('tenstreet_credentials')
      .select('*')
      .eq('organization_id', authContext.organizationId)
      .eq('is_active', true)
      .single();

  if (credError || !credentials) {
    throw new ValidationError('Tenstreet credentials not configured');
  }

  logger.info('Fetching analytics from database', { type });

    let analyticsData;
    switch (type) {
      case 'application_metrics':
        analyticsData = await fetchApplicationMetrics(supabase, authContext.organizationId, startDate, endDate);
        break;
      case 'source_performance':
        analyticsData = await fetchSourcePerformance(supabase, authContext.organizationId, startDate, endDate);
        break;
      case 'conversion_funnel':
        analyticsData = await fetchConversionFunnel(supabase, authContext.organizationId, startDate, endDate);
        break;
    default:
      throw new ValidationError('Invalid analytics type');
  }

    // Cache the results (30 minute TTL)
    const cacheKey = `${authContext.organizationId}_${type}_${startDate}_${endDate}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await supabase
      .from('tenstreet_analytics_cache')
      .upsert({
        cache_key: cacheKey,
        organization_id: authContext.organizationId,
        data: analyticsData,
        expires_at: expiresAt
      });

  return successResponse(analyticsData, 'Analytics data retrieved successfully', {}, origin);
}, { context: 'tenstreet-analytics', logRequests: true }));

async function fetchApplicationMetrics(supabase: any, organizationId: string, startDate?: string, endDate?: string) {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = endDate || new Date().toISOString();

  const { data, error } = await supabase
    .from('applications')
    .select('*, job_listings!inner(organization_id)')
    .eq('job_listings.organization_id', organizationId)
    .gte('applied_at', start)
    .lte('applied_at', end);

  if (error) throw error;

  // Calculate metrics
  const totalApplications = data.length;
  const statusCounts = data.reduce((acc: any, app: any) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const completionRate = totalApplications > 0 
    ? ((statusCounts.hired || 0) / totalApplications * 100).toFixed(1)
    : '0.0';

  return {
    totalApplications,
    statusBreakdown: statusCounts,
    completionRate: parseFloat(completionRate),
    period: { start, end }
  };
}

async function fetchSourcePerformance(supabase: any, organizationId: string, startDate?: string, endDate?: string) {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = endDate || new Date().toISOString();

  const { data, error } = await supabase
    .from('applications')
    .select('source, status, job_listings!inner(organization_id)')
    .eq('job_listings.organization_id', organizationId)
    .gte('applied_at', start)
    .lte('applied_at', end);

  if (error) throw error;

  // Group by source
  const sourceStats = data.reduce((acc: any, app: any) => {
    const source = app.source || 'Unknown';
    if (!acc[source]) {
      acc[source] = {
        source,
        totalApplications: 0,
        hiredCount: 0,
        conversionRate: 0
      };
    }
    acc[source].totalApplications++;
    if (app.status === 'hired') {
      acc[source].hiredCount++;
    }
    return acc;
  }, {});

  // Calculate conversion rates
  return Object.values(sourceStats).map((stat: any) => ({
    ...stat,
    conversionRate: stat.totalApplications > 0
      ? parseFloat((stat.hiredCount / stat.totalApplications * 100).toFixed(1))
      : 0
  }));
}

async function fetchConversionFunnel(supabase: any, organizationId: string, startDate?: string, endDate?: string) {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = endDate || new Date().toISOString();

  const { data, error } = await supabase
    .from('applications')
    .select('status, job_listings!inner(organization_id)')
    .eq('job_listings.organization_id', organizationId)
    .gte('applied_at', start)
    .lte('applied_at', end);

  if (error) throw error;

  const total = data.length;
  const stages = {
    applied: total,
    screening: data.filter(a => ['screening', 'interview', 'offer', 'hired'].includes(a.status)).length,
    interview: data.filter(a => ['interview', 'offer', 'hired'].includes(a.status)).length,
    offer: data.filter(a => ['offer', 'hired'].includes(a.status)).length,
    hired: data.filter(a => a.status === 'hired').length
  };

  return {
    stages,
    conversionRates: {
      appliedToScreening: total > 0 ? parseFloat((stages.screening / total * 100).toFixed(1)) : 0,
      screeningToInterview: stages.screening > 0 ? parseFloat((stages.interview / stages.screening * 100).toFixed(1)) : 0,
      interviewToOffer: stages.interview > 0 ? parseFloat((stages.offer / stages.interview * 100).toFixed(1)) : 0,
      offerToHired: stages.offer > 0 ? parseFloat((stages.hired / stages.offer * 100).toFixed(1)) : 0,
      overallConversion: total > 0 ? parseFloat((stages.hired / total * 100).toFixed(1)) : 0
    }
  };
}
