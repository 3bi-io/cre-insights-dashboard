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

/** Sanitize text input - strip control chars, limit length */
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

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const body = await req.json();
    
    // ElevenLabs sends tool calls with a specific structure
    const toolName = body.tool_name || body.action || '';
    const params = body.parameters || body;

    console.log(`Agent scheduling tool called: ${toolName}`, JSON.stringify(params));

    switch (toolName) {
      case 'check_availability':
        return await handleCheckAvailability(params, headers);

      case 'book_callback':
        return await handleBookCallback(params, headers);

      case 'get_next_slots':
        return await handleGetNextSlots(params, headers);

      default:
        return new Response(
          JSON.stringify({ 
            result: `Unknown tool: ${toolName}. Available tools: check_availability, book_callback, get_next_slots` 
          }),
          { status: 200, headers }
        );
    }
  } catch (error: any) {
    console.error('Agent scheduling error:', error);
    return new Response(
      JSON.stringify({ result: `I'm having trouble with scheduling right now. A recruiter will follow up with you directly.` }),
      { status: 200, headers } // Return 200 so ElevenLabs can relay the error message
    );
  }
});

/**
 * Check availability for the next business morning
 * The agent calls this after verifying driver qualifications
 */
async function handleCheckAvailability(
  params: any,
  headers: Record<string, string>
) {
  const { organization_id, driver_timezone } = params;

  if (!organization_id || !isValidUUID(organization_id)) {
    return new Response(
      JSON.stringify({ result: 'I need to know which organization to check availability for.' }),
      { status: 200, headers }
    );
  }

  const supabase = getServiceClient();

  // Find recruiters with connected calendars in this org
  const { data: connections, error: connErr } = await supabase
    .from('recruiter_calendar_connections')
    .select('user_id, email, calendar_id')
    .eq('organization_id', organization_id)
    .eq('status', 'active');

  if (connErr) {
    console.error('Failed to query calendar connections:', connErr);
    return new Response(
      JSON.stringify({ result: 'I\'m having trouble checking schedules right now. A recruiter will call you back during business hours.' }),
      { status: 200, headers }
    );
  }

  if (!connections || connections.length === 0) {
    return new Response(
      JSON.stringify({ 
        result: 'No recruiters have connected their calendars yet. I can take your information and have a recruiter call you back during business hours.' 
      }),
      { status: 200, headers }
    );
  }

  const recruiterId = connections[0].user_id;

  // Load recruiter availability preferences
  const { data: prefs } = await supabase
    .from('recruiter_availability_preferences')
    .select('*')
    .eq('user_id', recruiterId)
    .maybeSingle();

  const workStart = parseInt((prefs as any)?.working_hours_start?.slice(0, 2) || '8', 10);
  const workEnd = parseInt((prefs as any)?.working_hours_end?.slice(0, 2) || '12', 10);
  const workingDays: number[] = (prefs as any)?.working_days || [1, 2, 3, 4, 5];
  const duration: number = (prefs as any)?.default_call_duration_minutes || 15;
  const maxDaily: number = (prefs as any)?.max_daily_callbacks || 20;
  const minNoticeHours: number = (prefs as any)?.min_booking_notice_hours || 1;
  const allowSameDay: boolean = (prefs as any)?.allow_same_day_booking ?? true;
  const recruiterTz = (prefs as any)?.timezone || 'America/Chicago';

  // Calculate next available business window respecting recruiter preferences
  const tz = driver_timezone || recruiterTz;
  const now = new Date();
  const minBookingTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);

  // Find next business day
  let candidate = new Date(now);
  if (!allowSameDay || now.getUTCHours() >= workEnd) {
    candidate.setDate(candidate.getDate() + 1);
  }
  
  // Skip non-working days (ISO: Mon=1, Sun=7)
  for (let i = 0; i < 7; i++) {
    const iso = candidate.getDay() === 0 ? 7 : candidate.getDay(); // Convert JS day to ISO
    if (workingDays.includes(iso)) break;
    candidate.setDate(candidate.getDate() + 1);
  }

  const startTime = new Date(candidate);
  startTime.setHours(workStart, 0, 0, 0);
  const endTime = new Date(candidate);
  endTime.setHours(workEnd, 0, 0, 0);

  // Ensure we respect minimum notice
  const effectiveStart = startTime > minBookingTime ? startTime : minBookingTime;

  // Check daily callback cap
  const dayStart = new Date(candidate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(candidate);
  dayEnd.setHours(23, 59, 59, 999);
  
  const { count: existingCallbacks } = await supabase
    .from('scheduled_callbacks')
    .select('id', { count: 'exact', head: true })
    .eq('recruiter_user_id', recruiterId)
    .gte('scheduled_start', dayStart.toISOString())
    .lte('scheduled_start', dayEnd.toISOString())
    .neq('status', 'cancelled');

  if ((existingCallbacks || 0) >= maxDaily) {
    return new Response(
      JSON.stringify({
        result: 'The recruiter\'s schedule is full for that day. Would you like me to check the next available day?',
        available_slots: [],
      }),
      { status: 200, headers }
    );
  }

  // Query calendar-integration for availability with timeout
  let calData: any = { slots: [] };
  try {
    const calResponse = await fetchWithTimeout(`${SUPABASE_URL}/functions/v1/calendar-integration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        action: 'get_availability',
        recruiterUserId: recruiterId,
        startTime: effectiveStart.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes: duration,
      }),
    });
    calData = await calResponse.json();
  } catch (e: any) {
    console.error('Calendar availability check failed:', e.message);
    return new Response(
      JSON.stringify({
        result: 'I couldn\'t check the schedule right now. Would you like a recruiter to call you back tomorrow morning?',
        available_slots: [],
      }),
      { status: 200, headers }
    );
  }

  const slots = calData.slots || [];

  if (slots.length === 0) {
    return new Response(
      JSON.stringify({
        result: 'Tomorrow morning is fully booked. Would you like me to check the afternoon, or would you prefer a recruiter calls you when they are free?',
        available_slots: [],
      }),
      { status: 200, headers }
    );
  }

  // Format top 2-3 slots for the agent to speak
  const topSlots = slots.slice(0, 3).map((s: any) => {
    const time = new Date(s.start);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: tz,
    });
  });

  const slotText = topSlots.length === 1 
    ? topSlots[0]
    : topSlots.slice(0, -1).join(', ') + ' and ' + topSlots[topSlots.length - 1];

  return new Response(
    JSON.stringify({
      result: `I have openings at ${slotText}. Which time works best for you?`,
      available_slots: slots.slice(0, 3),
      recruiter_user_id: recruiterId,
      recruiter_email: connections[0].email,
      call_duration_minutes: duration,
    }),
    { status: 200, headers }
  );
}

/**
 * Book a callback slot after the driver confirms a time
 */
async function handleBookCallback(
  params: any,
  headers: Record<string, string>
) {
  const {
    recruiter_user_id,
    organization_id,
    application_id,
    driver_name: rawDriverName,
    driver_phone: rawDriverPhone,
    selected_slot_start,
    selected_slot_end,
    notes: rawNotes,
  } = params;

  // Validate required fields
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

  // Validate date
  const slotDate = new Date(selected_slot_start);
  if (isNaN(slotDate.getTime())) {
    return new Response(
      JSON.stringify({ result: 'That doesn\'t seem like a valid time. Could you try again?' }),
      { status: 200, headers }
    );
  }

  // Prevent booking in the past
  if (slotDate < new Date()) {
    return new Response(
      JSON.stringify({ result: 'That time has already passed. Let me check for upcoming availability.' }),
      { status: 200, headers }
    );
  }

  // Sanitize inputs
  const driver_name = sanitizeText(rawDriverName, 200);
  const driver_phone = sanitizePhone(rawDriverPhone);
  const notes = sanitizeText(rawNotes, 1000);

  // Calculate end time if not provided (default 15 min)
  const endTime = selected_slot_end || new Date(
    slotDate.getTime() + 15 * 60 * 1000
  ).toISOString();

  let bookData: any = {};
  try {
    const bookResponse = await fetchWithTimeout(`${SUPABASE_URL}/functions/v1/calendar-integration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        action: 'book_slot',
        recruiterUserId: recruiter_user_id,
        applicationId: application_id && isValidUUID(application_id) ? application_id : null,
        organizationId: organization_id && isValidUUID(organization_id) ? organization_id : null,
        driverName: driver_name,
        driverPhone: driver_phone,
        startTime: selected_slot_start,
        endTime: endTime,
        durationMinutes: 15,
        notes: notes || 'Scheduled by AI Voice Agent',
      }),
    });
    bookData = await bookResponse.json();
  } catch (e: any) {
    console.error('Booking call failed:', e.message);
    return new Response(
      JSON.stringify({ result: 'I couldn\'t complete the booking right now. A recruiter will reach out to you directly.' }),
      { status: 200, headers }
    );
  }

  if (!bookData.success) {
    return new Response(
      JSON.stringify({ 
        result: 'I was unable to lock that time slot. It may have just been taken. Would you like me to check for other available times?' 
      }),
      { status: 200, headers }
    );
  }

  // Trigger SMS confirmation if we have a valid phone number
  if (driver_phone) {
    try {
      const smsResp = await fetchWithTimeout(`${SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: driver_phone,
          message: `Your callback with a recruiter has been scheduled for ${new Date(selected_slot_start).toLocaleString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}. Reply STOP to cancel.`,
          applicationId: application_id,
        }),
      }, 10000);
      // Consume the response body to prevent resource leak
      await smsResp.text();
    } catch (e) {
      console.warn('SMS confirmation failed:', e);
    }
  }

  const scheduledTime = new Date(selected_slot_start).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return new Response(
    JSON.stringify({
      result: `All set! Your callback has been scheduled for ${scheduledTime} tomorrow morning. You'll receive a text confirmation shortly. A recruiter will call you at that time. Is there anything else I can help with?`,
      callback_id: bookData.callback?.id,
      calendar_event_created: bookData.calendarEventCreated,
    }),
    { status: 200, headers }
  );
}

/**
 * Get next available slots (simpler version for quick queries)
 */
async function handleGetNextSlots(
  params: any,
  headers: Record<string, string>
) {
  const { organization_id } = params;
  
  // Delegate to check_availability with defaults
  return handleCheckAvailability(
    { organization_id, driver_timezone: 'America/Chicago' },
    headers
  );
}
