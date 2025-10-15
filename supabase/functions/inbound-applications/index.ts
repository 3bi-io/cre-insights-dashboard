// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

interface InboundApplicationData {
  // Applicant Information
  first_name?: string;
  last_name?: string;
  full_name?: string;
  applicant_email?: string;
  email?: string;
  phone?: string;
  
  // Location
  city?: string;
  state?: string;
  zip?: string;
  address_1?: string;
  address_2?: string;
  country?: string;
  
  // Job Details
  job_listing_id?: string;
  job_id?: string;
  job_title?: string;
  
  // CDL & Experience
  cdl?: string;
  cdl_class?: string;
  cdl_state?: string;
  cdl_endorsements?: string[];
  exp?: string;
  experience_years?: string;
  
  // Demographics
  age?: string;
  veteran?: string;
  education_level?: string;
  work_authorization?: string;
  
  // Screening
  consent?: string;
  drug?: string;
  privacy?: string;
  convicted_felony?: string;
  
  // Source tracking
  source?: string;
  ad_id?: string;
  campaign_id?: string;
  adset_id?: string;
  
  // Organization
  organization_id?: string;
  organization_slug?: string;
  
  // Additional fields
  notes?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Verify webhook signature for security using Web Crypto API
 */
const verifyWebhookSignature = async (
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> => {
  if (!signature || !secret) return false;
  
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

/**
 * Extract value from multiple possible field names
 */
const extractValue = (data: any, fieldNames: string[]): string | undefined => {
  for (const fieldName of fieldNames) {
    if (data[fieldName] !== undefined && data[fieldName] !== null) {
      const value = String(data[fieldName]).trim();
      if (value) return value;
    }
  }
  return undefined;
};

/**
 * Validate required fields
 */
const validateApplicationData = (data: InboundApplicationData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Email is required
  const email = data.applicant_email || data.email;
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }
  
  // At least first name or full name required
  if (!data.first_name && !data.full_name) {
    errors.push('First name or full name is required');
  }
  
  // Phone validation (if provided)
  if (data.phone) {
    const phoneDigits = data.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      errors.push('Phone number must be at least 10 digits');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Normalize phone number to E.164 format
 */
const normalizePhone = (phone: string | undefined): string | null => {
  if (!phone) return null;
  
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length < 10) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  
  return `+1${digits.slice(-10)}`;
};

const handler = async (req: Request): Promise<Response> => {
  console.log('=== INBOUND APPLICATION WEBHOOK ===', {
    method: req.method,
    timestamp: new Date().toISOString(),
    url: req.url,
    headers: Object.fromEntries(req.headers)
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed', allowed_methods: ['POST'] }),
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

    // Parse request body
    const rawBody = await req.text();
    const contentType = req.headers.get('content-type') || '';
    let body: any = {};

    console.log('Content-Type:', contentType);
    console.log('Raw body preview:', rawBody.substring(0, 500));

    if (contentType.includes('application/json')) {
      body = JSON.parse(rawBody);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(rawBody);
      body = Object.fromEntries(params);
    } else {
      // Try JSON first, fallback to form data
      try {
        body = JSON.parse(rawBody);
      } catch {
        const params = new URLSearchParams(rawBody);
        body = Object.fromEntries(params);
      }
    }

    console.log('Parsed webhook data:', JSON.stringify(body, null, 2));

    // Optional: Verify webhook signature if provided
    const signature = req.headers.get('x-webhook-signature');
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    
    if (webhookSecret && signature) {
      const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }
      console.log('Webhook signature verified');
    }

    // Extract application data with flexible field mapping
    const applicationData: InboundApplicationData = {
      first_name: extractValue(body, ['first_name', 'firstName', 'fname', 'givenName']),
      last_name: extractValue(body, ['last_name', 'lastName', 'lname', 'familyName']),
      full_name: extractValue(body, ['full_name', 'fullName', 'name', 'applicant_name']),
      applicant_email: extractValue(body, ['applicant_email', 'email', 'emailAddress', 'e_mail']),
      phone: extractValue(body, ['phone', 'phone_number', 'phoneNumber', 'mobile', 'cell']),
      
      city: extractValue(body, ['city', 'location_city', 'applicant_city']),
      state: extractValue(body, ['state', 'location_state', 'applicant_state']),
      zip: extractValue(body, ['zip', 'zipcode', 'postal_code', 'postalCode']),
      address_1: extractValue(body, ['address_1', 'address', 'street', 'street_address']),
      address_2: extractValue(body, ['address_2', 'address_line_2', 'apt', 'suite']),
      country: extractValue(body, ['country', 'country_code']) || 'US',
      
      job_listing_id: extractValue(body, ['job_listing_id', 'jobListingId', 'job_id', 'jobId']),
      job_id: extractValue(body, ['job_id', 'jobId', 'reference_number', 'referenceNumber']),
      job_title: extractValue(body, ['job_title', 'jobTitle', 'position', 'title']),
      
      cdl: extractValue(body, ['cdl', 'cdl_license', 'has_cdl']),
      cdl_class: extractValue(body, ['cdl_class', 'cdlClass', 'license_class']),
      cdl_state: extractValue(body, ['cdl_state', 'cdlState', 'license_state']),
      exp: extractValue(body, ['exp', 'experience', 'years_experience', 'yearsExperience']),
      
      age: extractValue(body, ['age', 'over_21', 'over21']),
      veteran: extractValue(body, ['veteran', 'military', 'military_service']),
      education_level: extractValue(body, ['education_level', 'education', 'educationLevel']),
      work_authorization: extractValue(body, ['work_authorization', 'workAuthorization', 'authorized']),
      
      consent: extractValue(body, ['consent', 'agree', 'consent_to_contact']),
      drug: extractValue(body, ['drug', 'drug_test', 'can_pass_drug_test']),
      privacy: extractValue(body, ['privacy', 'privacy_policy', 'agree_privacy']),
      convicted_felony: extractValue(body, ['convicted_felony', 'felony', 'criminal_history']),
      
      source: extractValue(body, ['source', 'utm_source', 'referrer']) || 'CDL Job Cast',
      ad_id: extractValue(body, ['ad_id', 'adId', 'advertisement_id']),
      campaign_id: extractValue(body, ['campaign_id', 'campaignId', 'utm_campaign']),
      adset_id: extractValue(body, ['adset_id', 'adsetId', 'ad_set_id']),
      
      organization_id: extractValue(body, ['organization_id', 'organizationId', 'org_id']),
      organization_slug: extractValue(body, ['organization_slug', 'organizationSlug', 'org_slug']),
      
      notes: extractValue(body, ['notes', 'comments', 'message']),
      status: extractValue(body, ['status']) || 'pending',
    };

    // Parse CDL endorsements if provided
    if (body.cdl_endorsements) {
      if (Array.isArray(body.cdl_endorsements)) {
        applicationData.cdl_endorsements = body.cdl_endorsements;
      } else if (typeof body.cdl_endorsements === 'string') {
        applicationData.cdl_endorsements = body.cdl_endorsements.split(',').map(e => e.trim());
      }
    }

    // Validate application data
    const validation = validateApplicationData(applicationData);
    if (!validation.valid) {
      console.error('Validation errors:', validation.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          errors: validation.errors,
          received_data: Object.keys(body)
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Determine organization - use Hayes as default if not specified
    let organizationId = applicationData.organization_id;
    
    if (!organizationId && applicationData.organization_slug) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', applicationData.organization_slug)
        .single();
      
      organizationId = org?.id;
    }
    
    // Default to Hayes Recruiting Solutions
    if (!organizationId) {
      organizationId = '84214b48-7b51-45bc-ad7f-723bcf50466c';
    }

    // Find or create job listing
    let jobListingId = applicationData.job_listing_id;
    
    if (!jobListingId && applicationData.job_id) {
      const { data: jobListing } = await supabase
        .from('job_listings')
        .select('id')
        .eq('job_id', applicationData.job_id)
        .eq('organization_id', organizationId)
        .maybeSingle();
      
      jobListingId = jobListing?.id;
    }

    // If still no job listing and we have a title, create a placeholder
    if (!jobListingId && applicationData.job_title) {
      // Get default category
      const { data: categories } = await supabase
        .from('job_categories')
        .select('id')
        .limit(1);
      
      const categoryId = categories?.[0]?.id;
      
      if (categoryId) {
        const { data: newJob, error: jobError } = await supabase
          .from('job_listings')
          .insert({
            title: applicationData.job_title,
            job_id: applicationData.job_id,
            organization_id: organizationId,
            category_id: categoryId,
            status: 'active',
            job_summary: `Position from ${applicationData.source}`,
            location: applicationData.city && applicationData.state 
              ? `${applicationData.city}, ${applicationData.state}` 
              : null,
            city: applicationData.city,
            state: applicationData.state,
          })
          .select('id')
          .single();
        
        if (!jobError && newJob) {
          jobListingId = newJob.id;
          console.log('Created placeholder job listing:', jobListingId);
        }
      }
    }

    // Prepare application record
    const applicationRecord = {
      job_listing_id: jobListingId,
      first_name: applicationData.first_name || applicationData.full_name?.split(' ')[0],
      last_name: applicationData.last_name || applicationData.full_name?.split(' ').slice(1).join(' '),
      full_name: applicationData.full_name || `${applicationData.first_name} ${applicationData.last_name}`.trim(),
      applicant_email: applicationData.applicant_email,
      phone: normalizePhone(applicationData.phone),
      
      city: applicationData.city,
      state: applicationData.state,
      zip: applicationData.zip,
      address_1: applicationData.address_1,
      address_2: applicationData.address_2,
      country: applicationData.country,
      
      job_id: applicationData.job_id,
      
      cdl: applicationData.cdl,
      cdl_class: applicationData.cdl_class,
      cdl_state: applicationData.cdl_state,
      cdl_endorsements: applicationData.cdl_endorsements,
      exp: applicationData.exp,
      
      age: applicationData.age,
      veteran: applicationData.veteran,
      education_level: applicationData.education_level,
      work_authorization: applicationData.work_authorization,
      
      consent: applicationData.consent,
      drug: applicationData.drug,
      privacy: applicationData.privacy,
      convicted_felony: applicationData.convicted_felony,
      
      source: applicationData.source,
      ad_id: applicationData.ad_id,
      campaign_id: applicationData.campaign_id,
      adset_id: applicationData.adset_id,
      
      notes: applicationData.notes,
      status: applicationData.status,
      applied_at: new Date().toISOString(),
    };

    // Insert application
    const { data: application, error: insertError } = await supabase
      .from('applications')
      .insert(applicationRecord)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting application:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create application',
          details: insertError.message
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('Application created successfully:', application.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Application received and processed',
        application_id: application.id,
        organization_id: organizationId,
        job_listing_id: jobListingId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);
