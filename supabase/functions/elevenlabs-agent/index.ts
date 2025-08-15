import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  // Handle WebSocket upgrade for voice conversations
  if (upgradeHeader.toLowerCase() === "websocket") {
    return handleWebSocketConnection(req);
  }

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

async function handleWebSocketConnection(req: Request) {
  const { socket, response } = Deno.upgradeWebSocket(req);
  let elevenLabsWs: WebSocket | null = null;
  
  socket.onopen = async () => {
    console.log('Client WebSocket connected');
    
    try {
      const agentId = 'agent_01jwedntnjf7tt0qma00a2276r';
      const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
      
      if (!elevenLabsApiKey) {
        socket.send(JSON.stringify({ type: 'error', message: 'ElevenLabs API key not configured' }));
        return;
      }

      // Get signed URL for ElevenLabs
      const signedUrlResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': elevenLabsApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!signedUrlResponse.ok) {
        const errorText = await signedUrlResponse.text();
        console.error('Failed to get signed URL:', errorText);
        socket.send(JSON.stringify({ type: 'error', message: 'Failed to get signed URL' }));
        return;
      }

      const signedUrlData = await signedUrlResponse.json();
      
      // Connect to ElevenLabs WebSocket
      elevenLabsWs = new WebSocket(signedUrlData.signed_url);
      
      elevenLabsWs.onopen = () => {
        console.log('Connected to ElevenLabs agent');
        socket.send(JSON.stringify({ type: 'connected' }));
      };
      
      elevenLabsWs.onmessage = (event) => {
        // Forward messages from ElevenLabs to client
        socket.send(event.data);
      };
      
      elevenLabsWs.onclose = (event) => {
        console.log('ElevenLabs WebSocket closed:', event.code, event.reason);
        socket.send(JSON.stringify({ 
          type: 'agent_disconnected', 
          code: event.code, 
          reason: event.reason 
        }));
      };
      
      elevenLabsWs.onerror = (error) => {
        console.error('ElevenLabs WebSocket error:', error);
        socket.send(JSON.stringify({ type: 'error', message: 'ElevenLabs connection error' }));
      };
      
    } catch (error) {
      console.error('Error setting up ElevenLabs connection:', error);
      socket.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  };

  socket.onmessage = (event) => {
    // Forward messages from client to ElevenLabs
    if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
      elevenLabsWs.send(event.data);
    }
  };

  socket.onclose = () => {
    console.log('Client WebSocket disconnected');
    if (elevenLabsWs) {
      elevenLabsWs.close();
    }
  };

  return response;
}

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