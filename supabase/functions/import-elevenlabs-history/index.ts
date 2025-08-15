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
    const { agentId } = await req.json();
    
    console.log('Starting historic conversation import for agent:', agentId);
    
    if (agentId !== 'agent_01jwedntnjf7tt0qma00a2276r') {
      throw new Error('Invalid agent ID');
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch conversation history from ElevenLabs
    const conversationsResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!conversationsResponse.ok) {
      const errorText = await conversationsResponse.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`Failed to fetch conversations: ${conversationsResponse.status}`);
    }

    const conversationsData = await conversationsResponse.json();
    console.log('Found conversations:', conversationsData.conversations?.length || 0);

    const applications = [];
    let processedCount = 0;

    // Process each conversation
    for (const conversation of conversationsData.conversations || []) {
      try {
        // Fetch detailed conversation data
        const detailResponse = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${conversation.conversation_id}`,
          {
            method: 'GET',
            headers: {
              'xi-api-key': elevenLabsApiKey,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!detailResponse.ok) {
          console.warn(`Failed to fetch conversation details for ${conversation.conversation_id}`);
          continue;
        }

        const conversationDetail = await detailResponse.json();
        
        // Extract application data from conversation transcript
        const applicationData = extractApplicationData(conversationDetail, conversation);
        
        if (applicationData) {
          applications.push(applicationData);
          processedCount++;
        }

      } catch (error) {
        console.error(`Error processing conversation ${conversation.conversation_id}:`, error);
        continue;
      }
    }

    // Insert applications into database
    let insertedCount = 0;
    const errors = [];

    for (const appData of applications) {
      try {
        const { data, error } = await supabase
          .from('applications')
          .insert([appData])
          .select()
          .single();

        if (error) {
          console.error('Database insert error:', error);
          errors.push(error.message);
        } else {
          insertedCount++;
          console.log('Inserted application:', data.id);
        }
      } catch (error) {
        console.error('Error inserting application:', error);
        errors.push(error.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalConversations: conversationsData.conversations?.length || 0,
        processedConversations: processedCount,
        insertedApplications: insertedCount,
        errors: errors.length > 0 ? errors : null,
        message: `Successfully imported ${insertedCount} applications from ${processedCount} conversations`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in import function:', error);
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
});

function extractApplicationData(conversationDetail: any, conversation: any) {
  try {
    console.log('Processing conversation:', conversation.conversation_id);
    console.log('Conversation detail structure:', JSON.stringify(conversationDetail, null, 2));
    
    // Extract transcript from messages or direct transcript field
    let transcript = '';
    
    // Try different ways to get transcript content
    if (conversationDetail.transcript && typeof conversationDetail.transcript === 'string') {
      transcript = conversationDetail.transcript;
    } else if (conversationDetail.messages && Array.isArray(conversationDetail.messages)) {
      // Extract text from messages array
      transcript = conversationDetail.messages
        .map((msg: any) => {
          if (typeof msg === 'string') return msg;
          if (msg.text) return msg.text;
          if (msg.content) return msg.content;
          if (msg.message) return msg.message;
          return '';
        })
        .filter(Boolean)
        .join(' ');
    } else if (conversationDetail.turns && Array.isArray(conversationDetail.turns)) {
      // Extract from turns if that's the structure
      transcript = conversationDetail.turns
        .map((turn: any) => {
          if (typeof turn === 'string') return turn;
          if (turn.text) return turn.text;
          if (turn.content) return turn.content;
          return '';
        })
        .filter(Boolean)
        .join(' ');
    }
    
    console.log('Extracted transcript:', transcript);
    
    if (!transcript || typeof transcript !== 'string') {
      console.log('No valid transcript found for conversation:', conversation.conversation_id);
      return null;
    }

    // Look for structured data in conversation
    const extractedData: any = {
      source: 'ElevenLabs Voice Agent (Historic)',
      status: 'pending',
      applied_at: conversation.created_at || new Date().toISOString(),
      created_at: conversation.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // More flexible patterns for extracting data
    const dataPatterns = {
      first_name: /(?:first name|given name|my name is|i'm|i am)\s*:?\s*([a-zA-Z]{2,})/i,
      last_name: /(?:last name|family name|surname)\s*:?\s*([a-zA-Z]{2,})/i,
      applicant_email: /(?:email|e-mail|email address)\s*:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      phone: /(?:phone|telephone|phone number|cell)\s*:?\s*([+]?[\d\s\-\(\)\.]{10,})/i,
      city: /(?:city|live in|from)\s*:?\s*([a-zA-Z\s]{2,})/i,
      state: /(?:state|region)\s*:?\s*([a-zA-Z\s]{2,})/i,
      zip: /(?:zip|postal code|zip code)\s*:?\s*(\d{5}(?:-\d{4})?)/i,
      over_21: /(?:over 21|21 or older|are you 21)\s*:?\s*(yes|no|y|n)/i,
      cdl: /(?:cdl|class a|commercial license)\s*:?\s*(yes|no|y|n)/i,
      drug: /(?:drug test|pass.*drug|clean drug)\s*:?\s*(yes|no|y|n)/i,
      veteran: /(?:veteran|military)\s*:?\s*(yes|no|y|n)/i,
      consent: /(?:consent.*sms|sms.*consent|text messages)\s*:?\s*(yes|no|y|n)/i,
      privacy: /(?:privacy policy|agree.*privacy)\s*:?\s*(yes|no|y|n)/i,
    };

    // Extract data using patterns
    for (const [field, pattern] of Object.entries(dataPatterns)) {
      const match = transcript.match(pattern);
      if (match && match[1]) {
        let value = match[1].trim();
        
        // Normalize yes/no responses
        if (['over_21', 'cdl', 'drug', 'veteran', 'consent', 'privacy'].includes(field)) {
          value = value.toLowerCase().startsWith('y') ? 'Yes' : 'No';
        }
        
        extractedData[field] = value;
        console.log(`Extracted ${field}:`, value);
      }
    }

    // Only return if we have some meaningful data
    const hasData = extractedData.first_name || extractedData.last_name || extractedData.applicant_email || extractedData.phone;
    
    if (hasData) {
      console.log('Successfully extracted application data:', extractedData);
      return extractedData;
    } else {
      console.log('No meaningful application data found in transcript');
    }

    return null;
  } catch (error) {
    console.error('Error extracting application data:', error);
    return null;
  }
}