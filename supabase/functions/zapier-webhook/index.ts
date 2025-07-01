
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

    // Parse the request body
    const body = await req.json();
    console.log('Received webhook data:', body);

    // Extract application data from Zapier payload
    const applicationData: ZapierApplicationData = {
      job_listing_id: body.job_listing_id || body.jobListingId,
      applicant_name: body.applicant_name || body.applicantName || body.name,
      applicant_email: body.applicant_email || body.applicantEmail || body.email,
      source: body.source || 'Zapier',
      status: body.status || 'pending'
    };

    // Validate required fields
    if (!applicationData.job_listing_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: job_listing_id',
          received_data: body
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

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
          job_listing_id: applicationData.job_listing_id
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
