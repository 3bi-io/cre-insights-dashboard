// @ts-nocheck

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { 
  normalizePhone, 
  findOrCreateJobListing, 
  insertApplication 
} from "../_shared/application-processor.ts";

// Zod validation schema for application submissions
const ApplicationSubmissionSchema = z.object({
  // Required fields
  firstName: z.string().trim().min(1, 'First name is required').max(100, 'First name too long').optional(),
  first_name: z.string().trim().min(1, 'First name is required').max(100, 'First name too long').optional(),
  lastName: z.string().trim().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
  last_name: z.string().trim().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
  email: z.string().email('Invalid email format').max(255, 'Email too long').optional(),
  applicant_email: z.string().email('Invalid email format').max(255, 'Email too long').optional(),
  
  // Phone validation - accepts various formats
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone format').optional(),
  
  // Location fields
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format').max(10).optional(),
  city: z.string().max(100, 'City name too long').optional(),
  state: z.string().max(2, 'State must be 2-letter code').optional(),
  
  // Job-related fields
  job_listing_id: z.string().uuid('Invalid job listing ID').optional(),
  job_id: z.string().max(50, 'Job ID too long').optional(),
  org_slug: z.string().max(100, 'Organization slug too long').optional(),
  
  // Application fields with reasonable limits
  cdl: z.string().max(50).optional(),
  experience: z.string().max(50).optional(),
  months: z.string().max(10).optional(),
  exp: z.string().max(100).optional(),
  over21: z.string().max(10).optional(),
  drug: z.string().max(50).optional(),
  veteran: z.string().max(50).optional(),
  consent: z.string().max(50).optional(),
  privacy: z.string().max(50).optional(),
  
  // URL tracking parameters
  ad_id: z.string().max(100).optional(),
  campaign_id: z.string().max(100).optional(),
  adset_id: z.string().max(100).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  referral_source: z.string().max(500).optional(),
  
  // Employment history - limit to prevent DoS
  employmentHistory: z.any().optional(),
}).refine(
  (data) => (data.firstName || data.first_name) && (data.lastName || data.last_name) && (data.email || data.applicant_email),
  { message: 'First name, last name, and email are required' }
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Build comprehensive payload for Zapier/webhooks
function buildZapierPayload(app: any) {
  return {
    // Event metadata
    event_type: 'created',
    timestamp: new Date().toISOString(),
    
    // Application ID
    id: app.id,
    job_listing_id: app.job_listing_id,
    job_id: app.job_id,
    
    // Personal information
    first_name: app.first_name,
    last_name: app.last_name,
    full_name: app.full_name,
    email: app.applicant_email,
    phone: app.phone,
    
    // Location
    city: app.city,
    state: app.state,
    zip: app.zip,
    country: app.country || 'US',
    
    // Screening fields
    age_verification: app.age,
    cdl_status: app.cdl,
    experience_text: app.exp,
    experience_months: app.months,
    drug_screen: app.drug,
    veteran_status: app.veteran,
    
    // Consent
    sms_consent: app.consent,
    privacy_accepted: app.privacy,
    
    // Marketing attribution
    ad_id: app.ad_id,
    campaign_id: app.campaign_id,
    adset_id: app.adset_id,
    referral_source: app.referral_source,
    how_did_you_hear: app.how_did_you_hear,
    
    // Metadata
    source: app.source,
    status: app.status,
    applied_at: app.applied_at,
    created_at: app.created_at,
  };
}

// Trigger webhooks for applications matching the source filter
async function triggerSourceWebhooks(
  supabase: any, 
  applicationId: string, 
  source: string
): Promise<void> {
  // Find all enabled webhooks that match this source
  const { data: webhooks, error: webhookError } = await supabase
    .from('client_webhooks')
    .select('id, webhook_url, event_types, source_filter')
    .eq('enabled', true);

  if (webhookError) {
    console.error('Error fetching webhooks:', webhookError);
    return;
  }

  // Filter webhooks that have this source in their source_filter
  const matchingWebhooks = (webhooks || []).filter((webhook: any) => {
    if (!webhook.source_filter || webhook.source_filter.length === 0) return false;
    return webhook.source_filter.includes(source);
  });

  if (matchingWebhooks.length === 0) {
    console.log('No webhooks configured for source:', source);
    return;
  }

  // Get complete application data
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    console.error('Error fetching application for webhook:', appError);
    return;
  }

  // Send to each matching webhook
  for (const webhook of matchingWebhooks) {
    // Check if 'created' event type is enabled (or if no event_types specified, default to all)
    if (webhook.event_types && webhook.event_types.length > 0 && !webhook.event_types.includes('created')) {
      console.log(`Webhook ${webhook.id} skipped: 'created' not in event_types`);
      continue;
    }

    const payload = buildZapierPayload(application);
    const startTime = Date.now();
    
    try {
      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const durationMs = Date.now() - startTime;
      const responseText = await response.text().catch(() => '');
      
      console.log(`Webhook ${webhook.id} sent: status=${response.status}, duration=${durationMs}ms`);
      
      // Log the webhook call
      await supabase.from('client_webhook_logs').insert({
        webhook_id: webhook.id,
        application_id: applicationId,
        event_type: 'created',
        request_payload: payload,
        response_status: response.status,
        response_body: responseText.substring(0, 1000),
        duration_ms: durationMs,
      });
      
      // Update last triggered timestamp
      const updateData: any = {
        last_triggered_at: new Date().toISOString(),
      };
      if (response.ok) {
        updateData.last_success_at = new Date().toISOString();
        updateData.last_error = null;
      } else {
        updateData.last_error = `HTTP ${response.status}: ${responseText.substring(0, 200)}`;
      }
      
      await supabase.from('client_webhooks')
        .update(updateData)
        .eq('id', webhook.id);
      
    } catch (err) {
      const durationMs = Date.now() - startTime;
      console.error(`Webhook ${webhook.id} failed:`, err);
      
      // Log the failed attempt
      await supabase.from('client_webhook_logs').insert({
        webhook_id: webhook.id,
        application_id: applicationId,
        event_type: 'created',
        request_payload: payload,
        error_message: err.message || 'Unknown error',
        duration_ms: durationMs,
      });
      
      // Update error status
      await supabase.from('client_webhooks')
        .update({
          last_triggered_at: new Date().toISOString(),
          last_error: err.message || 'Unknown error',
        })
        .eq('id', webhook.id);
    }
  }
}

/**
 * Resolve organization ID from various sources
 * Priority: job_listing_id -> org_slug -> fallback to CR England
 */
async function resolveOrganizationId(
  supabase: any,
  jobListingId?: string,
  orgSlug?: string
): Promise<{ organizationId: string; organizationName: string }> {
  // Priority 1: Get org from job_listing_id
  if (jobListingId) {
    const { data: jobListing, error } = await supabase
      .from('job_listings')
      .select('organization_id, organizations(id, name, slug)')
      .eq('id', jobListingId)
      .single();
    
    if (jobListing?.organization_id) {
      console.log('Resolved org from job_listing_id:', jobListing.organizations?.name);
      return {
        organizationId: jobListing.organization_id,
        organizationName: jobListing.organizations?.name || 'Unknown'
      };
    }
  }
  
  // Priority 2: Get org from org_slug
  if (orgSlug) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', orgSlug)
      .single();
    
    if (org) {
      console.log('Resolved org from slug:', org.name);
      return { organizationId: org.id, organizationName: org.name };
    }
  }
  
  // Fallback: CR England
  const { data: crEnglandOrg } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', 'cr-england')
    .single();

  console.log('Falling back to CR England org');
  return {
    organizationId: crEnglandOrg?.id || '',
    organizationName: crEnglandOrg?.name || 'C.R. England'
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const rawData = await req.json();
    
    // Validate input data with Zod schema
    const validationResult = ApplicationSubmissionSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`));
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data', 
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const formData = validationResult.data;

    // CRITICAL: Resolve organization dynamically instead of hardcoding CR England
    const { organizationId, organizationName } = await resolveOrganizationId(
      supabase,
      formData.job_listing_id,
      formData.org_slug
    );

    // Determine experience level based on months
    const getExperienceLevel = (months: string) => {
      if (!months) return '';
      
      const monthsNum = parseInt(months);
      if (monthsNum < 3) {
        return 'Less than 3 months experience';
      } else {
        return 'More than 3 months experience';
      }
    };

    // Lookup city/state from zip code for consistency
    const lookupCityState = async (zipCode: string) => {
      if (!zipCode || zipCode.length < 5) {
        return { city: formData.city || '', state: formData.state || '' };
      }

      const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
      
      if (cleanZip.length !== 5) {
        return { city: formData.city || '', state: formData.state || '' };
      }

      try {
        const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
        
        if (!response.ok) {
          console.warn(`Zip code lookup failed for ${cleanZip}: ${response.status}`);
          return { city: formData.city || '', state: formData.state || '' };
        }

        const data = await response.json();
        
        if (data.places && data.places.length > 0) {
          const place = data.places[0];
          return {
            city: place['place name'],
            state: place['state abbreviation']
          };
        }
        
        return { city: formData.city || '', state: formData.state || '' };
      } catch (error) {
        console.error(`Error looking up zip code ${cleanZip}:`, error);
        return { city: formData.city || '', state: formData.state || '' };
      }
    };

    const { city, state } = await lookupCityState(formData.zip);

    // Get or create a job listing for the application using shared processor
    const jobListingId = await findOrCreateJobListing(supabase, {
      jobListingId: formData.job_listing_id,
      jobId: formData.job_id,
      jobTitle: 'General Application',
      organizationId: organizationId,
      clientId: null,
      city,
      state,
      source: 'Direct Application',
    });

    // Map form data to applications table schema
    // Support both camelCase and snake_case field names
    const firstName = formData.firstName || formData.first_name || '';
    const lastName = formData.lastName || formData.last_name || '';
    
    const applicationData = {
      job_listing_id: jobListingId,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim() || null,
      applicant_email: formData.email || formData.applicant_email,
      phone: normalizePhone(formData.phone),
      city: city,
      state: state,
      zip: formData.zip,
      age: formData.over21,
      cdl: formData.cdl,
      exp: formData.exp || getExperienceLevel(formData.experience),
      drug: formData.drug,
      veteran: formData.veteran,
      employment_history: formData.employmentHistory,
      consent: formData.consent,
      privacy: formData.privacy,
      months: formData.months || formData.experience,
      // URL tracking parameters
      ad_id: formData.ad_id || null,
      campaign_id: formData.campaign_id || null,
      adset_id: formData.adset_id || null,
      referral_source: formData.referral_source || formData.utm_source || null,
      how_did_you_hear: formData.utm_medium || formData.utm_campaign || null,
      source: 'Direct Application',
      status: 'pending',
      applied_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert into applications table using shared processor
    const { data, error } = await insertApplication(supabase, applicationData);

    if (error) {
      console.error('Error inserting application:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to submit application', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Application submitted successfully - log only non-PII data
    console.log('Application submitted successfully:', { 
      id: data.id, 
      job_listing_id: data.job_listing_id, 
      organization: organizationName,
      status: data.status 
    });

    // Trigger webhooks for Direct Application source (non-blocking)
    try {
      await triggerSourceWebhooks(supabase, data.id, 'Direct Application');
    } catch (webhookError) {
      console.error('Webhook trigger failed (non-blocking):', webhookError);
    }

    // Check if organization has voice agent for response
    const { data: voiceAgent } = await supabase
      .from('voice_agents')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('is_outbound_enabled', true)
      .maybeSingle();

    return new Response(
      JSON.stringify({ 
        message: 'Application submitted successfully', 
        applicationId: data.id,
        organizationName,
        hasVoiceAgent: !!voiceAgent
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing application:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
