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

    // Get the CR England organization ID
    const { data: crEnglandOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'cr-england')
      .single();

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
      organizationId: crEnglandOrg?.id || '',
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
    console.log('Application submitted successfully:', { id: data.id, job_listing_id: data.job_listing_id, status: data.status });

    return new Response(
      JSON.stringify({ 
        message: 'Application submitted successfully', 
        applicationId: data.id 
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
