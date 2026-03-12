/**
 * Calendar Integration Edge Function (Nylas)
 * 
 * Actions:
 * - oauth_url: Generate Nylas OAuth URL for recruiter to connect calendar
 * - oauth_callback: Exchange auth code for grant, store connection
 * - get_availability: Query recruiter availability for a time window
 * - book_slot: Create event on recruiter's calendar + scheduled_callback record
 * - cancel_booking: Cancel a scheduled callback
 * - list_connections: List recruiter's calendar connections
 * - disconnect: Remove a calendar connection
 */

import { getServiceClient, verifyUser } from '../_shared/supabase-client.ts';
import { getCorsHeaders, handleCorsPreflightIfNeeded } from '../_shared/cors-config.ts';

const NYLAS_API_KEY = Deno.env.get('NYLAS_API_KEY') || '';
const NYLAS_CLIENT_ID = Deno.env.get('NYLAS_CLIENT_ID') || '';
const NYLAS_REDIRECT_URI = Deno.env.get('NYLAS_REDIRECT_URI') || '';
const NYLAS_API_BASE = 'https://api.us.nylas.com';

/** Fetch with timeout to prevent hanging on external API calls */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Validate UUID format */
function isValidUUID(s: string | null | undefined): boolean {
  if (!s) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const body = await req.json();
    const { action, ...params } = body;

    if (!action || typeof action !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid action parameter' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    switch (action) {
      case 'oauth_url':
        return handleOAuthUrl(req, params, jsonHeaders);

      case 'oauth_callback':
        return handleOAuthCallback(req, params, jsonHeaders);

      case 'get_availability':
        return handleGetAvailability(req, params, jsonHeaders);

      case 'book_slot':
        return handleBookSlot(req, params, jsonHeaders);

      case 'cancel_booking':
        return handleCancelBooking(req, params, jsonHeaders);

      case 'list_connections':
        return handleListConnections(req, params, jsonHeaders);

      case 'disconnect':
        return handleDisconnect(req, params, jsonHeaders);

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: jsonHeaders }
        );
    }
  } catch (error: any) {
    console.error('Calendar integration error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============= OAuth =============

async function handleOAuthUrl(req: Request, params: any, headers: Record<string, string>) {
  const { userId } = await verifyUser(req);
  const { client_id: clientId } = params;

  if (!NYLAS_CLIENT_ID || !NYLAS_REDIRECT_URI) {
    throw new Error('Nylas OAuth not configured. Missing NYLAS_CLIENT_ID or NYLAS_REDIRECT_URI.');
  }

  // Encode userId and optional clientId in state as JSON
  const statePayload = JSON.stringify({
    userId,
    clientId: clientId && isValidUUID(clientId) ? clientId : null,
  });
  const stateEncoded = btoa(statePayload);

  const oauthParams = new URLSearchParams({
    client_id: NYLAS_CLIENT_ID,
    redirect_uri: NYLAS_REDIRECT_URI,
    response_type: 'code',
    access_type: 'online',
    state: stateEncoded,
    provider: 'google',
  });

  const authUrl = `https://api.us.nylas.com/v3/connect/auth?${oauthParams.toString()}`;

  return new Response(
    JSON.stringify({ success: true, url: authUrl }),
    { headers }
  );
}

async function handleOAuthCallback(req: Request, params: any, headers: Record<string, string>) {
  const { code, state } = params;

  if (!code || typeof code !== 'string') {
    throw new Error('Missing or invalid authorization code');
  }
  if (!state) {
    throw new Error('Missing state parameter');
  }

  // Parse state: either raw userId (legacy) or base64 JSON
  let userId: string;
  let clientId: string | null = null;
  
  try {
    const decoded = atob(state);
    const parsed = JSON.parse(decoded);
    userId = parsed.userId;
    clientId = parsed.clientId || null;
  } catch {
    // Legacy: state is just the userId
    userId = state;
  }

  if (!userId || !isValidUUID(userId)) {
    throw new Error('Missing or invalid userId in state');
  }
  if (clientId && !isValidUUID(clientId)) {
    clientId = null;
  }

  // Exchange code for grant
  const tokenResponse = await fetchWithTimeout(`${NYLAS_API_BASE}/v3/connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${NYLAS_CLIENT_ID}:${NYLAS_API_KEY}`)}`,
    },
    body: JSON.stringify({
      code,
      client_id: NYLAS_CLIENT_ID,
      client_secret: NYLAS_API_KEY,
      redirect_uri: NYLAS_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const errBody = await tokenResponse.text();
    console.error('Nylas token exchange failed:', errBody);
    throw new Error('Failed to exchange OAuth code');
  }

  const tokenData = await tokenResponse.json();
  const grantId = tokenData.grant_id;
  const email = tokenData.email;
  const provider = tokenData.provider || 'unknown';

  if (!grantId) {
    throw new Error('No grant_id returned from Nylas token exchange');
  }

  // Get primary calendar
  let calendarId = null;
  try {
    const calResponse = await fetchWithTimeout(`${NYLAS_API_BASE}/v3/grants/${grantId}/calendars`, {
      headers: { 'Authorization': `Bearer ${NYLAS_API_KEY}` },
    });
    if (calResponse.ok) {
      const calendars = await calResponse.json();
      const primary = calendars.data?.find((c: any) => c.is_primary) || calendars.data?.[0];
      calendarId = primary?.id || null;
    } else {
      await calResponse.text();
    }
  } catch (e) {
    console.warn('Could not fetch calendars:', e);
  }

  // Store in DB
  const supabase = getServiceClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  // Build the upsert record with client_id
  const connectionRecord: Record<string, any> = {
    user_id: userId,
    organization_id: profile?.organization_id,
    client_id: clientId,
    provider: 'nylas',
    nylas_grant_id: grantId,
    calendar_id: calendarId,
    email,
    provider_type: provider,
    status: 'active',
    connected_at: new Date().toISOString(),
  };

  // Use insert with ON CONFLICT since we have a functional unique index
  const { error: upsertError } = await supabase
    .from('recruiter_calendar_connections')
    .upsert(connectionRecord, { 
      onConflict: 'user_id,provider',
      ignoreDuplicates: false,
    });

  if (upsertError) {
    console.error('Failed to store calendar connection:', upsertError);
    // Try insert instead (functional index may not work with upsert)
    const { error: insertError } = await supabase
      .from('recruiter_calendar_connections')
      .insert(connectionRecord);
    
    if (insertError) {
      console.error('Insert also failed:', insertError);
      throw new Error('Failed to store calendar connection');
    }
  }

  return new Response(
    JSON.stringify({ success: true, email, provider }),
    { headers }
  );
}

// ============= Availability =============

async function handleGetAvailability(req: Request, params: any, headers: Record<string, string>) {
  const { recruiterUserId, startTime, endTime, durationMinutes } = params;

  if (!recruiterUserId || !isValidUUID(recruiterUserId)) {
    throw new Error('Missing or invalid recruiterUserId');
  }
  if (!startTime || !endTime) {
    throw new Error('Missing startTime or endTime');
  }

  // Validate dates
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid startTime or endTime format');
  }
  if (end <= start) {
    throw new Error('endTime must be after startTime');
  }

  const supabase = getServiceClient();

  // Load recruiter availability preferences for buffer/duration
  const { data: prefs } = await supabase
    .from('recruiter_availability_preferences')
    .select('buffer_before_minutes, buffer_after_minutes, default_call_duration_minutes')
    .eq('user_id', recruiterUserId)
    .maybeSingle();

  const prefDuration = (prefs as any)?.default_call_duration_minutes || 15;
  const bufferBefore = (prefs as any)?.buffer_before_minutes ?? 5;
  const bufferAfter = (prefs as any)?.buffer_after_minutes ?? 5;

  // Use caller-specified duration if provided, otherwise recruiter preference
  const duration = Math.min(Math.max(durationMinutes || prefDuration, 5), 120);
  const effectiveBuffer = Math.max(bufferBefore, bufferAfter);

  const { data: connection } = await supabase
    .from('recruiter_calendar_connections')
    .select('nylas_grant_id, calendar_id')
    .eq('user_id', recruiterUserId)
    .eq('status', 'active')
    .single();

  if (!connection) {
    throw new Error('Recruiter has no active calendar connection');
  }

  // Query Nylas free/busy
  const fbResponse = await fetchWithTimeout(`${NYLAS_API_BASE}/v3/grants/${connection.nylas_grant_id}/calendars/${connection.calendar_id}/free-busy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NYLAS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      start_time: Math.floor(start.getTime() / 1000),
      end_time: Math.floor(end.getTime() / 1000),
    }),
  });

  if (!fbResponse.ok) {
    const errText = await fbResponse.text();
    console.warn('Free/busy failed, trying availability endpoint:', errText);

    const availResponse = await fetchWithTimeout(`${NYLAS_API_BASE}/v3/calendars/availability`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NYLAS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        participants: [{ email: connection.calendar_id, calendar_ids: [connection.calendar_id] }],
        start_time: Math.floor(start.getTime() / 1000),
        end_time: Math.floor(end.getTime() / 1000),
        duration_minutes: duration,
        availability_rules: {
          buffer: { before: bufferBefore, after: bufferAfter },
        },
      }),
    });

    if (!availResponse.ok) {
      const availErrText = await availResponse.text();
      console.error('Nylas availability query failed:', availErrText);
      throw new Error('Failed to query calendar availability');
    }

    const availData = await availResponse.json();
    return new Response(
      JSON.stringify({ success: true, slots: availData.data || [] }),
      { headers }
    );
  }

  const fbData = await fbResponse.json();
  
  const slots = calculateAvailableSlots(
    fbData.data || [],
    start,
    end,
    duration,
    effectiveBuffer
  );

  return new Response(
    JSON.stringify({ success: true, slots }),
    { headers }
  );
}

function calculateAvailableSlots(
  busyPeriods: any[],
  windowStart: Date,
  windowEnd: Date,
  durationMinutes: number,
  bufferMinutes: number = 5
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const durationMs = durationMinutes * 60 * 1000;
  const bufferMs = bufferMinutes * 60 * 1000;

  const busy = busyPeriods
    .flatMap((p: any) => p.time_slots || [p])
    .filter((p: any) => p.status === 'busy')
    .map((p: any) => ({
      start: new Date(p.start_time * 1000),
      end: new Date(p.end_time * 1000),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  let cursor = windowStart;

  for (const period of busy) {
    while (cursor.getTime() + durationMs + bufferMs <= period.start.getTime()) {
      const slotEnd = new Date(cursor.getTime() + durationMs);
      slots.push({
        start: cursor.toISOString(),
        end: slotEnd.toISOString(),
      });
      cursor = new Date(slotEnd.getTime() + bufferMs);
    }
    if (cursor < new Date(period.end.getTime() + bufferMs)) {
      cursor = new Date(period.end.getTime() + bufferMs);
    }
  }

  while (cursor.getTime() + durationMs <= windowEnd.getTime()) {
    const slotEnd = new Date(cursor.getTime() + durationMs);
    slots.push({
      start: cursor.toISOString(),
      end: slotEnd.toISOString(),
    });
    cursor = new Date(slotEnd.getTime() + bufferMs);
  }

  // Safety: cap to 20 slots to prevent abuse
  return slots.slice(0, 20);
}

// ============= Booking =============

async function handleBookSlot(req: Request, params: any, headers: Record<string, string>) {
  const {
    recruiterUserId,
    applicationId,
    organizationId,
    driverName,
    driverPhone,
    startTime,
    endTime,
    durationMinutes = 15,
    notes,
  } = params;

  if (!recruiterUserId || !isValidUUID(recruiterUserId)) {
    throw new Error('Missing or invalid recruiterUserId');
  }
  if (!startTime || !endTime) {
    throw new Error('Missing required booking parameters (startTime, endTime)');
  }

  // Validate dates
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format for startTime or endTime');
  }
  if (start < new Date(Date.now() - 60000)) {
    throw new Error('Cannot book a slot in the past');
  }

  // Sanitize text inputs
  const safeName = (driverName || 'Driver').replace(/[\x00-\x1F\x7F]/g, '').slice(0, 200);
  const safeNotes = notes ? notes.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 1000) : 'Scheduled by AI Voice Agent';

  const supabase = getServiceClient();

  const { data: connection } = await supabase
    .from('recruiter_calendar_connections')
    .select('id, nylas_grant_id, calendar_id, email')
    .eq('user_id', recruiterUserId)
    .eq('status', 'active')
    .single();

  if (!connection) {
    throw new Error('Recruiter has no active calendar connection');
  }

  // Create event on Nylas calendar
  const eventPayload = {
    title: `AI Callback: ${safeName}`,
    description: [
      `Driver: ${safeName}`,
      `Phone: ${driverPhone || 'N/A'}`,
      safeNotes !== 'Scheduled by AI Voice Agent' ? `Notes: ${safeNotes}` : '',
      'Scheduled by AI Voice Agent',
    ].filter(Boolean).join('\n'),
    when: {
      start_time: Math.floor(start.getTime() / 1000),
      end_time: Math.floor(end.getTime() / 1000),
    },
    busy: true,
    status: 'confirmed',
  };

  let nylasEventId = null;
  try {
    const eventResponse = await fetchWithTimeout(
      `${NYLAS_API_BASE}/v3/grants/${connection.nylas_grant_id}/events?calendar_id=${connection.calendar_id}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NYLAS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      }
    );

    if (eventResponse.ok) {
      const eventData = await eventResponse.json();
      nylasEventId = eventData.data?.id;
    } else {
      const errText = await eventResponse.text();
      console.error('Failed to create Nylas event:', errText);
    }
  } catch (e: any) {
    console.error('Nylas event creation timed out or failed:', e.message);
  }

  // Store scheduled callback
  const { data: callback, error: cbError } = await supabase
    .from('scheduled_callbacks')
    .insert({
      application_id: applicationId && isValidUUID(applicationId) ? applicationId : null,
      organization_id: organizationId && isValidUUID(organizationId) ? organizationId : null,
      recruiter_user_id: recruiterUserId,
      calendar_connection_id: connection.id,
      nylas_event_id: nylasEventId,
      driver_name: safeName,
      driver_phone: driverPhone,
      scheduled_start: startTime,
      scheduled_end: endTime,
      duration_minutes: Math.min(Math.max(durationMinutes, 5), 120),
      status: nylasEventId ? 'confirmed' : 'pending',
      booking_source: 'ai_agent',
      notes: safeNotes,
    })
    .select()
    .single();

  if (cbError) {
    console.error('Failed to create scheduled callback:', cbError);
    throw new Error('Failed to record scheduled callback');
  }

  return new Response(
    JSON.stringify({
      success: true,
      callback,
      calendarEventCreated: !!nylasEventId,
    }),
    { headers }
  );
}

// ============= Cancel =============

async function handleCancelBooking(req: Request, params: any, headers: Record<string, string>) {
  const { callbackId } = params;
  if (!callbackId || !isValidUUID(callbackId)) {
    throw new Error('Missing or invalid callbackId');
  }

  const supabase = getServiceClient();

  const { data: callback } = await supabase
    .from('scheduled_callbacks')
    .select('*, recruiter_calendar_connections!calendar_connection_id(nylas_grant_id, calendar_id)')
    .eq('id', callbackId)
    .single();

  if (!callback) throw new Error('Callback not found');

  // Prevent double-cancel
  if (callback.status === 'cancelled') {
    return new Response(
      JSON.stringify({ success: true, message: 'Already cancelled' }),
      { headers }
    );
  }

  // Cancel Nylas event if exists
  if (callback.nylas_event_id && callback.recruiter_calendar_connections) {
    const conn = callback.recruiter_calendar_connections as any;
    try {
      const delResp = await fetchWithTimeout(
        `${NYLAS_API_BASE}/v3/grants/${conn.nylas_grant_id}/events/${callback.nylas_event_id}?calendar_id=${conn.calendar_id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${NYLAS_API_KEY}` },
        }
      );
      await delResp.text(); // consume response
    } catch (e) {
      console.warn('Failed to delete Nylas event:', e);
    }
  }

  await supabase
    .from('scheduled_callbacks')
    .update({ status: 'cancelled' })
    .eq('id', callbackId);

  return new Response(
    JSON.stringify({ success: true }),
    { headers }
  );
}

// ============= List / Disconnect =============

async function handleListConnections(req: Request, params: any, headers: Record<string, string>) {
  const { userId } = await verifyUser(req);
  const supabase = getServiceClient();
  const { client_id: clientId, organization_id: orgId, include_org } = params;

  // If include_org or orgId is set, return all org connections (admin view)
  if (include_org || orgId) {
    const targetOrgId = orgId || (await supabase.from('profiles').select('organization_id').eq('id', userId).single()).data?.organization_id;
    
    if (!targetOrgId) {
      throw new Error('Could not determine organization');
    }

    let query = supabase
      .from('recruiter_calendar_connections')
      .select('id, user_id, email, provider_type, status, connected_at, calendar_id, client_id')
      .eq('organization_id', targetOrgId);

    if (clientId && isValidUUID(clientId)) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Failed to list org connections:', error);
      throw new Error('Failed to list calendar connections');
    }

    return new Response(
      JSON.stringify({ success: true, connections: data || [] }),
      { headers }
    );
  }

  // Default: user's own connections
  const { data, error } = await supabase
    .from('recruiter_calendar_connections')
    .select('id, email, provider_type, status, connected_at, calendar_id, client_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to list connections:', error);
    throw new Error('Failed to list calendar connections');
  }

  return new Response(
    JSON.stringify({ success: true, connections: data || [] }),
    { headers }
  );
}

async function handleDisconnect(req: Request, params: any, headers: Record<string, string>) {
  const { userId } = await verifyUser(req);
  const { connectionId } = params;

  if (!connectionId || !isValidUUID(connectionId)) {
    throw new Error('Missing or invalid connectionId');
  }

  const supabase = getServiceClient();

  // Check if user owns this connection OR is an admin in the same org
  const { data: conn } = await supabase
    .from('recruiter_calendar_connections')
    .select('id, user_id, organization_id')
    .eq('id', connectionId)
    .single();

  if (!conn) {
    throw new Error('Connection not found');
  }

  // Allow if user owns it or is in the same org (RLS will enforce org check)
  if (conn.user_id !== userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();
    
    if (profile?.organization_id !== conn.organization_id) {
      throw new Error('Not authorized to disconnect this calendar');
    }
  }

  const { error } = await supabase
    .from('recruiter_calendar_connections')
    .delete()
    .eq('id', connectionId);

  if (error) {
    console.error('Failed to disconnect:', error);
    throw new Error('Failed to disconnect calendar');
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers }
  );
}
