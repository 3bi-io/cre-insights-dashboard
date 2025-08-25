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
    const { agentId, action, jobContext } = body;
    
    console.log('Received request:', { agentId, action, jobContext, body });
    
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
    let url = `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`;
    
    // If job context is provided, we'll include it in the conversation metadata
    if (jobContext) {
      console.log('Job context provided:', jobContext);
      // We'll store this to pass to the agent after connection
    }
    
    const response = await fetch(url, {
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
        success: true,
        jobContext: jobContext || null
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

// Phone number normalization utility
const normalizePhoneNumber = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle different phone number formats
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Remove leading 1 for US numbers
    return cleaned.substring(1);
  } else if (cleaned.length === 10) {
    return cleaned;
  } else if (cleaned.length === 7) {
    // Assume local number, might need area code
    return cleaned;
  }
  
  // Return original if we can't normalize it
  return phone;
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

async function handleDataCollection(data: any) {
  try {
    console.log('Handling data collection:', data);
    // Sync disabled: do not store applications
    return new Response(
      JSON.stringify({
        success: true,
        message: 'ElevenLabs application syncing is disabled',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract collected data from the voice agent
    const collectedData = data.collectedData || {};
    
    // Handle multiple field name mappings (new conversation flow and legacy)
    const firstName = collectedData.firstName || collectedData.GivenName || '';
    const lastName = collectedData.lastName || collectedData.FamilyName || '';
    const rawPhone = collectedData.cellPhone || collectedData.PrimaryPhone || '';
    const email = collectedData.email || collectedData.InternetEmailAddress || null; // Email is now optional
    const zipCode = collectedData.zipCode || collectedData.PostalCode || '';
    const city = collectedData.city || collectedData.Municipality || '';
    const state = collectedData.state || collectedData.Region || '';
    
    // Normalize phone number and validate it's provided (required field)
    const normalizedPhone = normalizePhoneNumber(rawPhone);
    if (!normalizedPhone) {
      throw new Error('Phone number is required and must be valid');
    }
    
    // Map the collected data to application fields
    let applicationData = {
      first_name: firstName,
      last_name: lastName,
      applicant_email: email, // Can be null/empty now
      phone: normalizedPhone, // Normalized and validated
      city: city,
      state: state,
      zip: zipCode,
      over_21: collectedData.isOver21 || collectedData.over_21 || '',
      cdl: collectedData.hasClassACDL || collectedData.Class_A_CDL || '',
      experience: collectedData.drivingExperienceMonths || collectedData.Class_A_CDL_experience || '',
      drug: collectedData.canPassDrugTest || collectedData.can_pass_drug || '',
      veteran: collectedData.hasServedMilitary || collectedData.Veteran_Status || '',
      consent: collectedData.consentGiven || collectedData.consentToSMS || '',
      privacy: collectedData.consentGiven || collectedData.agree_privacy_policy || '', // Use same consent for privacy
      source: 'ElevenLabs Voice Agent',
      status: 'pending',
      applied_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Add job context if provided
      job_listing_id: data.jobContext?.jobId || null,
      notes: data.jobContext ? `Applied via voice for: ${data.jobContext.jobTitle}` : 'Applied via voice agent'
    };

    // Lookup city/state from zip code if zip is provided but city/state are missing
    if (applicationData.zip && (!applicationData.city || !applicationData.state)) {
      console.log('Attempting zip code lookup for:', applicationData.zip);
      const zipLookup = await lookupZipCode(applicationData.zip);
      
      if (zipLookup) {
        if (!applicationData.city) {
          applicationData.city = zipLookup.city;
          console.log('Set city from zip lookup:', zipLookup.city);
        }
        if (!applicationData.state) {
          applicationData.state = zipLookup.stateAbbr;
          console.log('Set state from zip lookup:', zipLookup.stateAbbr);
        }
      }
    }

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