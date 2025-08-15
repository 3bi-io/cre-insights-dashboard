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
    
    // Look for structured data in different possible locations
    let structuredData: any = {};
    
    // Check if there's structured form data or agent responses
    if (conversationDetail.agent_responses) {
      console.log('Found agent_responses:', conversationDetail.agent_responses);
      structuredData = conversationDetail.agent_responses;
    }
    
    if (conversationDetail.user_data) {
      console.log('Found user_data:', conversationDetail.user_data);
      structuredData = { ...structuredData, ...conversationDetail.user_data };
    }
    
    if (conversationDetail.collected_data) {
      console.log('Found collected_data:', conversationDetail.collected_data);
      structuredData = { ...structuredData, ...conversationDetail.collected_data };
    }
    
    if (conversationDetail.form_data) {
      console.log('Found form_data:', conversationDetail.form_data);
      structuredData = { ...structuredData, ...conversationDetail.form_data };
    }
    
    // Check for data in the conversation summary or results
    if (conversationDetail.summary && conversationDetail.summary.extracted_data) {
      console.log('Found summary extracted_data:', conversationDetail.summary.extracted_data);
      structuredData = { ...structuredData, ...conversationDetail.summary.extracted_data };
    }
    
    // Check for data in analysis results
    if (conversationDetail.analysis) {
      console.log('Found analysis:', conversationDetail.analysis);
      structuredData = { ...structuredData, ...conversationDetail.analysis };
      // Flatten ElevenLabs analysis.data_collection_results -> { field: value }
      if (conversationDetail.analysis.data_collection_results && typeof conversationDetail.analysis.data_collection_results === 'object') {
        const dcr = conversationDetail.analysis.data_collection_results as Record<string, any>;
        const flattened: Record<string, any> = {};
        for (const [key, entry] of Object.entries(dcr)) {
          if (entry && typeof entry === 'object' && 'value' in entry) {
            flattened[key] = (entry as any).value;
          }
        }
        structuredData = { ...structuredData, ...flattened };
      }
    }
    
    // Also check the conversation itself for any stored data
    if (conversation.metadata) {
      console.log('Found conversation metadata:', conversation.metadata);
      structuredData = { ...structuredData, ...conversation.metadata };
    }
    console.log('Combined structured data:', structuredData);
    
    // Initialize application data with defaults
    const extractedData: any = {
      source: 'ElevenLabs Voice Agent (Historic)',
      status: 'pending',
      applied_at: conversation.created_at || new Date().toISOString(),
      created_at: conversation.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Direct field mappings from ElevenLabs structured data
    const fieldMappings = {
      // Email
      'InternetEmailAddress': 'applicant_email',
      'email': 'applicant_email',
      'emailAddress': 'applicant_email',
      
      // Names
      'GivenName': 'first_name',
      'firstName': 'first_name',
      'first_name': 'first_name',
      'FamilyName': 'last_name',
      'lastName': 'last_name',
      'last_name': 'last_name',
      
      // Phone
      'PrimaryPhone': 'phone',
      'phoneNumber': 'phone',
      'phone': 'phone',
      
      // Address
      'PostalCode': 'zip',
      'zipCode': 'zip',
      'zip': 'zip',
      'Municipality': 'city',
      'city': 'city',
      'Region': 'state',
      'state': 'state',
      
      // Job Information
      'JobTitle': 'job_title',
      'Position': 'job_title',
      'job_title': 'job_title',
      'jobTitle': 'job_title',
      
      // Boolean fields - map to Yes/No strings
      'over_21': 'age',
      'age': 'age',
      'Class_A_CDL': 'cdl',
      'cdl': 'cdl',
      'can_pass_drug': 'drug',
      'drugTest': 'drug',
      'Veteran_Status': 'veteran',
      'veteran': 'veteran',
      'consentToSMS': 'consent',
      'smsConsent': 'consent',
      'agree_privacy_policy': 'privacy',
      'privacyPolicy': 'privacy',
      
      // Experience
      'Class_A_CDL_experience': 'exp',
      'experience': 'exp',
      'months': 'months',
      'years': 'exp',
    };

    // Map structured data to application fields
    for (const [elevenLabsField, appField] of Object.entries(fieldMappings)) {
      if (structuredData[elevenLabsField] !== undefined && structuredData[elevenLabsField] !== null) {
        let value = structuredData[elevenLabsField];
        
        // Convert boolean values to Yes/No strings for certain fields
        if (['age', 'cdl', 'drug', 'veteran', 'consent', 'privacy'].includes(appField)) {
          if (typeof value === 'boolean') {
            value = value ? 'Yes' : 'No';
          } else if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === 'y') {
              value = 'Yes';
            } else if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === 'n') {
              value = 'No';
            }
          }
        }
        
        extractedData[appField] = value;
        console.log(`Mapped ${elevenLabsField} -> ${appField}:`, value);
      }
    }
    
    // Look up job listing if we have a job title
    let jobListing = null;
    if (extractedData.job_title) {
      console.log('Looking up job listing for title:', extractedData.job_title);
      const { data: jobData, error: jobError } = await supabase
        .from('job_listings')
        .select('id, job_id, title, job_title, client, client_id')
        .or(`title.ilike.%${extractedData.job_title}%,job_title.ilike.%${extractedData.job_title}%`)
        .limit(1)
        .single();
      
      if (!jobError && jobData) {
        jobListing = jobData;
        extractedData.job_listing_id = jobData.id;
        extractedData.job_id = jobData.job_id;
        extractedData.client = jobData.client;
        console.log('Found matching job listing:', jobData);
      } else {
        console.log('No matching job listing found for:', extractedData.job_title);
      }
    }
    
    // Also try to parse any transcript if structured data is not available
    const hasStructured = ['applicant_email','first_name','last_name','phone','zip','city','state','age','cdl','drug','veteran','consent','privacy','exp','months','job_title'].some((f) => extractedData[f] !== undefined && extractedData[f] !== null && extractedData[f] !== '');
    if (!hasStructured) {
      console.log('No structured data found or values are empty, trying transcript parsing...');
      
      let transcript = '';
      if (conversationDetail.transcript && typeof conversationDetail.transcript === 'string') {
        transcript = conversationDetail.transcript;
      } else if (conversationDetail.transcript && Array.isArray(conversationDetail.transcript)) {
        transcript = (conversationDetail.transcript as any[])
          .map((msg: any) => {
            if (typeof msg === 'string') return msg;
            if (msg.message) return msg.message;
            if (msg.text) return msg.text;
            if (msg.content) return msg.content;
            return '';
          })
          .filter(Boolean)
          .join(' ');
      } else if (conversationDetail.messages && Array.isArray(conversationDetail.messages)) {
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
      }
      
      if (transcript) {
        console.log('Parsing transcript:', transcript.substring(0, 200) + '...');
        
        // Fallback regex patterns for transcript parsing
        const patterns = {
          applicant_email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
          phone: /(\d{3}[-\s]?\d{3}[-\s]?\d{4})/i,
          zip: /(\d{5}(?:-\d{4})?)/i,
        };
        
        for (const [field, pattern] of Object.entries(patterns)) {
          const match = transcript.match(pattern);
          if (match && match[1] && !extractedData[field]) {
            extractedData[field] = match[1].trim();
            console.log(`Extracted from transcript ${field}:`, match[1]);
          }
        }
      }
    }

    // Check if we have meaningful data
    const meaningfulFields = ['first_name','last_name','applicant_email','phone','zip','city','state','age','cdl','drug','veteran','consent','privacy','exp','months','job_id','job_listing_id','client'];
    const hasData = meaningfulFields.some((f) => extractedData[f] !== undefined && extractedData[f] !== null && extractedData[f] !== '');
    
    if (hasData) {
      console.log('Successfully extracted application data:', extractedData);
      return extractedData;
    } else {
      console.log('No meaningful application data found');
      return null;
    }

  } catch (error) {
    console.error('Error extracting application data:', error);
    return null;
  }
}