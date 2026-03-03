import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  
  if (entry.count >= limitPerMinute) {
    return false;
  }
  
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  // For preflight, we need to allow broadly since we don't have the API key yet
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

  // Validate API key
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    return jsonResponse({ error: 'Missing x-api-key header' }, 401, getCorsHeaders(origin));
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Look up API key with allowed_origins and rate limit
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

  // Validate origin against key's allowed origins (if origins are configured)
  if (origin && allowedOrigins.length > 0) {
    const isAllowed = allowedOrigins.some(o => origin.startsWith(o)) || isLovablePreview(origin);
    if (!isAllowed) {
      return jsonResponse({ error: 'Origin not allowed for this API key' }, 403, cors);
    }
  }

  // Rate limiting
  const limitPerMinute = keyRow.rate_limit_per_minute || 100;
  if (!checkRateLimit(keyRow.id, limitPerMinute)) {
    return jsonResponse({ 
      error: 'Rate limit exceeded', 
      retry_after_seconds: 60 
    }, 429, cors);
  }

  const orgId = keyRow.organization_id;
  const startTime = Date.now();

  // Update last_used_at (fire and forget)
  supabase.from('org_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRow.id).then();

  // Parse route
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

    // Log request (fire and forget)
    const elapsed = Date.now() - startTime;
    supabase.from('api_request_logs').insert({
      api_key_id: keyRow.id,
      organization_id: orgId,
      endpoint,
      origin: origin || null,
      response_status: response.status,
      response_time_ms: elapsed,
    }).then();

    return response;
  } catch (err) {
    console.error('Organization API error:', err);
    // Log error
    supabase.from('api_request_logs').insert({
      api_key_id: keyRow.id,
      organization_id: orgId,
      endpoint,
      origin: origin || null,
      response_status: 500,
      response_time_ms: Date.now() - startTime,
    }).then();
    return jsonResponse({ error: 'Internal server error' }, 500, cors);
  }
});

async function handleClients(supabase: any, orgId: string, cors: Record<string, string>) {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, city, state, logo_url')
    .eq('organization_id', orgId);

  if (error) throw error;

  const enriched = await Promise.all((clients || []).map(async (client: any) => {
    const { count: activeJobs } = await supabase
      .from('job_listings')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('client_id', client.id)
      .eq('status', 'active');

    const { data: jobIds } = await supabase.from('job_listings').select('id').eq('client_id', client.id).eq('organization_id', orgId);
    const ids = (jobIds || []).map((j: any) => j.id);

    let totalApps = 0;
    let recentApps = 0;
    if (ids.length > 0) {
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('job_listing_id', ids);
      totalApps = count || 0;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: recent } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('job_listing_id', ids)
        .gte('applied_at', thirtyDaysAgo);
      recentApps = recent || 0;
    }

    return {
      id: client.id,
      name: client.name,
      city: client.city,
      state: client.state,
      logo_url: client.logo_url,
      active_jobs: activeJobs || 0,
      total_applications: totalApps,
      applications_this_month: recentApps,
    };
  }));

  return jsonResponse({ clients: enriched }, 200, cors);
}

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

  const enriched = await Promise.all((jobs || []).map(async (job: any) => {
    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_listing_id', job.id);

    return {
      id: job.id,
      title: job.title,
      location: job.location,
      city: job.city,
      state: job.state,
      status: job.status,
      client_id: job.client_id,
      application_count: count || 0,
      created_at: job.created_at,
    };
  }));

  return jsonResponse({ jobs: enriched, total: enriched.length }, 200, cors);
}

async function handleApplications(supabase: any, orgId: string, url: URL, cors: Record<string, string>) {
  const clientId = url.searchParams.get('client_id');
  const status = url.searchParams.get('status');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let jobQuery = supabase.from('job_listings').select('id, title, client_id').eq('organization_id', orgId);
  if (clientId) jobQuery = jobQuery.eq('client_id', clientId);
  const { data: jobs } = await jobQuery;
  const jobIds = (jobs || []).map((j: any) => j.id);
  const jobMap = Object.fromEntries((jobs || []).map((j: any) => [j.id, j]));

  if (jobIds.length === 0) {
    return jsonResponse({ applications: [], total: 0 }, 200, cors);
  }

  const clientIds = [...new Set((jobs || []).map((j: any) => j.client_id).filter(Boolean))];
  let clientMap: Record<string, string> = {};
  if (clientIds.length > 0) {
    const { data: clients } = await supabase.from('clients').select('id, name').in('id', clientIds);
    clientMap = Object.fromEntries((clients || []).map((c: any) => [c.id, c.name]));
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

  const enriched = (apps || []).map((app: any) => {
    const job = jobMap[app.job_listing_id];
    return {
      id: app.id,
      first_name: app.first_name,
      last_name: app.last_name,
      status: app.status,
      applied_at: app.applied_at,
      source: app.source,
      city: app.city,
      state: app.state,
      phone: app.phone,
      email: app.applicant_email,
      experience: app.exp,
      cdl: app.cdl,
      job_title: job?.title || 'Unknown',
      client_name: clientMap[job?.client_id] || 'Unassigned',
    };
  });

  return jsonResponse({ applications: enriched, total: count || 0 }, 200, cors);
}

async function handleStats(supabase: any, orgId: string, cors: Record<string, string>) {
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('organization_id', orgId);

  const { count: activeJobs } = await supabase
    .from('job_listings')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active');

  const { data: allJobs } = await supabase
    .from('job_listings')
    .select('id, client_id')
    .eq('organization_id', orgId);
  const allJobIds = (allJobs || []).map((j: any) => j.id);

  let totalApps = 0;
  let appsByStatus: Record<string, number> = {};
  let appsByClient: Record<string, number> = {};
  let appsThisWeek = 0;

  if (allJobIds.length > 0) {
    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .in('job_listing_id', allJobIds);
    totalApps = count || 0;

    const { data: apps } = await supabase
      .from('applications')
      .select('status, job_listing_id')
      .in('job_listing_id', allJobIds);

    const clientMap: Record<string, string> = {};
    (clients || []).forEach((c: any) => { clientMap[c.id] = c.name; });
    const jobClientMap: Record<string, string> = {};
    (allJobs || []).forEach((j: any) => {
      jobClientMap[j.id] = clientMap[j.client_id] || 'Unassigned';
    });

    (apps || []).forEach((a: any) => {
      const s = a.status || 'pending';
      appsByStatus[s] = (appsByStatus[s] || 0) + 1;
      const cn = jobClientMap[a.job_listing_id] || 'Unassigned';
      appsByClient[cn] = (appsByClient[cn] || 0) + 1;
    });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: weekCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .in('job_listing_id', allJobIds)
      .gte('applied_at', weekAgo);
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
