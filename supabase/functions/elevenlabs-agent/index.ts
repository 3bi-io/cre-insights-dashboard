import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { agentId, action } = body;
    
    console.log('Received request:', { agentId, action, body });
    
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Handle data collection from voice agent
    if (action === 'collect_data' && agentId === 'agent_01jwedntnjf7tt0qma00a2276r') {
      return await handleDataCollection(body);
    }

    // Generate signed URL for the conversation
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ 
        signedUrl: data.signed_url,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in elevenlabs-agent function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function handleDataCollection(data: any) {
  try {
    console.log('Handling data collection:', data);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract collected data from the voice agent
    const collectedData = data.collectedData || {};
    
    // Map the collected data to application fields
    const applicationData = {
      first_name: collectedData.GivenName || '',
      last_name: collectedData.FamilyName || '',
      applicant_email: collectedData.InternetEmailAddress || '',
      phone: collectedData.PrimaryPhone || '',
      city: collectedData.Municipality || '',
      state: collectedData.Region || '',
      zip: collectedData.PostalCode || '',
      over_21: collectedData.over_21 || '',
      cdl: collectedData.Class_A_CDL || '',
      experience: collectedData.Class_A_CDL_experience || '',
      drug: collectedData.can_pass_drug || '',
      veteran: collectedData.Veteran_Status || '',
      consent: collectedData.consentToSMS || '',
      privacy: collectedData.agree_privacy_policy || '',
      source: 'ElevenLabs Voice Agent',
      status: 'pending',
      applied_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Mapped application data:', applicationData);

    // Insert the application into the database
    const { data: insertedApplication, error } = await supabase
      .from('applications')
      .insert([applicationData])
      .select()
      .single();

    if (error) {
      console.error('Error inserting application:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Application created successfully:', insertedApplication);

    return new Response(
      JSON.stringify({ 
        success: true,
        applicationId: insertedApplication.id,
        message: 'Application created successfully from voice agent data'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in handleDataCollection:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}