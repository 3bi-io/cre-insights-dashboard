
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZapierApplicationData {
  job_listing_id?: string;
  job_title?: string;
  applicant_name?: string;
  applicant_email?: string;
  source?: string;
  status?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

// Helper function to safely extract value from multiple possible field names
const extractValue = (data: any, fieldNames: string[]): string | undefined => {
  for (const fieldName of fieldNames) {
    if (data[fieldName] && typeof data[fieldName] === 'string' && data[fieldName].trim()) {
      return data[fieldName].trim();
    }
  }
  return undefined;
};

const handler = async (req: Request): Promise<Response> => {
  console.log('Zapier webhook received:', req.method);

  // Handle CORS preflight requests
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
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse the request body - handle both JSON and form data
    let body: any = {};
    const contentType = req.headers.get('content-type') || '';
    
    console.log('Content-Type:', contentType);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.text();
      console.log('Form data received:', formData);
      
      // Parse URL-encoded data
      const params = new URLSearchParams(formData);
      body = {};
      for (const [key, value] of params) {
        body[key] = value;
      }
    } else {
      // Try to parse as text and then as JSON as fallback
      const text = await req.text();
      console.log('Raw text received:', text);
      
      try {
        body = JSON.parse(text);
      } catch {
        // If it's not JSON, treat it as form data
        const params = new URLSearchParams(text);
        body = {};
        for (const [key, value] of params) {
          body[key] = value;
        }
      }
    }

    console.log('Parsed webhook data:', JSON.stringify(body, null, 2));

    // More flexible field extraction with multiple possible field names
    const applicationData: ZapierApplicationData = {
      job_listing_id: extractValue(body, [
        'job_listing_id', 'jobListingId', 'job_id', 'jobId', 'listing_id'
      ]),
      job_title: extractValue(body, [
        'job_title', 'jobTitle', 'title', 'job_name', 'position', 'role'
      ]),
      applicant_name: extractValue(body, [
        'applicant_name', 'applicantName', 'name', 'full_name', 'fullName', 'candidate_name'
      ]),
      first_name: extractValue(body, [
        'first_name', 'firstName', 'applicant_first_name', 'fname', 'given_name'
      ]),
      last_name: extractValue(body, [
        'last_name', 'lastName', 'applicant_last_name', 'lname', 'family_name', 'surname'
      ]),
      applicant_email: extractValue(body, [
        'applicant_email', 'applicantEmail', 'email', 'email_address', 'emailAddress', 'candidate_email'
      ]),
      email: extractValue(body, [
        'email', 'email_address', 'emailAddress', 'applicant_email', 'applicantEmail', 'candidate_email'
      ]),
      source: extractValue(body, [
        'source', 'platform', 'origin', 'referrer', 'channel'
      ]) || 'Zapier',
      status: extractValue(body, [
        'status', 'application_status', 'state', 'stage'
      ]) || 'pending'
    };

    console.log('Processed application data:', JSON.stringify(applicationData, null, 2));

    // Validate that we have essential data
    if (!applicationData.job_listing_id && !applicationData.job_title) {
      console.error('Missing required job identification');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required job information',
          message: 'Either job_listing_id or job_title is required',
          received_fields: Object.keys(body),
          help: 'Please provide either a job_listing_id or job_title field in your webhook data'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    if (!applicationData.applicant_email && !applicationData.email) {
      console.error('Missing required email');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required email',
          message: 'Applicant email is required',
          received_fields: Object.keys(body),
          help: 'Please provide an email field in your webhook data'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    let jobListing = null;

    // Try to find job listing by ID first, then by title
    if (applicationData.job_listing_id) {
      console.log('Searching for job by ID:', applicationData.job_listing_id);
      const { data, error } = await supabase
        .from('job_listings')
        .select('id, title, job_title')
        .eq('id', applicationData.job_listing_id)
        .maybeSingle();
      
      if (!error && data) {
        jobListing = data;
        console.log('Found job listing by ID:', jobListing);
      } else if (error) {
        console.log('Error searching by ID:', error);
      }
    }

    // If no job listing found by ID, try to find by title
    if (!jobListing && applicationData.job_title) {
      console.log('Searching for job by title:', applicationData.job_title);
      
      const { data, error } = await supabase
        .from('job_listings')
        .select('id, title, job_title')
        .or(`title.ilike.%${applicationData.job_title}%,job_title.ilike.%${applicationData.job_title}%`)
        .limit(1)
        .maybeSingle();
      
      if (!error && data) {
        jobListing = data;
        console.log('Found job listing by title:', jobListing);
      } else if (error) {
        console.log('Error searching by title:', error);
      }
    }

    // If still no job listing found, get available listings for debugging
    if (!jobListing) {
      console.log('No job listing found, fetching available listings for debug');
      const { data: allJobListings } = await supabase
        .from('job_listings')
        .select('id, title, job_title')
        .limit(10);

      console.log('Available job listings:', allJobListings);

      return new Response(
        JSON.stringify({ 
          error: 'Job listing not found',
          message: 'Could not find a matching job listing',
          provided_job_id: applicationData.job_listing_id,
          provided_job_title: applicationData.job_title,
          available_listings: allJobListings?.map(job => ({
            id: job.id,
            title: job.title || job.job_title,
            matches_title: job.title || job.job_title
          })) || [],
          help: 'Please verify the job_listing_id exists or provide a job_title that matches an existing job listing. Check the available listings above.',
          received_data: body,
          all_received_fields: Object.keys(body)
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Build applicant name from available fields
    let applicantName = applicationData.applicant_name;
    if (!applicantName && (applicationData.first_name || applicationData.last_name)) {
      applicantName = [applicationData.first_name, applicationData.last_name]
        .filter(Boolean)
        .join(' ');
    }

    // Prepare final application data for insertion
    const finalApplicationData = {
      job_listing_id: jobListing.id,
      applicant_email: applicationData.applicant_email || applicationData.email,
      first_name: applicationData.first_name || (applicantName ? applicantName.split(' ')[0] : null),
      last_name: applicationData.last_name || (applicantName && applicantName.includes(' ') ? applicantName.split(' ').slice(1).join(' ') : null),
      email: applicationData.email || applicationData.applicant_email,
      source: applicationData.source,
      status: applicationData.status,
      applied_at: new Date().toISOString()
    };

    console.log('Final application data for insertion:', JSON.stringify(finalApplicationData, null, 2));

    // Insert the application into the database
    const { data: application, error: insertError } = await supabase
      .from('applications')
      .insert([finalApplicationData])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting application:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create application',
          message: insertError.message,
          details: insertError.details || insertError.hint,
          application_data: finalApplicationData
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('Application created successfully:', application);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Application created successfully',
        application: {
          id: application.id,
          job_listing_id: application.job_listing_id,
          applicant_email: application.applicant_email || application.email,
          status: application.status,
          applied_at: application.applied_at
        },
        job_listing: {
          id: jobListing.id,
          title: jobListing.title || jobListing.job_title
        }
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
        message: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);
