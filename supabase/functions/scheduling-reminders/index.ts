/**
 * Scheduling Reminders Cron
 *
 * Runs every minute via pg_cron and processes due rows in `scheduling_reminders`.
 *
 * Reminder kinds:
 *  - driver_1h     → SMS + email to driver 1 hour before the call
 *  - recruiter_15m → email to recruiter 15 minutes before the call
 *
 * Idempotent: rows are claimed by status flip from 'pending' → 'sent'/'failed'.
 */

import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders, handleCorsPreflightIfNeeded } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('scheduling-reminders');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const RESEND_FROM = Deno.env.get('RESEND_FROM_EMAIL') || 'Apply AI <onboarding@resend.dev>';

interface CallbackRow {
  id: string;
  driver_name: string | null;
  driver_phone: string | null;
  driver_email: string | null;
  scheduled_start: string;
  conference_url: string | null;
  status: string;
  application_id: string | null;
  recruiter_user_id: string | null;
  recruiter_calendar_connections?: { email: string | null } | null;
}

interface ReminderRow {
  id: string;
  callback_id: string;
  kind: 'driver_1h' | 'recruiter_15m';
  fire_at: string;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
    logger.warn('Email skipped — RESEND_API_KEY or LOVABLE_API_KEY missing');
    return false;
  }
  const resp = await fetchWithTimeout(
    'https://connector-gateway.lovable.dev/resend/emails',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html }),
    }
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Resend error ${resp.status}: ${text}`);
  }
  return true;
}

async function sendSms(to: string, message: string, applicationId: string | null) {
  const resp = await fetchWithTimeout(
    `${SUPABASE_URL}/functions/v1/send-sms`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ to, message, applicationId }),
    },
    10000
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`send-sms error ${resp.status}: ${text}`);
  }
  return true;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

async function processDriverReminder(cb: CallbackRow): Promise<void> {
  const when = formatTime(cb.scheduled_start);
  const driverName = cb.driver_name || 'there';
  const conf = cb.conference_url ? `\nJoin link: ${cb.conference_url}` : '';

  const tasks: Promise<unknown>[] = [];
  if (cb.driver_phone) {
    tasks.push(
      sendSms(
        cb.driver_phone,
        `Hi ${driverName}, reminder: your recruiter callback is in about 1 hour at ${when}.${conf} Reply STOP to opt out.`,
        cb.application_id
      )
    );
  }
  if (cb.driver_email) {
    const html = `
      <p>Hi ${driverName},</p>
      <p>This is a friendly reminder that your callback with a recruiter is scheduled for <strong>${when}</strong> — about 1 hour from now.</p>
      ${cb.conference_url ? `<p><a href="${cb.conference_url}">Click here to join the meeting</a></p>` : ''}
      <p>If you need to reschedule, just reply or contact us directly.</p>
      <p>— Apply AI</p>
    `;
    tasks.push(sendEmail(cb.driver_email, `Reminder: callback at ${when}`, html));
  }
  if (tasks.length === 0) {
    throw new Error('No driver contact channel available (phone/email both empty)');
  }
  await Promise.all(tasks);
}

async function processRecruiterReminder(cb: CallbackRow): Promise<void> {
  const recruiterEmail = cb.recruiter_calendar_connections?.email;
  if (!recruiterEmail) {
    throw new Error('Recruiter email not available on calendar connection');
  }
  const when = formatTime(cb.scheduled_start);
  const html = `
    <p>Heads up — your AI-scheduled callback is coming up in 15 minutes.</p>
    <ul>
      <li><strong>When:</strong> ${when}</li>
      <li><strong>Driver:</strong> ${cb.driver_name || 'Unknown'}</li>
      <li><strong>Phone:</strong> ${cb.driver_phone || 'N/A'}</li>
      ${cb.driver_email ? `<li><strong>Email:</strong> ${cb.driver_email}</li>` : ''}
      ${cb.conference_url ? `<li><strong>Join link:</strong> <a href="${cb.conference_url}">${cb.conference_url}</a></li>` : ''}
    </ul>
    <p>— Apply AI</p>
  `;
  await sendEmail(recruiterEmail, `Callback in 15 min: ${cb.driver_name || 'Driver'}`, html);
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
  const supabase = getServiceClient();

  try {
    // Pull due reminders (limit batch size)
    const { data: due, error: dueErr } = await supabase
      .from('scheduling_reminders')
      .select('id, callback_id, kind, fire_at')
      .eq('status', 'pending')
      .lte('fire_at', new Date().toISOString())
      .order('fire_at', { ascending: true })
      .limit(50);

    if (dueErr) {
      logger.error('Failed to load due reminders', dueErr);
      return new Response(JSON.stringify({ error: 'load_failed' }), { status: 500, headers });
    }

    const reminders: ReminderRow[] = (due as ReminderRow[]) || [];
    if (reminders.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { status: 200, headers });
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const r of reminders) {
      // Atomic claim — only proceed if we flip from pending to processing
      const { data: claimed } = await supabase
        .from('scheduling_reminders')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', r.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();

      if (!claimed) continue; // someone else processed it

      try {
        const { data: cb } = await supabase
          .from('scheduled_callbacks')
          .select(`
            id, driver_name, driver_phone, driver_email, scheduled_start,
            conference_url, status, application_id, recruiter_user_id,
            recruiter_calendar_connections!calendar_connection_id(email)
          `)
          .eq('id', r.callback_id)
          .maybeSingle();

        const callback = cb as unknown as CallbackRow | null;

        if (!callback || callback.status === 'cancelled') {
          await supabase
            .from('scheduling_reminders')
            .update({ status: 'skipped', error: callback ? 'callback cancelled' : 'callback missing' })
            .eq('id', r.id);
          skipped++;
          continue;
        }

        if (r.kind === 'driver_1h') await processDriverReminder(callback);
        else if (r.kind === 'recruiter_15m') await processRecruiterReminder(callback);

        sent++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.error(`Reminder ${r.id} failed`, { kind: r.kind, error: msg });
        await supabase
          .from('scheduling_reminders')
          .update({ status: 'failed', error: msg.slice(0, 500) })
          .eq('id', r.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ processed: reminders.length, sent, failed, skipped }),
      { status: 200, headers }
    );
  } catch (error: unknown) {
    logger.error('scheduling-reminders fatal', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'unknown' }),
      { status: 500, headers }
    );
  }
});
