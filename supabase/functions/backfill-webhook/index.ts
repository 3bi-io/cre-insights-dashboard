/**
 * One-time backfill: Send Cody Forbes application to Hub Group Zapier webhook
 * 
 * This function fetches the Cody Forbes application, builds the same payload
 * format used by submit-application, and POSTs it to the Hub Group Zapier endpoint.
 * Safe to run multiple times — each call is logged in client_webhook_logs.
 * 
 * Delete this function after successful execution.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors-config.ts';

const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/23823129/u28navp/';

function buildZapierPayload(app: Record<string, unknown>) {
  return {
    event_type: 'backfill',
    timestamp: new Date().toISOString(),
    id: app.id,
    job_listing_id: app.job_listing_id,
    job_id: app.job_id,
    first_name: app.first_name,
    last_name: app.last_name,
    full_name: app.full_name,
    email: app.applicant_email,
    phone: app.phone,
    city: app.city,
    state: app.state,
    zip: app.zip,
    country: app.country || 'US',
    age_verification: app.age,
    cdl_status: app.cdl,
    experience_text: app.exp,
    experience_months: app.months,
    drug_screen: app.drug,
    veteran_status: app.veteran,
    sms_consent: app.consent,
    privacy_accepted: app.privacy,
    ad_id: app.ad_id,
    campaign_id: app.campaign_id,
    adset_id: app.adset_id,
    referral_source: app.referral_source,
    how_did_you_hear: app.how_did_you_hear,
    source: app.source,
    status: app.status,
    applied_at: app.applied_at,
    created_at: app.created_at,
    screening_answers: app.custom_questions || null,
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Find Cody Forbes application for Hub Group
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .ilike('first_name', 'Cody')
      .ilike('last_name', 'Forbes')
      .order('applied_at', { ascending: false })
      .limit(1)
      .single();

    if (appError || !application) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Cody Forbes application not found',
        details: appError?.message 
      }), {
        status: 404,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    console.log('Found application:', application.id, application.first_name, application.last_name);

    // 2. Find the Hub Group webhook ID for logging
    const { data: webhook } = await supabase
      .from('client_webhooks')
      .select('id')
      .eq('webhook_url', ZAPIER_WEBHOOK_URL)
      .limit(1)
      .single();

    const webhookId = webhook?.id;
    console.log('Webhook ID:', webhookId);

    // 3. Build payload
    const payload = buildZapierPayload(application);

    // 4. Send to Zapier
    const startTime = Date.now();
    const response = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const durationMs = Date.now() - startTime;
    const responseText = await response.text();

    console.log('Zapier response:', response.status, responseText);

    // 5. Log in client_webhook_logs
    if (webhookId) {
      await supabase.from('client_webhook_logs').insert({
        webhook_id: webhookId,
        application_id: application.id,
        event_type: 'backfill',
        request_payload: payload,
        response_status: response.status,
        response_body: responseText.substring(0, 1000),
        duration_ms: durationMs,
      });

      // Update webhook last_triggered_at
      const updateData: Record<string, unknown> = {
        last_triggered_at: new Date().toISOString(),
      };
      if (response.ok) {
        updateData.last_success_at = new Date().toISOString();
        updateData.last_error = null;
      }
      await supabase.from('client_webhooks').update(updateData).eq('id', webhookId);
    }

    return new Response(JSON.stringify({
      success: response.ok,
      application_id: application.id,
      applicant: `${application.first_name} ${application.last_name}`,
      zapier_status: response.status,
      zapier_response: responseText.substring(0, 500),
      webhook_logged: !!webhookId,
      duration_ms: durationMs,
    }), {
      status: response.ok ? 200 : 502,
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Backfill error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: (err as Error).message 
    }), {
      status: 500,
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});
