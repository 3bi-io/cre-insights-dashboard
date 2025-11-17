import { getAuthenticatedClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts';
import { createLogger } from '../_shared/logger.ts';
import { enforceAuth } from '../_shared/serverAuth.ts';

const logger = createLogger('adzuna-integration');

Deno.serve(wrapHandler(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  const authContext = await enforceAuth(req, 'user');
  if (authContext instanceof Response) return authContext;

  const { action, campaignId, startDate, endDate } = await req.json();
  
  if (!action) {
    throw new ValidationError('Action is required');
  }

  logger.info('Processing action', { action, campaignId });

  const supabaseClient = getAuthenticatedClient(req);

  switch (action) {
    case 'sync_analytics':
      return await syncAdzunaAnalytics(campaignId, startDate, endDate, authContext.user.id, supabaseClient, origin);
    
    case 'get_stats':
      return await getAdzunaStats(campaignId, authContext.user.id, supabaseClient, origin);
    
    case 'post_job':
      return await postJobToAdzuna(req, authContext.user.id, supabaseClient, origin);
    
    default:
      throw new ValidationError(`Unknown action: ${action}`);
  }
}, { context: 'adzuna-integration', logRequests: true }));

async function syncAdzunaAnalytics(
  campaignId: string,
  startDate: string,
  endDate: string,
  userId: string,
  supabaseClient: any,
  origin: string | null
) {
  logger.info('Syncing Adzuna analytics', { campaignId, startDate, endDate });
  
  // Generate mock data (replace with actual Adzuna API call)
  const mockData = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const clicks = Math.floor(Math.random() * 300) + 50
    const impressions = clicks * (Math.floor(Math.random() * 6) + 4)
    const applications = Math.floor(clicks * (Math.random() * 0.12 + 0.08))
    const spend = clicks * (Math.random() * 1.5 + 0.8)
    
    mockData.push({
      user_id: userId,
      campaign_id: campaignId,
      date: dateStr,
      spend: Number(spend.toFixed(2)),
      clicks,
      impressions,
      applications,
      ctr: Number(((clicks / impressions) * 100).toFixed(2)),
      cpc: Number((spend / clicks).toFixed(2)),
    })
  }

  const { error } = await supabaseClient
    .from('adzuna_analytics')
    .upsert(mockData, { onConflict: 'campaign_id,job_id,date' })

  if (error) {
    throw error;
  }

  return successResponse({
    recordsProcessed: mockData.length,
    dateRange: { start: startDate, end: endDate }
  }, `Synced ${mockData.length} days of Adzuna analytics`, {}, origin);
}

async function getAdzunaStats(campaignId: string, userId: string, supabaseClient: any, origin: string | null) {
  const { data, error } = await supabaseClient
    .from('adzuna_analytics')
    .select('*')
    .eq('user_id', userId)
    .eq('campaign_id', campaignId)
    .order('date', { ascending: false })
    .limit(30)

  if (error) {
    throw error
  }

  const totals = data.reduce((acc, row) => ({
    spend: acc.spend + (row.spend || 0),
    clicks: acc.clicks + (row.clicks || 0),
    impressions: acc.impressions + (row.impressions || 0),
    applications: acc.applications + (row.applications || 0),
  }), { spend: 0, clicks: 0, impressions: 0, applications: 0 })

  return successResponse({
    data: data,
    totals: {
      ...totals,
      ctr: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : 0,
      cpc: totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : 0,
      cpa: totals.applications > 0 ? (totals.spend / totals.applications).toFixed(2) : 0,
    }
  }, 'Adzuna stats retrieved successfully', {}, origin);
}

async function postJobToAdzuna(req: Request, userId: string, supabaseClient: any, origin: string | null) {
  const { jobData } = await req.json()
  
  console.log('Posting job to Adzuna:', jobData)
  
  // TODO: Implement actual Adzuna API posting
  // For now, return success
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Job posted to Adzuna successfully',
      jobId: `adzuna_${Date.now()}`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}