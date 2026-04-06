/**
 * Morning Digest Edge Function
 * 
 * Sends daily email digest to recruiters with their AI-scheduled callbacks.
 * Designed to run as a cron job at 7:30 AM CST (13:30 UTC).
 * 
 * Can also be triggered manually with action: 'send_digest' or 'preview'
 */

import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders, handleCorsPreflightIfNeeded } from '../_shared/cors-config.ts';
import { getSender } from '../_shared/email-config.ts';
import { createLogger } from '../_shared/logger.ts';
import { DEFAULT_TIMEZONE } from '../_shared/constants.ts';

const logger = createLogger('morning-digest');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

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

/** Escape HTML to prevent XSS in email content */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    let action = 'send_digest';
    let targetUserId: string | null = null;

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      action = body.action || 'send_digest';
      targetUserId = body.userId || null;
    }

    if (targetUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
      throw new Error('Invalid userId format');
    }

    const supabase = getServiceClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let query = supabase
      .from('scheduled_callbacks')
      .select(`
        *,
        recruiter_calendar_connections!calendar_connection_id(email)
      `)
      .gte('scheduled_start', today.toISOString())
      .lt('scheduled_start', tomorrow.toISOString())
      .in('status', ['pending', 'confirmed'])
      .eq('digest_email_sent', false)
      .order('scheduled_start', { ascending: true });

    if (targetUserId) {
      query = query.eq('recruiter_user_id', targetUserId);
    }

    const { data: callbacks, error: cbError } = await query;

    if (cbError) {
      logger.error('Failed to fetch callbacks', cbError);
      throw new Error('Failed to fetch scheduled callbacks');
    }

    if (!callbacks || callbacks.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No callbacks to digest today', sent: 0 }),
        { headers }
      );
    }

    const byRecruiter = new Map<string, typeof callbacks>();
    for (const cb of callbacks) {
      const key = cb.recruiter_user_id;
      if (!key) continue;
      if (!byRecruiter.has(key)) byRecruiter.set(key, []);
      byRecruiter.get(key)!.push(cb);
    }

    if (byRecruiter.size === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No valid recruiter callbacks found', sent: 0 }),
        { headers }
      );
    }

    const recruiterIds = Array.from(byRecruiter.keys());
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', recruiterIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    let sentCount = 0;
    const errors: string[] = [];

    for (const [recruiterId, recruiterCallbacks] of byRecruiter) {
      const profile = profileMap.get(recruiterId);
      if (!profile?.email) {
        errors.push(`No email for recruiter ${recruiterId}`);
        continue;
      }

      const recruiterName = escapeHtml(profile.full_name?.split(' ')[0] || 'Recruiter');
      const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

      const callRows = recruiterCallbacks.map(cb => {
        const time = new Date(cb.scheduled_start).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: DEFAULT_TIMEZONE,
        });
        const driverName = escapeHtml(cb.driver_name || 'Driver');
        const phone = escapeHtml(cb.driver_phone || 'N/A');
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${escapeHtml(time)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${driverName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${phone}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              <span style="background: ${cb.status === 'confirmed' ? '#dcfce7' : '#fef3c7'}; color: ${cb.status === 'confirmed' ? '#166534' : '#92400e'}; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                ${escapeHtml(cb.status)}
              </span>
            </td>
          </tr>
        `;
      }).join('');

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">📋 Your AI-Scheduled Callbacks</h1>
            <p style="color: #bfdbfe; margin: 8px 0 0;">${escapeHtml(dateStr)}</p>
          </div>
          <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; margin: 0 0 16px;">Good morning ${recruiterName},</p>
            <p style="color: #6b7280; margin: 0 0 20px;">
              You have <strong>${recruiterCallbacks.length} driver callback${recruiterCallbacks.length > 1 ? 's' : ''}</strong> scheduled by the AI agent for today:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Time</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Driver</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Phone</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${callRows}
              </tbody>
            </table>
            <p style="color: #6b7280; font-size: 13px; margin: 0;">
              These callbacks were verified and scheduled by the AI voice agent. Please ensure these times are respected.
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 16px;">
            Sent by ApplyAI.jobs · AI-Powered Recruiting Platform
          </p>
        </div>
      `;

      if (action === 'preview') {
        return new Response(
          JSON.stringify({ success: true, preview: emailHtml, callbacks: recruiterCallbacks }),
          { headers }
        );
      }

      if (!RESEND_API_KEY) {
        errors.push('RESEND_API_KEY not configured');
        continue;
      }

      try {
        const emailResponse = await fetchWithTimeout('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: getSender('notifications'),
            to: [profile.email],
            subject: `📋 ${recruiterCallbacks.length} AI-Scheduled Callback${recruiterCallbacks.length > 1 ? 's' : ''} for ${dateStr}`,
            html: emailHtml,
          }),
        }, 10000);

        if (emailResponse.ok) {
          await emailResponse.text();
          sentCount++;
          const cbIds = recruiterCallbacks.map(cb => cb.id);
          await supabase
            .from('scheduled_callbacks')
            .update({ digest_email_sent: true })
            .in('id', cbIds);
        } else {
          const errText = await emailResponse.text();
          errors.push(`Email to ${profile.email} failed: ${errText}`);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Email to ${profile.email} error: ${msg}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        totalCallbacks: callbacks.length,
        recruiters: byRecruiter.size,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Morning digest error', error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers }
    );
  }
});
