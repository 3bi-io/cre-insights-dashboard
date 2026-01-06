import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { agentId, jobContext } = await req.json();

    if (!agentId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Agent ID is required' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'ElevenLabs API key not configured' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Requesting signed URL for agent:', agentId, 'with job context:', jobContext);

    // Build dynamic variables from job context
    // These are required by the ElevenLabs agent's first message template
    const dynamicVariables: Record<string, string> = {
      job_title: jobContext?.jobTitle || 'the driving position',
      applicant_first_name: 'there', // Will be collected during conversation
      company_name: jobContext?.company || 'our company',
      job_location: jobContext?.location || 'various locations',
      salary: jobContext?.salary || 'competitive compensation',
    };

    console.log('Dynamic variables:', dynamicVariables);

    // Request signed URL from ElevenLabs API with dynamic variables
    // For web SDK, we pass variables via conversation_config_override
    const signedUrlResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!signedUrlResponse.ok) {
      const errorText = await signedUrlResponse.text();
      console.error('ElevenLabs API error:', signedUrlResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `ElevenLabs API error: ${signedUrlResponse.status} - ${errorText}` 
        }),
        { 
          status: signedUrlResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await signedUrlResponse.json();
    console.log('Signed URL obtained successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        signedUrl: data.signed_url,
        dynamicVariables // Pass to client for WebSocket initialization
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in elevenlabs-agent function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});