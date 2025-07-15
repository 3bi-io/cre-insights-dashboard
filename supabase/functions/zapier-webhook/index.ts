
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZapierApplicationData {
  job_listing_id?: string;
  job_id?: string;
  job_title?: string;
  applicant_name?: string;
  applicant_email?: string;
  source?: string;
  status?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
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
    // Set a timeout for the entire operation
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000); // 25 second timeout
    });

    const processWebhook = async (): Promise<Response> => {
      // Initialize Supabase client with service role key
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

    // Parse the request body - handle both JSON and form data
    let body: any = {};
    const contentType = req.headers.get('content-type') || '';
    
    console.log('Content-Type:', contentType);

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

    // More flexible field extraction with multiple possible field names - INCLUDING job_id
    const applicationData: ZapierApplicationData = {
      job_listing_id: extractValue(body, [
        'job_listing_id', 'jobListingId', 'job_id', 'jobId', 'listing_id'
      ]),
      job_id: extractValue(body, [
        'job_id', 'jobId', 'job_listing_id', 'jobListingId', 'listing_id'
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
      phone: extractValue(body, [
        'phone', 'phone_number', 'phoneNumber', 'applicant_phone', 'contact_number', 'mobile', 'tel'
      ]),
      source: extractValue(body, [
        'source', 'platform', 'origin', 'referrer', 'channel'
      ]) || 'Zapier',
      status: extractValue(body, [
        'status', 'application_status', 'state', 'stage'
      ]) || 'pending'
    };

    console.log('Processed application data:', JSON.stringify(applicationData, null, 2));

    // Use job_id as job_listing_id if job_listing_id is not provided
    const jobIdentifier = applicationData.job_listing_id || applicationData.job_id;

    // Helper function to check if a string is a valid UUID
    const isValidUUID = (str: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    // Job identification is now optional - applications can be created without matching job listings

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

    // Try to find job listing by ID only if it's a valid UUID
    if (jobIdentifier && isValidUUID(jobIdentifier)) {
      console.log('Searching for job by UUID:', jobIdentifier);
      const { data, error } = await supabase
        .from('job_listings')
        .select('id, title, job_title')
        .eq('id', jobIdentifier)
        .maybeSingle();
      
      if (!error && data) {
        jobListing = data;
        console.log('Found job listing by ID:', jobListing);
      } else if (error) {
        console.log('Error searching by ID:', error);
      }
    } else if (jobIdentifier) {
      console.log('Invalid UUID format for job identifier:', jobIdentifier, '- skipping UUID search');
    }

    // If no job listing found by ID, try to find by title with more flexible matching
    if (!jobListing && applicationData.job_title) {
      console.log('Searching for job by title:', applicationData.job_title);
      
      // First try exact match, then partial match
      let { data, error } = await supabase
        .from('job_listings')
        .select('id, title, job_title')
        .or(`title.eq.${applicationData.job_title},job_title.eq.${applicationData.job_title}`)
        .limit(1)
        .maybeSingle();
      
      if (!data && !error) {
        // Try case-insensitive partial match
        ({ data, error } = await supabase
          .from('job_listings')
          .select('id, title, job_title')
          .or(`title.ilike.%${applicationData.job_title}%,job_title.ilike.%${applicationData.job_title}%`)
          .limit(1)
          .maybeSingle());
      }
      
      if (!error && data) {
        jobListing = data;
        console.log('Found job listing by title:', jobListing);
      } else if (error) {
        console.log('Error searching by title:', error);
      }
    }

    // If still no job listing found and job title provided, create one automatically 
    if (!jobListing && applicationData.job_title) {
      console.log('No job listing found, creating new one with title:', applicationData.job_title);
      
      // Get the first available platform and category for the new job listing
      const { data: platforms } = await supabase
        .from('platforms')
        .select('id')
        .limit(1)
        .maybeSingle();
        
      const { data: categories } = await supabase
        .from('job_categories')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (platforms && categories) {
        const { data: newJob, error: createError } = await supabase
          .from('job_listings')
          .insert([{
            title: applicationData.job_title,
            job_title: applicationData.job_title,
            platform_id: platforms.id,
            category_id: categories.id,
            user_id: '00000000-0000-0000-0000-000000000000', // System user for auto-created jobs
            status: 'active'
          }])
          .select('id, title, job_title')
          .single();

        if (!createError && newJob) {
          jobListing = newJob;
          console.log('Created new job listing:', jobListing);
        }
      }
    }

    // Applications can now be created without a job listing

    // Build applicant name from available fields
    let applicantName = applicationData.applicant_name;
    if (!applicantName && (applicationData.first_name || applicationData.last_name)) {
      applicantName = [applicationData.first_name, applicationData.last_name]
        .filter(Boolean)
        .join(' ');
    }

    // Store external job ID directly as string if not a valid UUID
    let customFieldValue = null;
    if (jobIdentifier && !isValidUUID(jobIdentifier)) {
      customFieldValue = jobIdentifier;
    }

    // Prepare final application data for insertion
    const finalApplicationData = {
      ...(jobListing && { job_listing_id: jobListing.id }),
      applicant_email: applicationData.applicant_email || applicationData.email,
      first_name: applicationData.first_name || (applicantName ? applicantName.split(' ')[0] : null),
      last_name: applicationData.last_name || (applicantName && applicantName.includes(' ') ? applicantName.split(' ').slice(1).join(' ') : null),
      phone: applicationData.phone,
      source: applicationData.source,
      status: applicationData.status,
      job_id: customFieldValue,
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
        ...(jobListing && {
          job_listing: {
            id: jobListing.id,
            title: jobListing.title || jobListing.job_title
          }
        })
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
    };

    // Race between the actual processing and timeout
    return await Promise.race([processWebhook(), timeoutPromise]);

  } catch (error) {
    console.error('Webhook error:', error);
    
    // Handle timeout errors specifically
    if (error.message === 'Request timeout') {
      return new Response(
        JSON.stringify({ 
          error: 'Request timeout',
          message: 'The webhook processing took too long to complete. Please try again.',
          timeout: '25 seconds'
        }),
        { 
          status: 504,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
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
