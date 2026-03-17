import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors-config.ts";
import { createLogger } from "../_shared/logger.ts";
import { getServiceClient } from "../_shared/supabase-client.ts";

const logger = createLogger('outbound-webhook');

interface OutboundWebhookPayload {
  application_id: string;
  webhook_url: string;
  event_type: 'created' | 'updated' | 'deleted';
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  logger.info('Outbound webhook triggered', { method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: OutboundWebhookPayload = await req.json();
    const { application_id, webhook_url, event_type } = payload;

    if (!application_id || !webhook_url || !event_type) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['application_id', 'webhook_url', 'event_type']
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    logger.info('Processing outbound webhook', { application_id });

    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', application_id)
      .single();

    if (fetchError || !application) {
      logger.error('Error fetching application', fetchError, { application_id });
      return new Response(
        JSON.stringify({ 
          error: 'Application not found',
          application_id 
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    const webhookPayload = {
      event_type,
      timestamp: new Date().toISOString(),
      id: application.id,
      job_listing_id: application.job_listing_id,
      job_id: application.job_id,
      first_name: application.first_name,
      last_name: application.last_name,
      applicant_email: application.applicant_email,
      phone: application.phone,
      secondary_phone: application.secondary_phone,
      address_1: application.address_1,
      address_2: application.address_2,
      city: application.city,
      state: application.state,
      zip: application.zip,
      country: application.country,
      date_of_birth: application.date_of_birth,
      prefix: application.prefix,
      middle_name: application.middle_name,
      suffix: application.suffix,
      ssn: application.ssn,
      government_id: application.government_id,
      government_id_type: application.government_id_type,
      preferred_contact_method: application.preferred_contact_method,
      emergency_contact_name: application.emergency_contact_name,
      emergency_contact_phone: application.emergency_contact_phone,
      emergency_contact_relationship: application.emergency_contact_relationship,
      cdl: application.cdl,
      cdl_class: application.cdl_class,
      cdl_endorsements: application.cdl_endorsements,
      cdl_expiration_date: application.cdl_expiration_date,
      cdl_state: application.cdl_state,
      driving_experience_years: application.driving_experience_years,
      accident_history: application.accident_history,
      violation_history: application.violation_history,
      employment_history: application.employment_history,
      education_level: application.education_level,
      military_service: application.military_service,
      military_branch: application.military_branch,
      military_start_date: application.military_start_date,
      military_end_date: application.military_end_date,
      veteran: application.veteran,
      convicted_felony: application.convicted_felony,
      felony_details: application.felony_details,
      work_authorization: application.work_authorization,
      can_work_weekends: application.can_work_weekends,
      can_work_nights: application.can_work_nights,
      willing_to_relocate: application.willing_to_relocate,
      preferred_start_date: application.preferred_start_date,
      salary_expectations: application.salary_expectations,
      over_21: application.over_21,
      can_pass_drug_test: application.can_pass_drug_test,
      can_pass_physical: application.can_pass_physical,
      medical_card_expiration: application.medical_card_expiration,
      dot_physical_date: application.dot_physical_date,
      hazmat_endorsement: application.hazmat_endorsement,
      passport_card: application.passport_card,
      twic_card: application.twic_card,
      source: application.source,
      status: application.status,
      notes: application.notes,
      applied_at: application.applied_at,
      created_at: application.created_at,
      updated_at: application.updated_at,
      recruiter_id: application.recruiter_id,
      driver_id: application.driver_id,
      how_did_you_hear: application.how_did_you_hear,
      referral_source: application.referral_source,
      agree_privacy_policy: application.agree_privacy_policy,
      consent_to_sms: application.consent_to_sms,
      consent_to_email: application.consent_to_email,
      background_check_consent: application.background_check_consent,
      age: application.age,
      privacy: application.privacy,
      consent: application.consent,
      drug: application.drug,
      exp: application.exp,
      months: application.months,
      custom_questions: application.custom_questions,
      display_fields: application.display_fields
    };

    logger.info('Sending webhook payload', { webhook_url });

    const webhookResponse = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Webhook/1.0'
      },
      body: JSON.stringify(webhookPayload)
    });

    // Consume response body to prevent resource leak
    const responseText = await webhookResponse.text();

    if (!webhookResponse.ok) {
      logger.error('Webhook delivery failed', null, { status: webhookResponse.status, statusText: webhookResponse.statusText });
      return new Response(
        JSON.stringify({ 
          error: 'Webhook delivery failed',
          status: webhookResponse.status,
          statusText: webhookResponse.statusText
        }),
        { 
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    logger.info('Webhook delivered successfully', { application_id, event_type });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook delivered successfully',
        application_id,
        event_type,
        delivered_at: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Outbound webhook error', error instanceof Error ? error : null);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);
