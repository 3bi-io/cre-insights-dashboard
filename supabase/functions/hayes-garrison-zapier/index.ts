/**
 * Hayes R.E. Garrison — Zapier Inbound Webhook
 *
 * Dedicated endpoint for Zapier to POST driver application data.
 * Accepts flexible field naming, normalizes phone numbers,
 * performs 24-hour duplicate detection, and triggers ATS delivery.
 *
 * URL: POST /functions/v1/hayes-garrison-zapier
 */

import { createClient } from 'npm:@supabase/supabase-js@2.50.0';
import { createLogger } from '../_shared/logger.ts';
import { findOrCreateJobListing, normalizePhone, insertApplication } from '../_shared/application-processor.ts';
import { autoPostToATS } from '../_shared/ats-adapters/auto-post-engine.ts';

const logger = createLogger('hayes-garrison-zapier');

const HAYES_ORG_ID = '84214b48-7b51-45bc-ad7f-723bcf50466c';
const RE_GARRISON_CLIENT_ID = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Pick the first truthy value from a list of candidate keys */
function pick(body: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = body[k];
    if (v !== undefined && v !== null && v !== '') return String(v).trim();
  }
  return null;
}

/** Map flexible Zapier field names to canonical application fields */
function mapFields(body: Record<string, unknown>) {
  return {
    first_name: pick(body, 'first_name', 'firstName', 'candidate_first_name', 'fname'),
    last_name: pick(body, 'last_name', 'lastName', 'candidate_last_name', 'lname'),
    phone: pick(body, 'phone', 'phone_number', 'phoneNumber', 'candidate_phone', 'mobile'),
    email: pick(body, 'email', 'applicant_email', 'candidate_email', 'emailAddress'),
    city: pick(body, 'city', 'candidate_city'),
    state: pick(body, 'state', 'candidate_state', 'province'),
    zip: pick(body, 'zip', 'zipcode', 'zip_code', 'postal_code', 'postalCode'),
    cdl: pick(body, 'cdl', 'has_cdl', 'cdl_license'),
    cdl_class: pick(body, 'cdl_class', 'cdlClass', 'license_class'),
    exp: pick(body, 'exp', 'experience', 'years_experience', 'driving_experience'),
    job_title: pick(body, 'job_title', 'jobTitle', 'position', 'job'),
    notes: pick(body, 'notes', 'comments', 'additional_info', 'message'),
    // ── Attribution / source fields ──
    lead_source: pick(body, 'lead_source', 'source', 'lead_origin', 'traffic_source'),
    platform: pick(body, 'platform', 'lead_platform', 'source_platform'),
    utm_source: pick(body, 'utm_source', 'utmSource'),
    utm_medium: pick(body, 'utm_medium', 'utmMedium'),
    utm_campaign: pick(body, 'utm_campaign', 'utmCampaign'),
    how_did_you_hear: pick(body, 'how_did_you_hear', 'hear_about_us', 'how_heard'),
  };
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;

    logger.info('Zapier payload received', { keys: Object.keys(body) });

    const fields = mapFields(body);

    // Require at least a name + contact info
    if (!fields.first_name && !fields.last_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing applicant name (first_name or last_name required)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!fields.phone && !fields.email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing contact info (phone or email required)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Normalize phone
    const normalizedPhone = normalizePhone(fields.phone);

    // Supabase service client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── 24-hour duplicate detection ──────────────────────────────
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    if (normalizedPhone || fields.email) {
      let dupeQuery = supabase
        .from('applications')
        .select('id')
        .eq('source', 'zapier')
        .gte('applied_at', twentyFourHoursAgo);

      if (normalizedPhone) {
        dupeQuery = dupeQuery.eq('phone', normalizedPhone);
      } else if (fields.email) {
        dupeQuery = dupeQuery.eq('applicant_email', fields.email);
      }

      const { data: existing } = await dupeQuery.limit(1).maybeSingle();

      if (existing) {
        logger.info('Duplicate application detected', { existingId: existing.id });
        return new Response(
          JSON.stringify({ success: true, duplicate: true, applicationId: existing.id }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // ── Resolve job listing ──────────────────────────────────────
    const jobResult = await findOrCreateJobListing(supabase, {
      organizationId: HAYES_ORG_ID,
      clientId: RE_GARRISON_CLIENT_ID,
      source: 'hayes-re-garrison-zapier',
    });

    if (!jobResult) {
      logger.error('Could not resolve job listing');
      return new Response(
        JSON.stringify({ success: false, error: 'Could not resolve job listing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Insert application ───────────────────────────────────────
    const applicationData: Record<string, unknown> = {
      job_listing_id: jobResult.id,
      first_name: fields.first_name,
      last_name: fields.last_name,
      phone: normalizedPhone || fields.phone,
      applicant_email: fields.email,
      city: fields.city,
      state: fields.state,
      zip: fields.zip,
      cdl: fields.cdl,
      cdl_class: fields.cdl_class,
      exp: fields.exp,
      notes: fields.notes,
      source: 'zapier',
      status: 'pending',
      utm_source: 'zapier',
      utm_medium: 'webhook',
      utm_campaign: 're-garrison',
      applied_at: new Date().toISOString(),
    };

    const { data: application, error: insertError } = await insertApplication(supabase, applicationData);

    if (insertError) {
      logger.error('Failed to insert application', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    logger.info('Application created via Zapier', {
      applicationId: application.id,
      client: 'R.E. Garrison',
    });

    // ── Auto-post to ATS (non-blocking) ──────────────────────────
    EdgeRuntime.waitUntil(
      autoPostToATS(supabase, application.id, HAYES_ORG_ID, applicationData, {
        clientId: RE_GARRISON_CLIENT_ID,
      }),
    );

    return new Response(
      JSON.stringify({ success: true, applicationId: application.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Unhandled error', err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
