
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZapierApplicationData {
  job_listing_id: string;
  applicant_name?: string;
  applicant_email?: string;
  source?: string;
  status?: string;
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

    // Extract application data from Zapier payload
    const applicationData: ZapierApplicationData = {
      job_listing_id: body.job_listing_id || body.jobListingId || body.job_id,
      applicant_name: body.applicant_name || body.applicantName || body.name || body.full_name,
      applicant_email: body.applicant_email || body.applicantEmail || body.email,
      source: body.source || 'Zapier',
      status: body.status || 'pending'
    };

    // Validate required fields
    if (!applicationData.job_listing_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: job_listing_id',
          received_data: body,
          help: 'Make sure your Zapier webhook includes a job_listing_id field'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // First, let's check what job listings exist to help with debugging
    const { data: allJobListings, error: listError } = await supabase
      .from('job_listings')
      .select('id, title')
      .limit(10);

    console.log('Available job listings:', allJobListings);

    // Verify the job listing exists
    const { data: jobListing, error: jobError } = await supabase
      .from('job_listings')
      .select('id, title')
      .eq('id', applicationData.job_listing_id)
      .single();

    if (jobError || !jobListing) {
      console.error('Job listing not found:', jobError);
      return new Response(
        JSON.stringify({ 
          error: 'Job listing not found',
          job_listing_id: applicationData.job_listing_id,
          available_listings: allJobListings || [],
          help: 'Please verify the job_listing_id exists in your database. Check the available listings above.'
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Insert the application into the database
    const { data: application, error: insertError } = await supabase
      .from('applications')
      .insert([applicationData])
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
