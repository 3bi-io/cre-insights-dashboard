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

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const { action, ...params } = await req.json();

    switch (action) {
      case 'oauth_url':
        return handleOAuthUrl(req, corsHeaders);

      case 'oauth_callback':
        return handleOAuthCallback(req, params, corsHeaders);

      case 'get_availability':
        return handleGetAvailability(req, params, corsHeaders);

      case 'book_slot':
        return handleBookSlot(req, params, corsHeaders);

      case 'cancel_booking':
        return handleCancelBooking(req, params, corsHeaders);

      case 'list_connections':
        return handleListConnections(req, corsHeaders);

      case 'disconnect':
        return handleDisconnect(req, params, corsHeaders);

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

async function handleOAuthUrl(req: Request, corsHeaders: Record<string, string>) {
  const { userId } = await verifyUser(req);

  const params = new URLSearchParams({
    client_id: NYLAS_CLIENT_ID,
    redirect_uri: NYLAS_REDIRECT_URI,
    response_type: 'code',
    access_type: 'online',
    state: userId,
    provider: 'google', // can be extended to support microsoft, icloud
  });

  const authUrl = `https://api.us.nylas.com/v3/connect/auth?${params.toString()}`;

  return new Response(
    JSON.stringify({ success: true, url: authUrl }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleOAuthCallback(req: Request, params: any, corsHeaders: Record<string, string>) {
  const { code, state: userId } = params;

  if (!code || !userId) {
    throw new Error('Missing code or state (userId)');
  }

  // Exchange code for grant
  const tokenResponse = await fetch(`${NYLAS_API_BASE}/v3/connect/token`, {
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

  // Get primary calendar
  let calendarId = null;
  try {
    const calResponse = await fetch(`${NYLAS_API_BASE}/v3/grants/${grantId}/calendars`, {
      headers: { 'Authorization': `Bearer ${NYLAS_API_KEY}` },
    });
    if (calResponse.ok) {
      const calendars = await calResponse.json();
      const primary = calendars.data?.find((c: any) => c.is_primary) || calendars.data?.[0];
      calendarId = primary?.id || null;
    }
  } catch (e) {
    console.warn('Could not fetch calendars:', e);
  }

  // Store in DB
  const supabase = getServiceClient();
  
  // Get user's org
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  const { error: upsertError } = await supabase
    .from('recruiter_calendar_connections')
    .upsert({
      user_id: userId,
      organization_id: profile?.organization_id,
      provider: 'nylas',
      nylas_grant_id: grantId,
      calendar_id: calendarId,
      email,
      provider_type: provider,
      status: 'active',
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });

  if (upsertError) {
    console.error('Failed to store calendar connection:', upsertError);
    throw new Error('Failed to store calendar connection');
  }

  return new Response(
    JSON.stringify({ success: true, email, provider }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ============= Availability =============

async function handleGetAvailability(req: Request, params: any, corsHeaders: Record<string, string>) {
  const { recruiterUserId, startTime, endTime, durationMinutes = 15 } = params;

  if (!recruiterUserId || !startTime || !endTime) {
    throw new Error('Missing recruiterUserId, startTime, or endTime');
  }

  const supabase = getServiceClient();

  // Get recruiter's calendar connection
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
  const fbResponse = await fetch(`${NYLAS_API_BASE}/v3/grants/${connection.nylas_grant_id}/calendars/${connection.calendar_id}/free-busy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NYLAS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      start_time: Math.floor(new Date(startTime).getTime() / 1000),
      end_time: Math.floor(new Date(endTime).getTime() / 1000),
    }),
  });

  if (!fbResponse.ok) {
    // Fallback: use availability endpoint
    const availResponse = await fetch(`${NYLAS_API_BASE}/v3/calendars/availability`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NYLAS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        participants: [{ email: connection.calendar_id, calendar_ids: [connection.calendar_id] }],
        start_time: Math.floor(new Date(startTime).getTime() / 1000),
        end_time: Math.floor(new Date(endTime).getTime() / 1000),
        duration_minutes: durationMinutes,
        availability_rules: {
          buffer: { before: 5, after: 5 },
        },
      }),
    });

    if (!availResponse.ok) {
      const errText = await availResponse.text();
      console.error('Nylas availability query failed:', errText);
      throw new Error('Failed to query calendar availability');
    }

    const availData = await availResponse.json();
    return new Response(
      JSON.stringify({ success: true, slots: availData.data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const fbData = await fbResponse.json();
  
  // Calculate available slots from free/busy data
  const slots = calculateAvailableSlots(
    fbData.data || [],
    new Date(startTime),
    new Date(endTime),
    durationMinutes
  );

  return new Response(
    JSON.stringify({ success: true, slots }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function calculateAvailableSlots(
  busyPeriods: any[],
  windowStart: Date,
  windowEnd: Date,
  durationMinutes: number
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const durationMs = durationMinutes * 60 * 1000;
  const bufferMs = 5 * 60 * 1000; // 5 min buffer

  // Sort busy periods
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
    // Check gap before this busy period
    while (cursor.getTime() + durationMs + bufferMs <= period.start.getTime()) {
      const slotEnd = new Date(cursor.getTime() + durationMs);
      slots.push({
        start: cursor.toISOString(),
        end: slotEnd.toISOString(),
      });
      cursor = new Date(slotEnd.getTime() + bufferMs);
    }
    // Move cursor past busy period + buffer
    if (cursor < new Date(period.end.getTime() + bufferMs)) {
      cursor = new Date(period.end.getTime() + bufferMs);
    }
  }

  // Check remaining time after last busy period
  while (cursor.getTime() + durationMs <= windowEnd.getTime()) {
    const slotEnd = new Date(cursor.getTime() + durationMs);
    slots.push({
      start: cursor.toISOString(),
      end: slotEnd.toISOString(),
    });
    cursor = new Date(slotEnd.getTime() + bufferMs);
  }

  return slots;
}

// ============= Booking =============

async function handleBookSlot(req: Request, params: any, corsHeaders: Record<string, string>) {
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

  if (!recruiterUserId || !startTime || !endTime) {
    throw new Error('Missing required booking parameters');
  }

  const supabase = getServiceClient();

  // Get recruiter's calendar connection
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
    title: `AI Callback: ${driverName || 'Driver'}`,
    description: [
      `Driver: ${driverName || 'Unknown'}`,
      `Phone: ${driverPhone || 'N/A'}`,
      notes ? `Notes: ${notes}` : '',
      'Scheduled by AI Voice Agent',
    ].filter(Boolean).join('\n'),
    when: {
      start_time: Math.floor(new Date(startTime).getTime() / 1000),
      end_time: Math.floor(new Date(endTime).getTime() / 1000),
    },
    busy: true,
    status: 'confirmed',
  };

  const eventResponse = await fetch(
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

  let nylasEventId = null;
  if (eventResponse.ok) {
    const eventData = await eventResponse.json();
    nylasEventId = eventData.data?.id;
  } else {
    const errText = await eventResponse.text();
    console.error('Failed to create Nylas event:', errText);
    // Continue anyway - still record the callback
  }

  // Store scheduled callback
  const { data: callback, error: cbError } = await supabase
    .from('scheduled_callbacks')
    .insert({
      application_id: applicationId || null,
      organization_id: organizationId || null,
      recruiter_user_id: recruiterUserId,
      calendar_connection_id: connection.id,
      nylas_event_id: nylasEventId,
      driver_name: driverName,
      driver_phone: driverPhone,
      scheduled_start: startTime,
      scheduled_end: endTime,
      duration_minutes: durationMinutes,
      status: nylasEventId ? 'confirmed' : 'pending',
      booking_source: 'ai_agent',
      notes,
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
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ============= Cancel =============

async function handleCancelBooking(req: Request, params: any, corsHeaders: Record<string, string>) {
  const { callbackId } = params;
  if (!callbackId) throw new Error('Missing callbackId');

  const supabase = getServiceClient();

  const { data: callback } = await supabase
    .from('scheduled_callbacks')
    .select('*, recruiter_calendar_connections!calendar_connection_id(nylas_grant_id, calendar_id)')
    .eq('id', callbackId)
    .single();

  if (!callback) throw new Error('Callback not found');

  // Cancel Nylas event if exists
  if (callback.nylas_event_id && callback.recruiter_calendar_connections) {
    const conn = callback.recruiter_calendar_connections as any;
    try {
      await fetch(
        `${NYLAS_API_BASE}/v3/grants/${conn.nylas_grant_id}/events/${callback.nylas_event_id}?calendar_id=${conn.calendar_id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${NYLAS_API_KEY}` },
        }
      );
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
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ============= List / Disconnect =============

async function handleListConnections(req: Request, corsHeaders: Record<string, string>) {
  const { userId } = await verifyUser(req);
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('recruiter_calendar_connections')
    .select('id, email, provider_type, status, connected_at, calendar_id')
    .eq('user_id', userId);

  return new Response(
    JSON.stringify({ success: true, connections: data || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDisconnect(req: Request, params: any, corsHeaders: Record<string, string>) {
  const { userId } = await verifyUser(req);
  const { connectionId } = params;

  const supabase = getServiceClient();

  await supabase
    .from('recruiter_calendar_connections')
    .delete()
    .eq('id', connectionId)
    .eq('user_id', userId);

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
