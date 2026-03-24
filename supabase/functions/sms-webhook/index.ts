/**
 * SMS Webhook - Twilio Incoming SMS Handler
 * Processes applicant replies to verification SMS messages (YES/EDIT/STOP)
 * Includes Twilio signature validation and SMS audit logging.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors-config.ts";
import { createLogger } from "../_shared/logger.ts";
import { getServiceClient } from "../_shared/supabase-client.ts";
import { sendSms } from "../_shared/twilio-client.ts";
import { validateTwilioSignature, getWebhookUrl } from "../_shared/twilio-signature.ts";

const logger = createLogger('sms-webhook');

const APP_BASE_URL = 'https://applyai.jobs';

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

/** Log an SMS event to the sms_logs audit table */
async function logSms(supabase: ReturnType<typeof getServiceClient>, entry: {
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  body?: string;
  twilio_sid?: string;
  status?: string;
  error_message?: string;
  error_code?: number;
  application_id?: string;
  session_id?: string;
  metadata?: Record<string, unknown>;
  duration_ms?: number;
}) {
  try {
    await supabase.from('sms_logs').insert(entry);
  } catch (err) {
    logger.warn('Failed to write sms_logs', { error: (err as Error).message });
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getServiceClient();

  try {
    // Parse Twilio webhook (form-urlencoded)
    const contentType = req.headers.get('content-type') || '';
    let fromNumber = '';
    let body = '';
    let allParams: Record<string, string> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.text();
      const params = new URLSearchParams(formData);
      fromNumber = params.get('From') || '';
      body = (params.get('Body') || '').trim();
      // Collect all params for signature validation
      for (const [k, v] of params.entries()) {
        allParams[k] = v;
      }
    } else {
      // Fallback for JSON (testing)
      const json = await req.json();
      fromNumber = json.From || json.from || '';
      body = (json.Body || json.body || '').trim();
    }

    // Validate Twilio signature (skip for JSON test requests)
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const twilioSignature = req.headers.get('x-twilio-signature') || '';
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      
      if (!authToken) {
        logger.error('TWILIO_AUTH_TOKEN not configured — cannot validate signature');
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
        });
      }

      const webhookUrl = getWebhookUrl(req);
      const isValid = await validateTwilioSignature(authToken, twilioSignature, webhookUrl, allParams);

      if (!isValid) {
        logger.warn('Invalid Twilio signature — rejecting request', {
          from: fromNumber ? normalizePhone(fromNumber).slice(0, -4) + '****' : 'unknown',
        });
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
        });
      }
    }

    if (!fromNumber || !body) {
      logger.warn('Missing From or Body in webhook');
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    const normalizedPhone = normalizePhone(fromNumber);
    const twilioSid = allParams['MessageSid'] || allParams['SmsSid'] || undefined;
    logger.info('Incoming SMS', { from: normalizedPhone.slice(0, -4) + '****', body_length: body.length, twilio_sid: twilioSid });

    // Log inbound SMS
    await logSms(supabase, {
      direction: 'inbound',
      from_number: fromNumber,
      to_number: allParams['To'] || Deno.env.get('TWILIO_PHONE_NUMBER') || '',
      body: body.slice(0, 1600),
      twilio_sid: twilioSid,
      status: 'received',
      metadata: { raw_params_keys: Object.keys(allParams) },
    });

    // Look up active verification session by phone number
    const { data: session, error: sessionError } = await supabase
      .from('sms_verification_sessions')
      .select('*, application_id, outbound_call_id, job_listing_id, client_name, applicant_first_name, job_title')
      .eq('phone_number', normalizedPhone)
      .eq('status', 'pending_confirmation')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      logger.error('Error looking up session', { error: sessionError });
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    // Handle STOP globally (even without an active session)
    const normalizedBody = body.toUpperCase().trim();
    if (normalizedBody === 'STOP' || normalizedBody === 'UNSUBSCRIBE') {
      logger.info('Opt-out received', { phone: normalizedPhone.slice(0, -4) + '****' });

      await supabase
        .from('applications')
        .update({ consent_to_sms: 'no', updated_at: new Date().toISOString() })
        .eq('phone', fromNumber);

      if (normalizedPhone.length === 10) {
        await supabase
          .from('applications')
          .update({ consent_to_sms: 'no', updated_at: new Date().toISOString() })
          .or(`phone.eq.+1${normalizedPhone},phone.eq.${normalizedPhone}`);
      }

      if (session) {
        await supabase
          .from('sms_verification_sessions')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', session.id);
      }

      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    if (!session) {
      logger.info('No active verification session found for phone');
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    // Helper to send SMS reply via shared Twilio client and log it
    const sendReply = async (message: string) => {
      const startTime = Date.now();
      const result = await sendSms(fromNumber, message);
      const duration = Date.now() - startTime;

      await logSms(supabase, {
        direction: 'outbound',
        from_number: Deno.env.get('TWILIO_PHONE_NUMBER') || '',
        to_number: fromNumber,
        body: message.slice(0, 1600),
        twilio_sid: result.sid,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error,
        error_code: result.errorCode,
        application_id: session.application_id,
        session_id: session.id,
        duration_ms: duration,
      });

      if (!result.success) {
        logger.error('Failed to send reply SMS', { error: result.error, error_code: result.errorCode });
      }
    };

    // Handle YES / CONFIRM
    if (normalizedBody === 'YES' || normalizedBody === 'Y' || normalizedBody === 'CONFIRM') {
      logger.info('Confirmation received', { session_id: session.id });

      await supabase
        .from('sms_verification_sessions')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', session.id);

      const firstName = session.applicant_first_name || 'there';
      const jobTitle = session.job_title || 'driver';
      const clientName = session.client_name || 'our company';

      const { data: app } = await supabase
        .from('applications')
        .select('employment_history, ssn, date_of_birth, emergency_contact_name, convicted_felony, military_service, medical_card_expiration, enrichment_status')
        .eq('id', session.application_id)
        .single();

      const isEnriched = app && (
        (app.employment_history && (Array.isArray(app.employment_history) ? app.employment_history.length > 0 : true)) ||
        app.ssn ||
        app.date_of_birth ||
        app.emergency_contact_name ||
        app.convicted_felony ||
        app.military_service ||
        app.medical_card_expiration ||
        app.enrichment_status === 'enriched'
      );

      if (isEnriched) {
        await sendReply(
          `Thanks for confirming, ${firstName}! Your full ${jobTitle} application with ${clientName} is on file. A recruiter will be in touch soon.`
        );
      } else {
        const detailedUrl = `${APP_BASE_URL}/apply/detailed?job_id=${session.job_listing_id}&app_id=${session.application_id}`;
        await sendReply(
          `Thanks for confirming, ${firstName}! Complete your ${jobTitle} application with ${clientName} here:\n\n${detailedUrl}\n\nYour info will be pre-filled.\nReply STOP to opt out.`
        );
      }

      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    // Handle EDIT / UPDATE / CHANGE
    if (normalizedBody === 'EDIT' || normalizedBody === 'UPDATE' || normalizedBody === 'CHANGE') {
      logger.info('Edit requested', { session_id: session.id });

      const firstName = session.applicant_first_name || 'there';
      const jobTitle = session.job_title || 'driver';
      const clientName = session.client_name || 'our company';

      await supabase
        .from('sms_verification_sessions')
        .update({ status: 'edit_requested', updated_at: new Date().toISOString() })
        .eq('id', session.id);

      await sendReply(
        `No problem, ${firstName}! Reply with your corrections (e.g. "City: Dallas" or "CDL: Class A"). We'll update your ${jobTitle} application with ${clientName}.`
      );

      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    // Handle free-text corrections (any other reply to an active session)
    logger.info('Free-text reply received', { session_id: session.id, body_preview: body.slice(0, 50) });

    const { data: appForActivity } = await supabase
      .from('applications')
      .select('job_listing_id')
      .eq('id', session.application_id)
      .single();

    if (appForActivity?.job_listing_id) {
      const { data: jobListing } = await supabase
        .from('job_listings')
        .select('organization_id')
        .eq('id', appForActivity.job_listing_id)
        .single();

      if (jobListing?.organization_id) {
        await supabase.from('candidate_activities').insert({
          application_id: session.application_id,
          organization_id: jobListing.organization_id,
          activity_type: 'sms_correction',
          title: 'SMS Correction Received',
          description: `Applicant replied with corrections via SMS: "${body.slice(0, 500)}"`,
          metadata: { source: 'sms_verification', phone: normalizedPhone.slice(0, -4) + '****' },
        });
      }
    }

    await supabase
      .from('sms_verification_sessions')
      .update({ status: 'edit_requested', updated_at: new Date().toISOString() })
      .eq('id', session.id);

    const corrFirstName = session.applicant_first_name || 'there';
    const corrClientName = session.client_name || 'our company';

    await sendReply(
      `Got it, ${corrFirstName}! We've forwarded your update to the ${corrClientName} recruiting team. They'll review it shortly.`
    );

    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    logger.error('Error in sms-webhook', { error: (error as Error).message, stack: (error as Error).stack });
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
});
