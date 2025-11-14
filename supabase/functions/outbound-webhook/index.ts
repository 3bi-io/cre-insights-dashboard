/**
 * Outbound Webhook Handler
 * 
 * Generic webhook sender for application events.
 * Used by database triggers and other internal systems.
 * 
 * SECURITY:
 * - Validates application exists
 * - Includes comprehensive application data
 * - Logs all attempts
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders, createSuccessResponse, createErrorResponse } from '../_shared/responses.ts';
import { wrapHandler } from '../_shared/handler-wrapper.ts';

interface OutboundWebhookPayload {
  application_id: string;
  webhook_url: string;
  event_type: 'created' | 'updated' | 'deleted';
}

/**
 * Send webhook with timeout and error handling
 */
async function sendWebhook(
  url: string,
  payload: Record<string, any>
): Promise<{ success: boolean; status: number; body: string; error?: string }> {
  try {
    console.log('[OUTBOUND-WEBHOOK] Sending to:', url.substring(0, 50) + '...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Webhook/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseBody = await response.text();

    return {
      success: response.ok,
      status: response.status,
      body: responseBody,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    console.error('[OUTBOUND-WEBHOOK] Send failed:', error);
    return {
      success: false,
      status: 500,
      body: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  const supabase = getServiceClient();
  const startTime = Date.now();

  const payload: OutboundWebhookPayload = await req.json();
  const { application_id, webhook_url, event_type } = payload;

  if (!application_id || !webhook_url || !event_type) {
    return createErrorResponse(
      'Missing required fields: application_id, webhook_url, event_type',
      400
    );
  }

  console.log('[OUTBOUND-WEBHOOK] Processing', {
    application_id,
    event_type,
    url: webhook_url.substring(0, 50) + '...',
  });

  // Get complete application data
  const { data: application, error: fetchError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', application_id)
    .single();

  if (fetchError || !application) {
    console.error('[OUTBOUND-WEBHOOK] Application not found:', fetchError);
    return createErrorResponse('Application not found', 404);
  }

  // Prepare comprehensive webhook payload
  const webhookPayload = {
    event_type,
    timestamp: new Date().toISOString(),
    
    // Core fields
    id: application.id,
    job_listing_id: application.job_listing_id,
    job_id: application.job_id,
    
    // Personal information
    first_name: application.first_name,
    last_name: application.last_name,
    applicant_email: application.applicant_email,
    phone: application.phone,
    secondary_phone: application.secondary_phone,
    
    // Address information
    address_1: application.address_1,
    address_2: application.address_2,
    city: application.city,
    state: application.state,
    zip: application.zip,
    country: application.country,
    
    // Personal details
    date_of_birth: application.date_of_birth,
    prefix: application.prefix,
    middle_name: application.middle_name,
    suffix: application.suffix,
    
    // Contact preferences
    preferred_contact_method: application.preferred_contact_method,
    emergency_contact_name: application.emergency_contact_name,
    emergency_contact_phone: application.emergency_contact_phone,
    emergency_contact_relationship: application.emergency_contact_relationship,
    
    // CDL Information
    cdl: application.cdl,
    cdl_class: application.cdl_class,
    cdl_state: application.cdl_state,
    cdl_expiration_date: application.cdl_expiration_date,
    cdl_endorsements: application.cdl_endorsements,
    hazmat_endorsement: application.hazmat_endorsement,
    
    // Work Information
    exp: application.exp,
    months: application.months,
    driving_experience_years: application.driving_experience_years,
    employment_history: application.employment_history,
    
    // Compliance & Safety
    can_pass_drug_test: application.can_pass_drug_test,
    drug: application.drug,
    can_pass_physical: application.can_pass_physical,
    dot_physical_date: application.dot_physical_date,
    medical_card_expiration: application.medical_card_expiration,
    accident_history: application.accident_history,
    violation_history: application.violation_history,
    convicted_felony: application.convicted_felony,
    felony_details: application.felony_details,
    
    // Work Preferences
    can_work_nights: application.can_work_nights,
    can_work_weekends: application.can_work_weekends,
    willing_to_relocate: application.willing_to_relocate,
    preferred_start_date: application.preferred_start_date,
    
    // Additional Information
    education_level: application.education_level,
    military_service: application.military_service,
    military_branch: application.military_branch,
    veteran: application.veteran,
    over_21: application.over_21,
    work_authorization: application.work_authorization,
    
    // Credentials
    twic_card: application.twic_card,
    passport_card: application.passport_card,
    
    // Application metadata
    status: application.status,
    applied_at: application.applied_at,
    source: application.source,
    referral_source: application.referral_source,
    recruiter_id: application.recruiter_id,
    notes: application.notes,
    
    // Consent
    consent: application.consent,
    consent_to_email: application.consent_to_email,
    consent_to_sms: application.consent_to_sms,
    background_check_consent: application.background_check_consent,
    agree_privacy_policy: application.agree_privacy_policy,
    
    // Custom fields
    custom_questions: application.custom_questions,
    display_fields: application.display_fields,
  };

  // Send webhook
  const result = await sendWebhook(webhook_url, webhookPayload);
  const duration_ms = Date.now() - startTime;

  console.log('[OUTBOUND-WEBHOOK] Result', {
    success: result.success,
    status: result.status,
    duration_ms,
  });

  if (result.success) {
    return createSuccessResponse({
      success: true,
      message: 'Webhook delivered successfully',
      status: result.status,
      duration_ms,
    });
  } else {
    return createErrorResponse(
      `Webhook delivery failed: ${result.error}`,
      result.status >= 400 && result.status < 500 ? result.status : 500
    );
  }
};

serve(wrapHandler(handler));