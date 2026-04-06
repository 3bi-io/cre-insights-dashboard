/**
 * ElevenLabs Agent Scheduling Tool Webhook
 * 
 * Called by ElevenLabs voice agent as a "tool" during conversation.
 * Allows the agent to:
 * 1. Check recruiter availability for a given time window
 * 2. Book a callback slot on the recruiter's calendar
 * 
 * Configure this as a webhook tool in ElevenLabs agent settings.
 */

import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders, handleCorsPreflightIfNeeded } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';
import { DEFAULT_TIMEZONE } from '../_shared/constants.ts';

const logger = createLogger('agent-scheduling');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

/** Sanitize phone to E.164-ish format */
function sanitizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

/** Validate UUID format */
function isValidUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/** Sanitize text input */
function sanitizeText(input: string | null | undefined, maxLen = 500): string | null {
  if (!input) return null;
  return input.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLen) || null;
}

/** Fetch with timeout */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface SchedulingParams {
  organization_id?: string;
  driver_timezone?: string;
  client_id?: string;
  application_id?: string;
  recruiter_user_id?: string;
  driver_name?: string;
  driver_phone?: string;
  selected_slot_start?: string;
  selected_slot_end?: string;
  notes?: string;
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const body = await req.json();
    
    const toolName: string = body.tool_name || body.action || '';
    const params: SchedulingParams = body.parameters || body;

    logger.info(`Agent scheduling tool called: ${toolName}`, { toolName });

    switch (toolName) {
      case 'check_availability':
        return await handleCheckAvailability(params, headers);
      case 'book_callback':
        return await handleBookCallback(params, headers);
      case 'get_next_slots':
        return await handleGetNextSlots(params, headers);
      default:
        return new Response(
          JSON.stringify({ result: `Unknown tool: ${toolName}. Available tools: check_availability, book_callback, get_next_slots` }),
          { status: 200, headers }
        );
    }
  } catch (error: unknown) {
    logger.error('Agent scheduling error', error);
    return new Response(
      JSON.stringify({ result: `I'm having trouble with scheduling right now. A recruiter will follow up with you directly.` }),
      { status: 200, headers }
    );
  }
});

async function handleCheckAvailability(
  params: SchedulingParams,
  headers: Record<string, string>
) {
  const { organization_id, driver_timezone, client_id, application_id } = params;

  if (!organization_id || !isValidUUID(organization_id)) {
    return new Response(
      JSON.stringify({ result: 'I need to know which organization to check availability for.' }),
      { status: 200, headers }
    );
  }

  const supabase = getServiceClient();

  // Resolve client_id from application if not provided
  let resolvedClientId = client_id && isValidUUID(client_id) ? client_id : null;
  if (!resolvedClientId && application_id && isValidUUID(application_id)) {
    const { data: app } = await supabase
      .from('applications').select('job_listing_id').eq('id', application_id).single();
    if (app?.job_listing_id) {
      const { data: job } = await supabase
        .from('job_listings').select('client_id').eq('id', app.job_listing_id).single();
      resolvedClientId = (job as Record<string, string>)?.client_id || null;
    }
  }

  // Find recruiters with connected calendars
  // deno-lint-ignore no-explicit-any
  let connections: any[] = [];
  
  if (resolvedClientId) {
    const { data: clientConns } = await supabase
      .from('recruiter_calendar_connections')
      .select('user_id, email, calendar_id')
      .eq('organization_id', organization_id)
      .eq('client_id', resolvedClientId)
      .eq('status', 'active');
    connections = clientConns || [];
  }

  if (connections.length === 0) {
    const { data: orgConns, error: connErr } = await supabase
      .from('recruiter_calendar_connections')
      .select('user_id, email, calendar_id')
      .eq('organization_id', organization_id)
      .is('client_id', null)
      .eq('status', 'active');

    if (connErr) {
      logger.error('Failed to query calendar connections', connErr);
      return new Response(
        JSON.stringify({ result: 'I\'m having trouble checking schedules right now. A recruiter will call you back during business hours.' }),
        { status: 200, headers }
      );
    }
    connections = orgConns || [];
  }

  if (connections.length === 0) {
    logger.info(`No calendar connections for org ${organization_id} — using no-calendar fallback`);
    
    try {
      const callbackFrom = new Date(Date.now() + 60 * 60 * 1000);
      const resolvedClientIdForFallback = resolvedClientId || null;
      const { data: nextBizTime } = await supabase.rpc('next_business_datetime', {
        p_org_id: organization_id,
        p_from: callbackFrom.toISOString(),
        p_client_id: resolvedClientIdForFallback,
      });
      
      const baseTime = nextBizTime ? new Date(nextBizTime) : callbackFrom;
      const jitterMinutes = 5 + Math.floor(Math.random() * 25);
      const scheduledTime = new Date(baseTime.getTime() + jitterMinutes * 60 * 1000);
      const scheduledAtIso = scheduledTime.toISOString();
      
      let appPhone: string | null = null;
      let appName: string | null = null;
      let voiceAgentId: string | null = null;
      
      if (application_id && isValidUUID(application_id)) {
        const { data: app } = await supabase
          .from('applications').select('phone, first_name, last_name').eq('id', application_id).single();
        if (app) {
          appPhone = sanitizePhone(app.phone);
          appName = [app.first_name, app.last_name].filter(Boolean).join(' ') || null;
        }
      }
      
      if (resolvedClientIdForFallback) {
        const { data: clientAgent } = await supabase
          .from('voice_agents').select('id')
          .eq('organization_id', organization_id)
          .eq('client_id', resolvedClientIdForFallback)
          .eq('is_outbound_enabled', true).eq('is_active', true)
          .not('agent_phone_number_id', 'is', null)
          .limit(1).maybeSingle();
        if (clientAgent) voiceAgentId = clientAgent.id;
      }
      if (!voiceAgentId) {
        const { data: orgAgent } = await supabase
          .from('voice_agents').select('id')
          .eq('organization_id', organization_id)
          .is('client_id', null)
          .eq('is_outbound_enabled', true).eq('is_active', true)
          .not('agent_phone_number_id', 'is', null)
          .limit(1).maybeSingle();
        if (orgAgent) voiceAgentId = orgAgent.id;
      }
      
      if (appPhone && voiceAgentId) {
        const { data: callbackCall, error: callbackErr } = await supabase
          .from('outbound_calls')
          .insert({
            application_id: application_id && isValidUUID(application_id) ? application_id : null,
            voice_agent_id: voiceAgentId, organization_id: organization_id,
            phone_number: appPhone, status: 'scheduled', scheduled_at: scheduledAtIso,
            retry_count: 1,
            metadata: {
              callback_purpose: 'business_hours_callback', no_calendar_fallback: true,
              is_after_hours_callback: true, triggered_by: 'agent_scheduling_no_calendar',
              client_id: resolvedClientIdForFallback,
            },
          })
          .select('id').single();
        
        if (callbackErr) {
          logger.error('Failed to schedule no-calendar fallback call', callbackErr);
        } else {
          logger.info(`Scheduled no-calendar fallback call ${callbackCall?.id} at ${scheduledAtIso}`);
        }
      }
      
      const { error: scErr } = await supabase
        .from('scheduled_callbacks')
        .insert({
          organization_id: organization_id,
          application_id: application_id && isValidUUID(application_id) ? application_id : null,
          client_id: resolvedClientIdForFallback,
          scheduled_start: scheduledAtIso,
          scheduled_end: new Date(scheduledTime.getTime() + 15 * 60 * 1000).toISOString(),
          status: 'pending',
          notes: `Auto-scheduled callback (no calendar connected). Candidate: ${appName || 'Unknown'}. AI will call back at this time — recruiter follow-up recommended.`,
          source: 'ai_agent',
        });
      
      if (scErr) {
        logger.error('Failed to create scheduled_callbacks record', scErr);
      }
      
      // Fetch org's configured timezone for display
      let displayTz = DEFAULT_TIMEZONE;
      let displayTzLabel = 'Central Time';
      try {
        const { data: orgSettings } = await supabase
          .from('organization_call_settings')
          .select('business_hours_timezone')
          .eq('organization_id', organization_id)
          .is('client_id', null)
          .maybeSingle();
        if (orgSettings?.business_hours_timezone) {
          displayTz = orgSettings.business_hours_timezone;
          displayTzLabel = displayTz.replace(/_/g, ' ').split('/').pop() || displayTz;
        }
      } catch { /* use default */ }
      
      const readableTime = scheduledTime.toLocaleString('en-US', {
        weekday: 'long', hour: 'numeric', minute: '2-digit', timeZone: displayTz,
      });
      
      return new Response(
        JSON.stringify({ 
          result: `I've scheduled a callback for you on ${readableTime} ${displayTzLabel} time. A recruiter will also be notified to follow up with you. Is there anything else I can help with?`,
          scheduled_at: scheduledAtIso, no_calendar_fallback: true,
        }),
        { status: 200, headers }
      );
    } catch (fallbackErr: unknown) {
      logger.error('No-calendar fallback error', fallbackErr);
      return new Response(
        JSON.stringify({ result: 'I\'ll make sure a recruiter calls you back during business hours. They\'ll reach out to you directly.' }),
        { status: 200, headers }
      );
    }
  }

  // Round-robin: check availability across ALL connected recruiters
  // deno-lint-ignore no-explicit-any
  let bestResult: { recruiterId: string; recruiterEmail: string; slots: any[]; duration: number } | null = null;

  for (const conn of connections) {
    const recruiterId = conn.user_id;

    const { data: prefs } = await supabase
      .from('recruiter_availability_preferences').select('*').eq('user_id', recruiterId).maybeSingle();

    const prefsData = prefs as Record<string, unknown> | null;
    const workStart = parseInt((prefsData?.working_hours_start as string)?.slice(0, 2) || '8', 10);
    const workEnd = parseInt((prefsData?.working_hours_end as string)?.slice(0, 2) || '12', 10);
    const workingDays: number[] = (prefsData?.working_days as number[]) || [1, 2, 3, 4, 5];
    const duration: number = (prefsData?.default_call_duration_minutes as number) || 15;
    const maxDaily: number = (prefsData?.max_daily_callbacks as number) || 20;
    const minNoticeHours: number = (prefsData?.min_booking_notice_hours as number) || 1;
    const allowSameDay: boolean = (prefsData?.allow_same_day_booking as boolean) ?? true;
    const recruiterTz = (prefsData?.timezone as string) || DEFAULT_TIMEZONE;

    const tz = driver_timezone || recruiterTz;
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);

    // Convert current time to recruiter's local timezone for accurate comparison
    const nowLocal = new Date(now.toLocaleString('en-US', { timeZone: recruiterTz }));
    const localHour = nowLocal.getHours();
    const localMinute = nowLocal.getMinutes();

    // Determine if we need to look at next day (in recruiter's local time)
    const isPastWorkEnd = localHour > workEnd || (localHour === workEnd && localMinute > 0);

    const candidateDate = new Date(nowLocal);
    if (!allowSameDay || isPastWorkEnd) {
      candidateDate.setDate(candidateDate.getDate() + 1);
    }

    // Find next working day
    for (let i = 0; i < 7; i++) {
      const dow = candidateDate.getDay() === 0 ? 7 : candidateDate.getDay();
      if (workingDays.includes(dow)) break;
      candidateDate.setDate(candidateDate.getDate() + 1);
    }

    // Build local date string and construct UTC equivalents
    const dateStr = candidateDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const startLocal = new Date(`${dateStr}T${String(workStart).padStart(2, '0')}:00:00`);
    const endLocal = new Date(`${dateStr}T${String(workEnd).padStart(2, '0')}:00:00`);

    // Convert recruiter-local times to UTC
    function localToUtc(localDate: Date, tzName: string): Date {
      const utcStr = localDate.toLocaleString('en-US', { timeZone: 'UTC' });
      const tzStr = localDate.toLocaleString('en-US', { timeZone: tzName });
      const diff = new Date(utcStr).getTime() - new Date(tzStr).getTime();
      return new Date(localDate.getTime() + diff);
    }

    const startTime = localToUtc(startLocal, recruiterTz);
    const endTime = localToUtc(endLocal, recruiterTz);
    const effectiveStart = startTime > minBookingTime ? startTime : minBookingTime;

    logger.info(`Scheduling window for recruiter ${recruiterId}: ${startTime.toISOString()} - ${endTime.toISOString()} (tz: ${recruiterTz}, localHour: ${localHour})`);

    // Day boundaries in recruiter's local timezone (for daily cap check)
    const dayStartLocal = new Date(`${dateStr}T00:00:00`);
    const dayEndLocal = new Date(`${dateStr}T23:59:59.999`);
    const dayStart = localToUtc(dayStartLocal, recruiterTz);
    const dayEnd = localToUtc(dayEndLocal, recruiterTz);

    const { count: existingCallbacks } = await supabase
      .from('scheduled_callbacks')
      .select('id', { count: 'exact', head: true })
      .eq('recruiter_user_id', recruiterId)
      .gte('scheduled_start', dayStart.toISOString())
      .lte('scheduled_start', dayEnd.toISOString())
      .neq('status', 'cancelled');

    if ((existingCallbacks || 0) >= maxDaily) continue;

    // deno-lint-ignore no-explicit-any
    let calData: any = { slots: [] };
    try {
      const calResponse = await fetchWithTimeout(`${SUPABASE_URL}/functions/v1/calendar-integration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify({
          action: 'get_availability', recruiterUserId: recruiterId,
          startTime: effectiveStart.toISOString(), endTime: endTime.toISOString(), durationMinutes: duration,
        }),
      });
      calData = await calResponse.json();
    } catch (e: unknown) {
      logger.error(`Calendar check failed for recruiter ${recruiterId}`, e);
      continue;
    }

    const slots = calData.slots || [];
    if (slots.length === 0) continue;

    if (!bestResult || new Date(slots[0].start) < new Date(bestResult.slots[0].start)) {
      bestResult = { recruiterId, recruiterEmail: conn.email, slots, duration };
    }
  }

  if (!bestResult) {
    return new Response(
      JSON.stringify({
        result: 'All recruiters are fully booked right now. Would you like a recruiter to call you back when they are free?',
        available_slots: [],
      }),
      { status: 200, headers }
    );
  }

  const tz = driver_timezone || 'America/Chicago';
  // deno-lint-ignore no-explicit-any
  const topSlots = bestResult.slots.slice(0, 3).map((s: any) => {
    const time = new Date(s.start);
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz });
  });

  const slotText = topSlots.length === 1
    ? topSlots[0]
    : topSlots.slice(0, -1).join(', ') + ' and ' + topSlots[topSlots.length - 1];

  return new Response(
    JSON.stringify({
      result: `I have openings at ${slotText}. Which time works best for you?`,
      available_slots: bestResult.slots.slice(0, 3),
      recruiter_user_id: bestResult.recruiterId,
      recruiter_email: bestResult.recruiterEmail,
      call_duration_minutes: bestResult.duration,
    }),
    { status: 200, headers }
  );
}

async function handleBookCallback(
  params: SchedulingParams,
  headers: Record<string, string>
) {
  const {
    recruiter_user_id, organization_id, application_id,
    driver_name: rawDriverName, driver_phone: rawDriverPhone,
    selected_slot_start, selected_slot_end, notes: rawNotes,
  } = params;

  if (!recruiter_user_id || !isValidUUID(recruiter_user_id)) {
    return new Response(
      JSON.stringify({ result: 'I need to identify the recruiter to book with.' }),
      { status: 200, headers }
    );
  }

  if (!selected_slot_start) {
    return new Response(
      JSON.stringify({ result: 'I need to know which time slot you\'d like.' }),
      { status: 200, headers }
    );
  }

  const slotDate = new Date(selected_slot_start);
  if (isNaN(slotDate.getTime())) {
    return new Response(
      JSON.stringify({ result: 'That doesn\'t seem like a valid time. Could you try again?' }),
      { status: 200, headers }
    );
  }

  if (slotDate < new Date()) {
    return new Response(
      JSON.stringify({ result: 'That time has already passed. Let me check for upcoming availability.' }),
      { status: 200, headers }
    );
  }

  const supabase = getServiceClient();
  const { data: prefs } = await supabase
    .from('recruiter_availability_preferences')
    .select('default_call_duration_minutes, auto_accept_bookings, max_daily_callbacks, timezone')
    .eq('user_id', recruiter_user_id)
    .maybeSingle();

  const prefsData = prefs as Record<string, unknown> | null;
  const duration: number = (prefsData?.default_call_duration_minutes as number) || 15;
  const autoAccept: boolean = (prefsData?.auto_accept_bookings as boolean) ?? true;
  const maxDaily: number = (prefsData?.max_daily_callbacks as number) || 20;
  const recruiterTz: string = (prefsData?.timezone as string) || 'America/Chicago';

  // Compute day boundaries in recruiter's local timezone (mirrors handleCheckAvailability)
  function localToUtc(localDate: Date, tzName: string): Date {
    const utcStr = localDate.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzStr = localDate.toLocaleString('en-US', { timeZone: tzName });
    const diff = new Date(utcStr).getTime() - new Date(tzStr).getTime();
    return new Date(localDate.getTime() + diff);
  }

  // Get the date string in recruiter's local timezone from the selected slot (which is UTC)
  const slotInRecruiterTz = new Date(slotDate.toLocaleString('en-US', { timeZone: recruiterTz }));
  const dateStr = slotInRecruiterTz.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const dayStartLocal = new Date(`${dateStr}T00:00:00`);
  const dayEndLocal = new Date(`${dateStr}T23:59:59.999`);
  const dayStart = localToUtc(dayStartLocal, recruiterTz);
  const dayEnd = localToUtc(dayEndLocal, recruiterTz);

  const { count: existingCallbacks } = await supabase
    .from('scheduled_callbacks')
    .select('id', { count: 'exact', head: true })
    .eq('recruiter_user_id', recruiter_user_id)
    .gte('scheduled_start', dayStart.toISOString())
    .lte('scheduled_start', dayEnd.toISOString())
    .neq('status', 'cancelled');

  if ((existingCallbacks || 0) >= maxDaily) {
    return new Response(
      JSON.stringify({ result: 'The recruiter\'s schedule is full for that day. Would you like me to check the next available day?' }),
      { status: 200, headers }
    );
  }

  const driver_name = sanitizeText(rawDriverName, 200);
  const driver_phone = sanitizePhone(rawDriverPhone);
  const notes = sanitizeText(rawNotes, 1000);

  const endTime = selected_slot_end || new Date(
    slotDate.getTime() + duration * 60 * 1000
  ).toISOString();

  // deno-lint-ignore no-explicit-any
  let bookData: any = {};
  try {
    const bookResponse = await fetchWithTimeout(`${SUPABASE_URL}/functions/v1/calendar-integration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({
        action: 'book_slot', recruiterUserId: recruiter_user_id,
        applicationId: application_id && isValidUUID(application_id) ? application_id : null,
        organizationId: organization_id && isValidUUID(organization_id) ? organization_id : null,
        driverName: driver_name, driverPhone: driver_phone,
        startTime: selected_slot_start, endTime: endTime,
        durationMinutes: duration, notes: notes || 'Scheduled by AI Voice Agent', autoAccept,
      }),
    });
    bookData = await bookResponse.json();
  } catch (e: unknown) {
    logger.error('Booking call failed', e);
    return new Response(
      JSON.stringify({ result: 'I couldn\'t complete the booking right now. A recruiter will reach out to you directly.' }),
      { status: 200, headers }
    );
  }

  if (!bookData.success) {
    return new Response(
      JSON.stringify({ result: 'I was unable to lock that time slot. It may have just been taken. Would you like me to check for other available times?' }),
      { status: 200, headers }
    );
  }

  if (driver_phone) {
    try {
      const smsResp = await fetchWithTimeout(`${SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify({
          to: driver_phone,
          message: `Your callback with a recruiter has been scheduled for ${new Date(selected_slot_start).toLocaleString('en-US', { 
            weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })}. Reply STOP to cancel.`,
          applicationId: application_id,
        }),
      }, 10000);
      await smsResp.text();
    } catch (e: unknown) {
      logger.warn('SMS confirmation failed', { error: e instanceof Error ? e.message : String(e) });
    }
  }

  const scheduledTime = new Date(selected_slot_start).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  const statusMsg = autoAccept
    ? `All set! Your callback has been confirmed for ${scheduledTime}. You'll receive a text confirmation shortly.`
    : `Your callback has been requested for ${scheduledTime}. The recruiter will confirm shortly. You'll receive a text when it's confirmed.`;

  return new Response(
    JSON.stringify({
      result: statusMsg,
      callback_id: bookData.callback?.id,
      calendar_event_created: bookData.calendarEventCreated,
    }),
    { status: 200, headers }
  );
}

/**
 * Intentional alias for handleCheckAvailability.
 * ElevenLabs agent tools are configured with separate "get_next_slots" and
 * "check_availability" actions; both resolve to the same availability logic.
 */
async function handleGetNextSlots(
  params: SchedulingParams,
  headers: Record<string, string>
) {
  const { organization_id, driver_timezone, client_id, application_id } = params;
  return handleCheckAvailability(
    { organization_id, driver_timezone, client_id, application_id },
    headers
  );
}
