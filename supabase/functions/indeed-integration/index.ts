import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceAuth, logSecurityEvent, getClientInfo, createAuthenticatedClient } from '../_shared/serverAuth.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts';
import { createLogger } from '../_shared/logger.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const logger = createLogger('indeed-integration');

// VALIDATION: Request schema
const requestSchema = z.object({
  action: z.enum(['sync_analytics', 'get_stats']),
  employerId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const handler = wrapHandler(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) });
  }

  // SECURITY: Server-side JWT verification with role check
  const authContext = await enforceAuth(req, ['admin', 'super_admin']);
  if (authContext instanceof Response) return authContext;

  const { userId, organizationId } = authContext;
  const { ipAddress, userAgent } = getClientInfo(req);

  // VALIDATION: Parse and validate request body
  const body = await req.json();
  const validationResult = requestSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError('Invalid request parameters', validationResult.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    })));
  }

  const { action, employerId, startDate, endDate } = validationResult.data;
  
  logger.info(`${action} for employer ${employerId}`, { userId, employerId, action });

  // Create authenticated Supabase client
  const supabaseClient = createAuthenticatedClient(req);

  // AUDIT LOGGING
  await logSecurityEvent(supabaseClient, authContext, `INDEED_${action.toUpperCase()}`, {
    table: 'indeed_integration',
    recordId: employerId,
    ipAddress,
    userAgent
  });

  switch (action) {
    case 'sync_analytics':
      return await syncIndeedAnalytics(employerId, startDate!, endDate!, userId, supabaseClient, origin);
    
    case 'get_stats':
      return await getIndeedStats(employerId, userId, supabaseClient, origin);
    
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}, { context: 'indeed-integration', logRequests: true });

async function syncIndeedAnalytics(
  employerId: string,
  startDate: string,
  endDate: string,
  userId: string,
  supabaseClient: any,
  origin: string | null
) {
  logger.info('Syncing Indeed analytics', { employerId, startDate, endDate });
  
  // TODO: Replace with actual Indeed API integration
  // For now, generate mock data
  const mockData = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const clicks = Math.floor(Math.random() * 500) + 100
    const impressions = clicks * (Math.floor(Math.random() * 5) + 3)
    const applications = Math.floor(clicks * (Math.random() * 0.1 + 0.05))
    const spend = clicks * (Math.random() * 2 + 1)
    
    mockData.push({
      user_id: userId,
      employer_id: employerId,
      date: dateStr,
      spend: Number(spend.toFixed(2)),
      clicks,
      impressions,
      applications,
      ctr: Number(((clicks / impressions) * 100).toFixed(2)),
      cpc: Number((spend / clicks).toFixed(2)),
    })
  }

  // Upsert data
  const { error } = await supabaseClient
    .from('indeed_analytics')
    .upsert(mockData, { onConflict: 'employer_id,job_id,date' })

  if (error) {
    throw error;
  }

  logger.info('Analytics synced successfully', { recordsProcessed: mockData.length });

  return successResponse(
    {
      message: `Synced ${mockData.length} days of Indeed analytics`,
      recordsProcessed: mockData.length
    },
    undefined,
    undefined,
    origin
  );
}

async function getIndeedStats(
  employerId: string,
  userId: string,
  supabaseClient: any,
  origin: string | null
) {
  logger.info('Fetching Indeed stats', { employerId, userId });

  const { data, error } = await supabaseClient
    .from('indeed_analytics')
    .select('*')
    .eq('user_id', userId)
    .eq('employer_id', employerId)
    .order('date', { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  const totals = data.reduce((acc: any, row: any) => ({
    spend: acc.spend + (row.spend || 0),
    clicks: acc.clicks + (row.clicks || 0),
    impressions: acc.impressions + (row.impressions || 0),
    applications: acc.applications + (row.applications || 0),
  }), { spend: 0, clicks: 0, impressions: 0, applications: 0 });

  logger.info('Stats fetched successfully', { totalRecords: data.length });

  return successResponse(
    {
      data: data,
      totals: {
        ...totals,
        ctr: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : 0,
        cpc: totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : 0,
        cpa: totals.applications > 0 ? (totals.spend / totals.applications).toFixed(2) : 0,
      }
    },
    undefined,
    undefined,
    origin
  );
}

serve(handler);