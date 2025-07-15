
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
    // Initialize Supabase client with service role key since this is a public function
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

    console.log('Parsed webhook data:', body);

    // Extract application data from Zapier payload with more flexible field mapping
    const applicationData: ZapierApplicationData = {
      job_listing_id: body.job_listing_id || body.jobListingId || body.job_id,
      job_title: body.job_title || body.jobTitle || body.title,
      applicant_name: body.applicant_name || body.applicantName || body.name || body.full_name,
      first_name: body.first_name || body.firstName || body.applicant_first_name,
      last_name: body.last_name || body.lastName || body.applicant_last_name,
      applicant_email: body.applicant_email || body.applicantEmail || body.email,
      email: body.email || body.applicant_email || body.applicantEmail,
      source: body.source || 'Zapier',
      status: body.status || 'pending'
    };

    console.log('Processed application data:', applicationData);

    let jobListing = null;

    // Try to find job listing by ID first, then by title
    if (applicationData.job_listing_id) {
      const { data, error } = await supabase
        .from('job_listings')
        .select('id, title')
        .eq('id', applicationData.job_listing_id)
        .single();
      
      if (!error && data) {
        jobListing = data;
      }
    }

    // If no job listing found by ID, try to find by title
    if (!jobListing && applicationData.job_title) {
      console.log('Searching for job by title:', applicationData.job_title);
      
      const { data, error } = await supabase
        .from('job_listings')
        .select('id, title')
        .ilike('title', `%${applicationData.job_title}%`)
        .limit(1)
        .single();
      
      if (!error && data) {
        jobListing = data;
        console.log('Found job listing by title:', jobListing);
      }
    }

    // If still no job listing found, get available listings for debugging
    if (!jobListing) {
      const { data: allJobListings } = await supabase
        .from('job_listings')
        .select('id, title')
        .limit(10);

      console.log('Available job listings:', allJobListings);

      return new Response(
        JSON.stringify({ 
          error: 'Job listing not found',
          provided_job_id: applicationData.job_listing_id,
          provided_job_title: applicationData.job_title,
          available_listings: allJobListings || [],
          help: 'Please verify the job_listing_id exists or provide a job_title that matches an existing job listing. Check the available listings above.',
          received_data: body
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Prepare final application data for insertion
    const finalApplicationData = {
      job_listing_id: jobListing.id,
      applicant_email: applicationData.applicant_email || applicationData.email,
      first_name: applicationData.first_name,
      last_name: applicationData.last_name || applicationData.applicant_name,
      email: applicationData.email || applicationData.applicant_email,
      source: applicationData.source,
      status: applicationData.status,
      applied_at: new Date().toISOString()
    };

    console.log('Final application data for insertion:', finalApplicationData);

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
          details: insertError.message,
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
        application: application,
        job_listing: jobListing
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
        message: error.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);
