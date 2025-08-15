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
    // Extract data from conversation transcript
    const transcript = conversationDetail.transcript || '';
    const messages = conversationDetail.messages || [];
    
    // Look for structured data in conversation
    const extractedData: any = {
      source: 'ElevenLabs Voice Agent (Historic)',
      status: 'pending',
      applied_at: conversation.created_at || new Date().toISOString(),
      created_at: conversation.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Parse transcript for application data using patterns
    const dataPatterns = {
      first_name: /(?:first name|given name)[\s:]*([a-zA-Z]+)/i,
      last_name: /(?:last name|family name|surname)[\s:]*([a-zA-Z]+)/i,
      applicant_email: /(?:email|e-mail)[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      phone: /(?:phone|telephone)[\s:]*([+]?[\d\s\-\(\)\.]{10,})/i,
      city: /(?:city|municipality)[\s:]*([a-zA-Z\s]+)/i,
      state: /(?:state|region)[\s:]*([a-zA-Z\s]{2,})/i,
      zip: /(?:zip|postal code)[\s:]*(\d{5}(?:-\d{4})?)/i,
      over_21: /(?:over 21|21 or older)[\s:]*([yn]es?|no)/i,
      cdl: /(?:cdl|class a)[\s:]*([yn]es?|no)/i,
      drug: /(?:drug test|pass.*drug)[\s:]*([yn]es?|no)/i,
      veteran: /(?:veteran)[\s:]*([yn]es?|no)/i,
      consent: /(?:consent.*sms|sms.*consent)[\s:]*([yn]es?|no)/i,
      privacy: /(?:privacy policy|agree.*privacy)[\s:]*([yn]es?|no)/i,
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
      }
    }

    // Only return if we have some meaningful data
    const hasData = extractedData.first_name || extractedData.last_name || extractedData.applicant_email || extractedData.phone;
    
    if (hasData) {
      console.log('Extracted application data:', extractedData);
      return extractedData;
    }

    return null;
  } catch (error) {
    console.error('Error extracting application data:', error);
    return null;
  }
}