/**
 * get-application-prefill Edge Function
 * Returns non-sensitive application data for pre-filling the detailed form.
 * Bypasses RLS by using service role — only exposes limited, safe fields.
 */

import { createClient } from 'npm:@supabase/supabase-js@2.50.0';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('get-application-prefill');

// Only these fields are returned — no SSN, DOB, gov ID, felony info, etc.
const SAFE_FIELDS = [
  'first_name', 'last_name', 'applicant_email', 'phone',
  'city', 'state', 'zip', 'address_1', 'address_2', 'country',
  'cdl', 'cdl_class', 'cdl_endorsements', 'exp',
  'consent_to_sms', 'over_21', 'veteran',
  'job_listing_id'
].join(', ');

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const { app_id } = await req.json();

    if (!app_id || typeof app_id !== 'string') {
      return new Response(JSON.stringify({ error: 'app_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(app_id)) {
      return new Response(JSON.stringify({ error: 'Invalid app_id format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('applications')
      .select(SAFE_FIELDS)
      .eq('id', app_id)
      .single();

    if (error || !data) {
      logger.warn('Application not found for prefill', { app_id: app_id.substring(0, 8) + '...' });
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    logger.info('Prefill data returned', { app_id: app_id.substring(0, 8) + '...' });

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    logger.error('Error in get-application-prefill', err as Error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
