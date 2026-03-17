import { getServiceClient } from '../_shared/supabase-client.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('organization-api');

// Fallback static origins (Lovable previews always allowed)
function isLovablePreview(origin: string): boolean {
  return origin.includes('lovable.app') || origin.includes('lovable.dev') || origin.includes('lovableproject.com');
}

function getCorsHeaders(origin: string | null, allowedOrigins: string[] = []): Record<string, string> {
  const isAllowed = origin && (
    allowedOrigins.some(o => origin.startsWith(o)) ||
    isLovablePreview(origin)
  );
  return {
    'Access-Control-Allow-Origin': isAllowed && origin ? origin : 'null',
    'Access-Control-Allow-Headers': 'x-api-key, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(keyId: string, limitPerMinute: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(keyId);
  
  if (!entry || now - entry.windowStart > 60_000) {
    rateLimitMap.set(keyId, { count: 1, windowStart: now });
    return true;
  }
  
  if (entry.count >= limitPerMinute) return false;
  entry.count++;
  return true;
}

interface JobRow { id: string; title?: string; client_id?: string; location?: string; city?: string; state?: string; status?: string; created_at?: string; }
interface ClientRow { id: string; name: string; city?: string; state?: string; logo_url?: string; }
interface AppRow { id: string; first_name?: string; last_name?: string; status?: string; applied_at?: string; source?: string; city?: string; state?: string; phone?: string; applicant_email?: string; job_listing_id?: string; exp?: string; cdl?: string; }

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    const preflight: Record<string, string> = {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Headers': 'x-api-key, content-type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
    };
    return new Response(null, { headers: preflight });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405, getCorsHeaders(origin));
  }

  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    return jsonResponse({ error: 'Missing x-api-key header' }, 401, getCorsHeaders(origin));
  }

  const supabase = getServiceClient();

  const { data: keyRow, error: keyError } = await supabase
    .from('org_api_keys')
    .select('id, organization_id, allowed_origins, rate_limit_per_minute')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single();

  if (keyError || !keyRow) {
    return jsonResponse({ error: 'Invalid or inactive API key' }, 401, getCorsHeaders(origin));
  }

  const allowedOrigins: string[] = keyRow.allowed_origins || [];
  const cors = getCorsHeaders(origin, allowedOrigins);

  if (origin && allowedOrigins.length > 0) {
    const isAllowed = allowedOrigins.some(o => origin.startsWith(o)) || isLovablePreview(origin);
    if (!isAllowed) {
      return jsonResponse({ error: 'Origin not allowed for this API key' }, 403, cors);
    }
  }

  const limitPerMinute = keyRow.rate_limit_per_minute || 100;
  if (!checkRateLimit(keyRow.id, limitPerMinute)) {
    return jsonResponse({ error: 'Rate limit exceeded', retry_after_seconds: 60 }, 429, cors);
  }

  const orgId = keyRow.organization_id;
  const startTime = Date.now();

  supabase.from('org_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRow.id).then();

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const endpoint = pathParts[pathParts.length - 1];

  try {
    let response: Response;
    switch (endpoint) {
      case 'clients':
        response = await handleClients(supabase, orgId, cors);
        break;
      case 'jobs':
        response = await handleJobs(supabase, orgId, url, cors);
        break;
      case 'applications':
        response = await handleApplications(supabase, orgId, url, cors);
        break;
      case 'stats':
        response = await handleStats(supabase, orgId, cors);
        break;
      default:
        response = jsonResponse({
          error: 'Unknown endpoint',
          available: ['/clients', '/jobs', '/applications', '/stats'],
        }, 404, cors);
    }

    const elapsed = Date.now() - startTime;
    supabase.from('api_request_logs').insert({
      api_key_id: keyRow.id, organization_id: orgId, endpoint,
      origin: origin || null, response_status: response.status, response_time_ms: elapsed,
    }).then();

    return response;
  } catch (err: unknown) {
    logger.error('Organization API error', err);
    supabase.from('api_request_logs').insert({
      api_key_id: keyRow.id, organization_id: orgId, endpoint,
      origin: origin || null, response_status: 500, response_time_ms: Date.now() - startTime,
    }).then();
    return jsonResponse({ error: 'Internal server error' }, 500, cors);
  }
});

// deno-lint-ignore no-explicit-any
async function handleClients(supabase: any, orgId: string, cors: Record<string, string>) {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, city, state, logo_url')
    .eq('organization_id', orgId);

  if (error) throw error;

  const enriched = await Promise.all((clients || []).map(async (client: ClientRow) => {
    const { count: activeJobs } = await supabase
      .from('job_listings')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('client_id', client.id)
      .eq('status', 'active');

    const { data: jobIds } = await supabase.from('job_listings').select('id').eq('client_id', client.id).eq('organization_id', orgId);
    const ids = (jobIds || []).map((j: JobRow) => j.id);

    let totalApps = 0;
    let recentApps = 0;
    if (ids.length > 0) {
      const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).in('job_listing_id', ids);
      totalApps = count || 0;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: recent } = await supabase.from('applications').select('*', { count: 'exact', head: true }).in('job_listing_id', ids).gte('applied_at', thirtyDaysAgo);
      recentApps = recent || 0;
    }

    return {
      id: client.id, name: client.name, city: client.city, state: client.state, logo_url: client.logo_url,
      active_jobs: activeJobs || 0, total_applications: totalApps, applications_this_month: recentApps,
    };
  }));

  return jsonResponse({ clients: enriched }, 200, cors);
}

// deno-lint-ignore no-explicit-any
async function handleJobs(supabase: any, orgId: string, url: URL, cors: Record<string, string>) {
  const clientId = url.searchParams.get('client_id');
  const status = url.searchParams.get('status') || 'active';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let query = supabase
    .from('job_listings')
    .select('id, title, location, status, city, state, created_at, client_id')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (clientId) query = query.eq('client_id', clientId);
  if (status !== 'all') query = query.eq('status', status);

  const { data: jobs, error } = await query;
  if (error) throw error;

  const enriched = await Promise.all((jobs || []).map(async (job: JobRow) => {
    const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('job_listing_id', job.id);
    return {
      id: job.id, title: job.title, location: job.location, city: job.city, state: job.state,
      status: job.status, client_id: job.client_id, application_count: count || 0, created_at: job.created_at,
    };
  }));

  return jsonResponse({ jobs: enriched, total: enriched.length }, 200, cors);
}

// deno-lint-ignore no-explicit-any
async function handleApplications(supabase: any, orgId: string, url: URL, cors: Record<string, string>) {
  const clientId = url.searchParams.get('client_id');
  const status = url.searchParams.get('status');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let jobQuery = supabase.from('job_listings').select('id, title, client_id').eq('organization_id', orgId);
  if (clientId) jobQuery = jobQuery.eq('client_id', clientId);
  const { data: jobs } = await jobQuery;
  const jobIds = (jobs || []).map((j: JobRow) => j.id);
  const jobMap = Object.fromEntries((jobs || []).map((j: JobRow) => [j.id, j]));

  if (jobIds.length === 0) {
    return jsonResponse({ applications: [], total: 0 }, 200, cors);
  }

  const clientIds = [...new Set((jobs || []).map((j: JobRow) => j.client_id).filter(Boolean))];
  let clientMap: Record<string, string> = {};
  if (clientIds.length > 0) {
    const { data: clients } = await supabase.from('clients').select('id, name').in('id', clientIds);
    clientMap = Object.fromEntries((clients || []).map((c: ClientRow) => [c.id, c.name]));
  }

  let appQuery = supabase
    .from('applications')
    .select('id, first_name, last_name, status, applied_at, source, city, state, phone, applicant_email, job_listing_id, exp, cdl', { count: 'exact' })
    .in('job_listing_id', jobIds)
    .order('applied_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) appQuery = appQuery.eq('status', status);

  const { data: apps, count, error } = await appQuery;
  if (error) throw error;

  const enriched = (apps || []).map((app: AppRow) => {
    const job = jobMap[app.job_listing_id!];
    return {
      id: app.id, first_name: app.first_name, last_name: app.last_name,
      status: app.status, applied_at: app.applied_at, source: app.source,
      city: app.city, state: app.state, phone: app.phone, email: app.applicant_email,
      experience: app.exp, cdl: app.cdl,
      job_title: (job as JobRow)?.title || 'Unknown',
      client_name: clientMap[(job as JobRow)?.client_id!] || 'Unassigned',
    };
  });

  return jsonResponse({ applications: enriched, total: count || 0 }, 200, cors);
}

// deno-lint-ignore no-explicit-any
async function handleStats(supabase: any, orgId: string, cors: Record<string, string>) {
  const { data: clients } = await supabase.from('clients').select('id, name').eq('organization_id', orgId);

  const { count: activeJobs } = await supabase
    .from('job_listings').select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId).eq('status', 'active');

  const { data: allJobs } = await supabase.from('job_listings').select('id, client_id').eq('organization_id', orgId);
  const allJobIds = (allJobs || []).map((j: JobRow) => j.id);

  let totalApps = 0;
  const appsByStatus: Record<string, number> = {};
  const appsByClient: Record<string, number> = {};
  let appsThisWeek = 0;

  if (allJobIds.length > 0) {
    const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).in('job_listing_id', allJobIds);
    totalApps = count || 0;

    const { data: apps } = await supabase.from('applications').select('status, job_listing_id').in('job_listing_id', allJobIds);

    const clientNameMap: Record<string, string> = {};
    (clients || []).forEach((c: ClientRow) => { clientNameMap[c.id] = c.name; });
    const jobClientMap: Record<string, string> = {};
    (allJobs || []).forEach((j: JobRow) => {
      jobClientMap[j.id] = clientNameMap[j.client_id!] || 'Unassigned';
    });

    (apps || []).forEach((a: AppRow) => {
      const s = a.status || 'pending';
      appsByStatus[s] = (appsByStatus[s] || 0) + 1;
      const cn = jobClientMap[a.job_listing_id!] || 'Unassigned';
      appsByClient[cn] = (appsByClient[cn] || 0) + 1;
    });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: weekCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).in('job_listing_id', allJobIds).gte('applied_at', weekAgo);
    appsThisWeek = weekCount || 0;
  }

  return jsonResponse({
    total_clients: (clients || []).length,
    active_jobs: activeJobs || 0,
    total_applications: totalApps,
    applications_by_status: appsByStatus,
    applications_by_client: appsByClient,
    applications_this_week: appsThisWeek,
  }, 200, cors);
}
