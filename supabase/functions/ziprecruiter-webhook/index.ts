 /**
  * ZipRecruiter Webhook Edge Function
  * Handles inbound application notifications from ZipRecruiter
  */
 
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createLogger } from "../_shared/logger.ts"
import { lookupCityState } from "../_shared/zip-lookup.ts"
import { findOrCreateJobListing, getOrganizationFromJobId, getClientIdFromJobId } from "../_shared/application-processor.ts"
 
 const logger = createLogger('ziprecruiter-webhook')
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-ziprecruiter-signature',
 }
 
 /**
  * Verify ZipRecruiter webhook signature
  */
 async function verifySignature(
   payload: string,
   signature: string | null,
   secret: string | null
 ): Promise<boolean> {
   if (!signature || !secret) {
     logger.warn('Signature verification skipped - missing signature or secret')
     return true // Allow requests when no secret configured
   }
   
   try {
     const encoder = new TextEncoder()
     const key = await crypto.subtle.importKey(
       "raw",
       encoder.encode(secret),
       { name: "HMAC", hash: "SHA-256" },
       false,
       ["sign"]
     )
     
     const signatureBuffer = await crypto.subtle.sign(
       "HMAC",
       key,
       encoder.encode(payload)
     )
     
     const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
       .map(b => b.toString(16).padStart(2, '0'))
       .join('')
     
     return signature === expectedSignature
   } catch (error) {
     logger.error('Signature verification error', { error })
     return false
   }
 }
 
 /**
  * Parse ZipRecruiter application data to our format
  */
async function parseApplicationData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
   // ZipRecruiter may send data in various formats
   // Map common field variations
   
   // Extract zip code first for city/state lookup
   const zipCode = (data.zip || data.postal_code || data.zipcode || '') as string;
   const { city: lookupCity, state: lookupState } = await lookupCityState(zipCode);
   
   return {
     // Personal info
     first_name: data.first_name || data.firstName || data.candidate_first_name || '',
     last_name: data.last_name || data.lastName || data.candidate_last_name || '',
     applicant_email: data.email || data.applicant_email || data.candidate_email || '',
     phone: data.phone || data.phone_number || data.candidate_phone || '',
    
    // Location - prefer ZipRecruiter data, fall back to lookup
    city: data.city || data.location_city || lookupCity || '',
    state: data.state || data.location_state || lookupState || '',
    zip: zipCode,
    
    // Source tracking
     source: 'ZipRecruiter',
    referral_source: 'ZipRecruiter',
    
    // Job info
     job_id: data.job_id || data.jobId || data.external_job_id || '',
     job_title: data.job_title || data.jobTitle || data.position || '',
    
    // CDL & Experience - critical driver qualification fields
    cdl: data.cdl || data.cdl_license || data.has_cdl || data.cdl_status || '',
    cdl_class: data.cdl_class || data.license_class || data.cdl_type || '',
    exp: data.years_experience || data.experience_years || data.driving_experience || data.experience || '',
    driving_experience_years: parseExperienceYears(data.years_experience || data.experience_years || data.driving_experience),
    
    // Education & qualifications
    education_level: data.education || data.education_level || data.highest_education || '',
    work_authorization: data.work_authorization || data.authorization || data.authorized_to_work || '',
    
    // Background & screening
    veteran: data.veteran_status || data.is_veteran || data.veteran || '',
    military_service: data.military_service || data.served_military || '',
    
    // Timing & status
     applied_at: data.applied_at || data.application_date || new Date().toISOString(),
     status: 'pending',
    
    // Notes - include resume and cover letter URLs
    notes: buildApplicationNotes(data),
    
     // Additional ZipRecruiter-specific fields
     ziprecruiter_candidate_id: data.candidate_id || data.candidateId || '',
     ziprecruiter_application_id: data.application_id || data.applicationId || '',
   }
 }
 
 /**
  * Parse experience to numeric years
  */
 function parseExperienceYears(value: unknown): number | null {
   if (!value) return null;
   const str = String(value);
   const match = str.match(/(\d+)/);
   if (match) {
     return parseInt(match[1], 10);
   }
   return null;
 }
 
 /**
  * Build comprehensive notes field with resume/cover letter info
  */
 function buildApplicationNotes(data: Record<string, unknown>): string {
   const parts: string[] = [];
   parts.push(`Applied via ZipRecruiter on ${new Date().toLocaleDateString()}`);
   
   if (data.resume_url || data.resumeUrl) {
     parts.push(`Resume: ${data.resume_url || data.resumeUrl}`);
   }
   
   if (data.cover_letter || data.coverLetter) {
     const coverLetter = String(data.cover_letter || data.coverLetter);
     if (coverLetter.startsWith('http')) {
       parts.push(`Cover Letter: ${coverLetter}`);
     } else {
       parts.push(`Cover Letter:\n${coverLetter}`);
     }
   }
   
   if (data.notes) {
     parts.push(`Additional Notes: ${data.notes}`);
   }
   
   return parts.join('\n\n');
 }
 
 serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders })
   }
 
   logger.info('ZipRecruiter webhook received', { method: req.method })
 
   if (req.method !== 'POST') {
     return new Response(
       JSON.stringify({ success: false, error: 'Method not allowed' }),
       { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     )
   }
 
   try {
     const supabase = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
     )
 
     const rawBody = await req.text()
     
     // Verify signature if configured
     const signature = req.headers.get('x-ziprecruiter-signature') || req.headers.get('x-webhook-signature')
     const secret = Deno.env.get('ZIPRECRUITER_WEBHOOK_SECRET')
     
     if (secret) {
       const isValid = await verifySignature(rawBody, signature, secret)
       if (!isValid) {
         logger.error('Invalid webhook signature')
         return new Response(
           JSON.stringify({ success: false, error: 'Invalid signature' }),
           { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
         )
       }
       logger.info('Webhook signature verified')
     }
 
     // Parse body
     let body: Record<string, unknown>
     try {
       body = JSON.parse(rawBody)
     } catch {
       logger.error('Failed to parse JSON body')
       return new Response(
         JSON.stringify({ success: false, error: 'Invalid JSON' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       )
     }
 
     logger.info('Parsed webhook data', { keys: Object.keys(body) })
 
     // Check event type (ZipRecruiter may send different event types)
     const eventType = body.event || body.event_type || body.type || 'application'
     
     if (eventType !== 'application' && eventType !== 'new_application' && eventType !== 'candidate_apply') {
       logger.info('Ignoring non-application event', { eventType })
       return new Response(
         JSON.stringify({ success: true, message: `Event type ${eventType} ignored` }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       )
     }
 
     // Extract application data (may be nested under 'data', 'application', or 'candidate')
     const applicationData = body.data || body.application || body.candidate || body
    const parsed = await parseApplicationData(applicationData as Record<string, unknown>)
 
     logger.info('Application data parsed', { 
       email: parsed.applicant_email,
       jobId: parsed.job_id
     })
 
     // Check for duplicates
     const { data: existing } = await supabase
       .from('applications')
       .select('id')
       .eq('applicant_email', parsed.applicant_email)
       .eq('source', 'ZipRecruiter')
       .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
       .limit(1)
 
     if (existing && existing.length > 0) {
       logger.info('Duplicate application detected, skipping', { email: parsed.applicant_email })
       return new Response(
         JSON.stringify({ success: true, message: 'Duplicate application, skipped' }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       )
     }
 
    // Resolve job listing using client-aware routing
    let jobListingId: string | null = null
    const jobIdStr = parsed.job_id ? String(parsed.job_id) : undefined
    
    // Infer organization and client from job_id prefix
    const inferredOrgId = getOrganizationFromJobId(jobIdStr) || undefined
    const inferredClientId = inferredOrgId ? getClientIdFromJobId(jobIdStr, inferredOrgId) : null
    
    logger.info('ZipRecruiter routing context', {
      jobId: jobIdStr,
      inferredOrgId,
      inferredClientId,
    })
    
    if (inferredOrgId) {
      const result = await findOrCreateJobListing(supabase, {
        jobId: jobIdStr,
        jobTitle: parsed.job_title ? String(parsed.job_title) : undefined,
        organizationId: inferredOrgId,
        clientId: inferredClientId,
        city: parsed.city ? String(parsed.city) : undefined,
        state: parsed.state ? String(parsed.state) : undefined,
        source: 'ZipRecruiter',
      })
      
      if (result) {
        jobListingId = result.id
        logger.info('Resolved job listing via client-aware routing', {
          jobListingId,
          matchType: result.matchType,
        })
      }
    } else if (jobIdStr) {
      // Fallback: try direct ID/external_id match for non-mapped orgs
      const { data: jobListing } = await supabase
        .from('job_listings')
        .select('id')
        .or(`id.eq.${jobIdStr},external_id.eq.${jobIdStr}`)
        .limit(1)
        .single()

      if (jobListing) {
        jobListingId = jobListing.id
      }
    }
 
     // Insert the application
     const { data: newApp, error: insertError } = await supabase
       .from('applications')
       .insert({
         first_name: parsed.first_name,
         last_name: parsed.last_name,
         applicant_email: parsed.applicant_email,
         phone: parsed.phone,
         city: parsed.city,
         state: parsed.state,
         zip: parsed.zip,
         source: 'ZipRecruiter',
         referral_source: 'ZipRecruiter',
         job_listing_id: jobListingId,
         status: 'pending',
         notes: parsed.notes,
         applied_at: parsed.applied_at,
          cdl: parsed.cdl || null,
          cdl_class: parsed.cdl_class || null,
          exp: parsed.exp || null,
          driving_experience_years: parsed.driving_experience_years || null,
          education_level: parsed.education_level || null,
          work_authorization: parsed.work_authorization || null,
          veteran: parsed.veteran || null,
          military_service: parsed.military_service || null,
       })
       .select('id')
       .single()
 
     if (insertError) {
       logger.error('Failed to insert application', { error: insertError })
       return new Response(
         JSON.stringify({ success: false, error: 'Failed to save application' }),
         { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       )
     }
 
     logger.info('Application created successfully', { applicationId: newApp.id })
 
     return new Response(
       JSON.stringify({
         success: true,
         message: 'Application received',
         applicationId: newApp.id
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     )
 
   } catch (error) {
     logger.error('Webhook processing error', { error })
     return new Response(
       JSON.stringify({
         success: false,
         error: error instanceof Error ? error.message : 'Unknown error'
       }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     )
   }
 })