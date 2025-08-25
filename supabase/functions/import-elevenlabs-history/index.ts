import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zip code lookup utility
const lookupZipCode = async (zipCode: string) => {
  if (!zipCode || zipCode.length < 5) {
    return null;
  }

  // Clean zip code - take first 5 digits
  const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
  
  if (cleanZip.length !== 5) {
    return null;
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
    
    if (!response.ok) {
      console.warn(`Zip code lookup failed for ${cleanZip}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.places && data.places.length > 0) {
      const place = data.places[0];
      return {
        city: place['place name'],
        state: place['state'],
        stateAbbr: place['state abbreviation']
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error looking up zip code ${cleanZip}:`, error);
    return null;
  }
};

// Remove empty string/whitespace-only values from application payloads
function sanitizeApplicationData(data: Record<string, any>) {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) continue;
      cleaned[key] = trimmed;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId } = await req.json();
    
    console.log('Starting historic conversation import for agent:', agentId);
    // Sync disabled: no import will be performed
    return new Response(
      JSON.stringify({
        success: true,
        totalConversations: 0,
        processedConversations: 0,
        insertedApplications: 0,
        updatedApplications: 0,
        message: 'ElevenLabs history import is disabled'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
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
        const applicationData = await extractApplicationData(conversationDetail, conversation, supabase);
        
        if (applicationData) {
          const sanitized = sanitizeApplicationData(applicationData);
          applications.push(sanitized);
          processedCount++;
        }

      } catch (error) {
        console.error(`Error processing conversation ${conversation.conversation_id}:`, error);
        continue;
      }
    }

    // Insert or update applications in database (dedupe by phone)
    let insertedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    const normalizeDigits = (phone: string) => {
      const digits = (phone || '').replace(/\D/g, '');
      return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    };
    const formatDash = (digits: string) =>
      digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : digits;

    for (const appData of applications) {
      try {
        let existing: any = null;

        if (appData.phone) {
          const ten = normalizeDigits(appData.phone);
          const dash = formatDash(ten);
          const plus1 = `+1${ten}`;

          // Try to find an existing application matching common phone formats
          const { data: existingApp, error: findError } = await supabase
            .from('applications')
            .select('*')
            .or(`phone.eq.${dash},phone.eq.${ten},phone.eq.${plus1}`)
            .limit(1)
            .maybeSingle();

          if (!findError && existingApp) {
            existing = existingApp;
          }
        }

        if (existing) {
          // Merge: only fill empty fields on the existing record
          const updatableFields = ['first_name','last_name','applicant_email','zip','city','state','age','cdl','drug','veteran','consent','privacy','exp','months','job_id','job_listing_id','client','source','notes'];
          const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };

          for (const field of updatableFields) {
            const newVal = (appData as any)[field];
            const oldVal = (existing as any)[field];
            if ((newVal !== undefined && newVal !== null && String(newVal).trim() !== '') && (oldVal === null || oldVal === undefined || String(oldVal).trim() === '')) {
              updatePayload[field] = newVal;
            }
          }

          // Ensure phone saved in canonical dashed format if missing
          if ((!existing.phone || String(existing.phone).trim() === '') && appData.phone) {
            const ten = normalizeDigits(appData.phone);
            updatePayload.phone = formatDash(ten);
          }

          if (Object.keys(updatePayload).length > 1) {
            const { data, error } = await supabase
              .from('applications')
              .update(updatePayload)
              .eq('id', existing.id)
              .select()
              .single();

            if (error) {
              console.error('Database update error:', error);
              errors.push(error.message);
            } else {
              updatedCount++;
              console.log('Updated existing application:', data.id);
            }
          } else {
            console.log('No meaningful updates for existing application:', existing.id);
          }
        } else {
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
        }
      } catch (error: any) {
        console.error('Error upserting application:', error);
        errors.push(error.message || String(error));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalConversations: conversationsData.conversations?.length || 0,
        processedConversations: processedCount,
        insertedApplications: insertedCount,
        updatedApplications: updatedCount,
        errors: errors.length > 0 ? errors : null,
        message: `Imported ${insertedCount} new, updated ${updatedCount} existing from ${processedCount} conversations`
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

async function extractApplicationData(conversationDetail: any, conversation: any, supabase: any) {
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
        
        // Transform email addresses
        if (appField === 'applicant_email' && typeof value === 'string') {
          // Replace " at " with "@" in email addresses
          value = value.replace(/ at /gi, '@');
        }
        
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
    
    // Track if phone was sourced from transcript only (used to prevent bad inserts)
    let phoneFromTranscript = false;
    
    if (!hasStructured) {
      console.log('No structured data found or values are empty, trying transcript parsing (user messages only)...');
      
      // Helper to normalize a phone string to just digits for comparison
      const toDigits = (val: string) => (val || '').replace(/\D/g, '');
      const isTollFree = (digits: string) => /^(800|888|877|866|855|844|833|822)\d{7}$/.test(digits);
      
      // Known numbers from call metadata to ignore
      const agentNumber = toDigits(conversationDetail?.metadata?.phone_call?.agent_number || '');
      const externalNumber = toDigits(conversationDetail?.metadata?.phone_call?.external_number || '');
      
      // Build transcript using ONLY user messages when available
      let userTranscript = '';
      const collectFromArray = (arr: any[]) => arr
        .map((msg: any) => {
          if (typeof msg === 'string') return '';
          if (msg?.role === 'user') {
            return msg.message || msg.text || msg.content || '';
          }
          return '';
        })
        .filter(Boolean)
        .join(' ');
      
      if (Array.isArray(conversationDetail.transcript)) {
        userTranscript = collectFromArray(conversationDetail.transcript);
      } else if (Array.isArray(conversationDetail.messages)) {
        userTranscript = collectFromArray(conversationDetail.messages);
      }
      
      // If we couldn't isolate user-only transcript, fall back to string transcript (last resort)
      if (!userTranscript && typeof conversationDetail.transcript === 'string') {
        userTranscript = conversationDetail.transcript;
      }
      
      if (userTranscript) {
        console.log('Parsing user transcript:', userTranscript.substring(0, 200) + '...');
        
        // Fallback regex patterns for transcript parsing (user-only)
        const patterns = {
          applicant_email: /([a-zA-Z0-9._%+-]+\s*(?:@|\s+at\s+)\s*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
          phone: /(\+?1?[\s.-]?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/,
          zip: /(\b\d{5}(?:-\d{4})?\b)/,
        } as const;
        
        // Email
        const emailMatch = userTranscript.match(patterns.applicant_email);
        if (emailMatch && !extractedData.applicant_email) {
          const rawEmail = emailMatch[1].replace(/\s+/g, ' ').trim();
          const normalizedEmail = rawEmail.replace(/\s+at\s+/gi, '@');
          extractedData.applicant_email = normalizedEmail;
          console.log('Extracted from transcript applicant_email:', normalizedEmail);
        }
        
        // Phone
        const phoneMatch = userTranscript.match(patterns.phone);
        if (phoneMatch && !extractedData.phone) {
          const raw = phoneMatch[0];
          const digits = toDigits(raw);
          // Ignore if matches known agent/external numbers or toll-free
          if (digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))) {
            const tenDigits = digits.length === 11 ? digits.slice(1) : digits;
            if (tenDigits !== agentNumber.slice(-10) && tenDigits !== externalNumber.slice(-10) && !isTollFree(tenDigits)) {
              // Format as 303-210-6789 for consistency
              const formatted = `${tenDigits.slice(0,3)}-${tenDigits.slice(3,6)}-${tenDigits.slice(6)}`;
              extractedData.phone = formatted;
              phoneFromTranscript = true;
              console.log('Extracted from transcript phone:', formatted);
            }
          }
        }
        
        // ZIP
        const zipMatch = userTranscript.match(patterns.zip);
        if (zipMatch && !extractedData.zip) {
          extractedData.zip = zipMatch[1].trim();
          console.log('Extracted from transcript zip:', extractedData.zip);
        }
      }
    }
    
    // Lookup city/state from zip code if zip is provided but city/state are missing
    if (extractedData.zip && (!extractedData.city || !extractedData.state)) {
      console.log('Attempting zip code lookup for:', extractedData.zip);
      const zipLookup = await lookupZipCode(extractedData.zip);
      
      if (zipLookup) {
        if (!extractedData.city) {
          extractedData.city = zipLookup.city;
          console.log('Set city from zip lookup:', zipLookup.city);
        }
        if (!extractedData.state) {
          extractedData.state = zipLookup.stateAbbr;
          console.log('Set state from zip lookup:', zipLookup.stateAbbr);
        }
      }
    }
    
    // Check if we have meaningful data
    const meaningfulFields = ['first_name','last_name','applicant_email','phone','zip','city','state','age','cdl','drug','veteran','consent','privacy','exp','months','job_id','job_listing_id','client'];
    let hasData = meaningfulFields.some((f) => extractedData[f] !== undefined && extractedData[f] !== null && extractedData[f] !== '');
    
    // If the ONLY field we captured is a phone from transcript, treat as not meaningful to avoid bad inserts
    const nonPhoneFieldsPresent = meaningfulFields.filter(f => f !== 'phone').some(f => extractedData[f] !== undefined && extractedData[f] !== null && extractedData[f] !== '');
    if (hasData && !nonPhoneFieldsPresent && phoneFromTranscript) {
      console.log('Only transcript-derived phone found; skipping as not meaningful.');
      hasData = false;
    }
    
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