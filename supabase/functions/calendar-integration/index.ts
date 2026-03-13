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
 * - send_calendar_invite: Admin sends invite email to recruiter
 * - redeem_calendar_invite: Validate token and return OAuth URL
 * - list_invitations: List pending/completed invitations for org
 */

import { getServiceClient, verifyUser } from '../_shared/supabase-client.ts';
import { getCorsHeaders, handleCorsPreflightIfNeeded } from '../_shared/cors-config.ts';
import { getSender } from '../_shared/email-config.ts';

const NYLAS_API_KEY = Deno.env.get('NYLAS_API_KEY') || '';
const NYLAS_CLIENT_ID = Deno.env.get('NYLAS_CLIENT_ID') || '';
const NYLAS_REDIRECT_URI = Deno.env.get('NYLAS_REDIRECT_URI') || '';
const NYLAS_API_BASE = Deno.env.get('NYLAS_API_BASE') || 'https://api.us.nylas.com';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

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

/** Generate a cryptographically secure URL-safe token */
function generateSecureToken(length = 48): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, length);
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

      case 'test_connection':
        return handleTestConnection(req, params, jsonHeaders);

      case 'oauth_diagnostics':
        return handleOAuthDiagnostics(req, jsonHeaders);

      case 'send_calendar_invite':
        return handleSendCalendarInvite(req, params, jsonHeaders);

      case 'redeem_calendar_invite':
        return handleRedeemCalendarInvite(params, jsonHeaders);

      case 'list_invitations':
        return handleListInvitations(req, params, jsonHeaders);

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

  const oauthParams: Record<string, string> = {
    client_id: NYLAS_CLIENT_ID,
    redirect_uri: NYLAS_REDIRECT_URI,
    response_type: 'code',
    access_type: 'online',
    state: stateEncoded,
  };

  // Only add provider if explicitly requested and valid
  const { provider } = params;
  const VALID_PROVIDERS = ['google', 'microsoft', 'icloud'];
  if (provider && VALID_PROVIDERS.includes(provider)) {
    oauthParams.provider = provider;
  }

  const authUrl = `${NYLAS_API_BASE}/v3/connect/auth?${new URLSearchParams(oauthParams).toString()}`;

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

  // Parse state: either raw userId (legacy), base64 JSON with userId, or invite-based
  let userId: string | null = null;
  let clientId: string | null = null;
  let inviteToken: string | null = null;
  
  try {
    const decoded = atob(state);
    const parsed = JSON.parse(decoded);
    userId = parsed.userId || null;
    clientId = parsed.clientId || null;
    inviteToken = parsed.inviteToken || null;
  } catch {
    // Legacy: state is just the userId
    userId = state;
  }

  const supabase = getServiceClient();

  // If invite-based flow, resolve org/client from the invitation
  let organizationId: string | null = null;
  let inviteEmail: string | null = null;

  if (inviteToken) {
    const { data: invitation, error: invErr } = await supabase
      .from('calendar_invitations')
      .select('id, organization_id, client_id, recruiter_email, status, expires_at')
      .eq('token', inviteToken)
      .single();

    if (invErr || !invitation) {
      throw new Error('Invalid or expired invitation token');
    }
    if (invitation.status !== 'pending') {
      throw new Error('This invitation has already been used');
    }
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabase.from('calendar_invitations').update({ status: 'expired' }).eq('id', invitation.id);
      throw new Error('This invitation has expired');
    }

    organizationId = invitation.organization_id;
    clientId = invitation.client_id || clientId;
    inviteEmail = invitation.recruiter_email;
  }

  if (!userId && !inviteToken) {
    throw new Error('Missing userId or invite token in state');
  }
  if (userId && !isValidUUID(userId)) {
    throw new Error('Invalid userId format');
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

  // For invite-based flow without a userId, try to find or create a profile by email
  if (!userId && inviteEmail) {
    // Look up existing profile by email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail)
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      // Use the email from the OAuth response as the connection owner
      // Store with a placeholder user_id — the invite email is the identifier
      const { data: emailProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (emailProfile) {
        userId = emailProfile.id;
      }
    }
  }

  // Determine organization_id
  if (!organizationId && userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();
    organizationId = profile?.organization_id || null;
  }

  // Build the connection record
  const connectionRecord: Record<string, any> = {
    user_id: userId,
    organization_id: organizationId,
    client_id: clientId,
    provider: 'nylas',
    nylas_grant_id: grantId,
    calendar_id: calendarId,
    email,
    provider_type: provider,
    status: 'active',
    connected_at: new Date().toISOString(),
  };

  if (userId) {
    // Manual select-then-insert/update to handle functional unique index
    let matchQuery = supabase
      .from('recruiter_calendar_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'nylas');

    if (clientId) {
      matchQuery = matchQuery.eq('client_id', clientId);
    } else {
      matchQuery = matchQuery.is('client_id', null);
    }

    const { data: matchedRows } = await matchQuery;
    const existingRow = matchedRows?.[0];

    if (existingRow) {
      const { error: updateError } = await supabase
        .from('recruiter_calendar_connections')
        .update({
          nylas_grant_id: grantId,
          calendar_id: calendarId,
          email,
          provider_type: provider,
          status: 'active',
          connected_at: new Date().toISOString(),
          organization_id: organizationId,
        })
        .eq('id', existingRow.id);

      if (updateError) {
        console.error('Failed to update calendar connection:', updateError);
        throw new Error('Failed to update calendar connection');
      }
    } else {
      const { error: insertError } = await supabase
        .from('recruiter_calendar_connections')
        .insert(connectionRecord);

      if (insertError) {
        console.error('Failed to insert calendar connection:', insertError);
        throw new Error('Failed to store calendar connection');
      }
    }
  } else {
    // No userId found — store connection with email as identifier
    // Remove user_id since it's null and the column may be NOT NULL
    console.warn('No user_id found for invite-based connection, email:', email);
    throw new Error('Could not find a user profile for the connected email. The recruiter may need to create an account first.');
  }

  // Mark invitation as completed
  if (inviteToken) {
    await supabase
      .from('calendar_invitations')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('token', inviteToken);
  }

  return new Response(
    JSON.stringify({ success: true, email, provider, inviteCompleted: !!inviteToken }),
    { headers }
  );
}

// ============= Calendar Invite Flow =============

async function handleSendCalendarInvite(req: Request, params: any, headers: Record<string, string>) {
  const { userId } = await verifyUser(req);
  const { recruiter_email, client_id: clientId } = params;

  if (!recruiter_email || typeof recruiter_email !== 'string' || !recruiter_email.includes('@')) {
    throw new Error('A valid recruiter email is required');
  }

  const supabase = getServiceClient();

  // Get admin's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (!profile?.organization_id) {
    throw new Error('Could not determine your organization');
  }

  // Get organization name for the email
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile.organization_id)
    .single();

  const orgName = org?.name || 'Your Organization';

  // Generate secure token
  const token = generateSecureToken();

  // Create invitation record
  const { error: insertError } = await supabase
    .from('calendar_invitations')
    .insert({
      organization_id: profile.organization_id,
      client_id: clientId && isValidUUID(clientId) ? clientId : null,
      recruiter_email: recruiter_email.trim().toLowerCase(),
      invited_by: userId,
      token,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

  if (insertError) {
    console.error('Failed to create calendar invitation:', insertError);
    throw new Error('Failed to create invitation');
  }

  // Send email via Resend
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, invitation created but email not sent');
    return new Response(
      JSON.stringify({ success: true, emailSent: false, message: 'Invitation created but email service is not configured' }),
      { headers }
    );
  }

  const inviteUrl = `https://applyai.jobs/calendar/connect?token=${token}`;

  try {
    const emailResponse = await fetchWithTimeout('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getSender('invites'),
        to: [recruiter_email.trim()],
        subject: `${orgName} — Connect Your Calendar`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Connect Your Calendar</h1>
              </div>
              <div style="padding: 32px 24px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                  Hi there,
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  <strong>${orgName}</strong> has invited you to connect your calendar. This allows the AI scheduling agent to check your availability and book driver callbacks on your behalf.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${inviteUrl}" style="display: inline-block; background-color: #2563eb; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Connect Calendar
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
                  This link expires in 7 days. If you didn't expect this email, you can safely ignore it.
                </p>
              </div>
              <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">Powered by ApplyAI</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error('Resend email failed:', errText);
      return new Response(
        JSON.stringify({ success: true, emailSent: false, message: 'Invitation created but email failed to send' }),
        { headers }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailSent: true }),
      { headers }
    );
  } catch (e: any) {
    console.error('Email send error:', e);
    return new Response(
      JSON.stringify({ success: true, emailSent: false, message: 'Invitation created but email failed: ' + e.message }),
      { headers }
    );
  }
}

async function handleRedeemCalendarInvite(params: any, headers: Record<string, string>) {
  const { token } = params;

  if (!token || typeof token !== 'string') {
    throw new Error('Missing invitation token');
  }

  if (!NYLAS_CLIENT_ID || !NYLAS_REDIRECT_URI) {
    throw new Error('Calendar integration not configured');
  }

  const supabase = getServiceClient();

  // Look up invitation
  const { data: invitation, error } = await supabase
    .from('calendar_invitations')
    .select('id, organization_id, client_id, recruiter_email, status, expires_at')
    .eq('token', token)
    .single();

  if (error || !invitation) {
    throw new Error('Invalid invitation token');
  }

  if (invitation.status === 'completed') {
    throw new Error('This invitation has already been used');
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from('calendar_invitations').update({ status: 'expired' }).eq('id', invitation.id);
    throw new Error('This invitation has expired');
  }

  // Get organization name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', invitation.organization_id)
    .single();

  // Generate OAuth URL with invite context in state
  const statePayload = JSON.stringify({
    inviteToken: token,
    clientId: invitation.client_id,
  });
  const stateEncoded = btoa(statePayload);

  const oauthParams: Record<string, string> = {
    client_id: NYLAS_CLIENT_ID,
    redirect_uri: NYLAS_REDIRECT_URI,
    response_type: 'code',
    access_type: 'online',
    state: stateEncoded,
    login_hint: invitation.recruiter_email,
  };

  const authUrl = `${NYLAS_API_BASE}/v3/connect/auth?${new URLSearchParams(oauthParams).toString()}`;

  return new Response(
    JSON.stringify({
      success: true,
      url: authUrl,
      organization_name: org?.name || 'Organization',
      recruiter_email: invitation.recruiter_email,
      status: invitation.status,
    }),
    { headers }
  );
}

async function handleListInvitations(req: Request, params: any, headers: Record<string, string>) {
  const { userId } = await verifyUser(req);
  const supabase = getServiceClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (!profile?.organization_id) {
    throw new Error('Could not determine organization');
  }

  const { data: invitations, error } = await supabase
    .from('calendar_invitations')
    .select('id, recruiter_email, client_id, status, created_at, expires_at, completed_at')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to list invitations:', error);
    throw new Error('Failed to list invitations');
  }

  return new Response(
    JSON.stringify({ success: true, invitations: invitations || [] }),
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

async function handleTestConnection(_req: Request, params: any, headers: Record<string, string>) {
  const { connectionId } = params;
  if (!connectionId || !isValidUUID(connectionId)) {
    throw new Error('Missing or invalid connectionId');
  }

  const supabase = getServiceClient();
  const { data: conn } = await supabase
    .from('recruiter_calendar_connections')
    .select('nylas_grant_id, email')
    .eq('id', connectionId)
    .single();

  if (!conn) throw new Error('Connection not found');
  if (!conn.nylas_grant_id) {
    return new Response(
      JSON.stringify({ success: true, healthy: false, error: 'No Nylas grant ID stored' }),
      { headers }
    );
  }

  try {
    const resp = await fetchWithTimeout(
      `${NYLAS_API_BASE}/v3/grants/${conn.nylas_grant_id}`,
      { headers: { 'Authorization': `Bearer ${NYLAS_API_KEY}` } }
    );
    const body = await resp.text();

    if (resp.ok) {
      return new Response(
        JSON.stringify({ success: true, healthy: true, email: conn.email }),
        { headers }
      );
    } else {
      console.warn('Nylas grant check failed:', body);
      return new Response(
        JSON.stringify({ success: true, healthy: false, error: 'Grant is invalid or expired' }),
        { headers }
      );
    }
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: true, healthy: false, error: e.message || 'Connection test timed out' }),
      { headers }
    );
  }
}

// ============= Diagnostics =============

async function handleOAuthDiagnostics(req: Request, headers: Record<string, string>) {
  await verifyUser(req);

  const diagnostics = {
    nylas_client_id_set: !!NYLAS_CLIENT_ID,
    nylas_client_id_preview: NYLAS_CLIENT_ID ? `${NYLAS_CLIENT_ID.slice(0, 8)}...` : null,
    nylas_api_key_set: !!NYLAS_API_KEY,
    nylas_redirect_uri: NYLAS_REDIRECT_URI || null,
    nylas_api_base: NYLAS_API_BASE,
    auth_endpoint: `${NYLAS_API_BASE}/v3/connect/auth`,
    token_endpoint: `${NYLAS_API_BASE}/v3/connect/token`,
  };

  return new Response(
    JSON.stringify({ success: true, diagnostics }),
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
