
// @ts-nocheck

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Phone number normalization utility
function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Handle empty or invalid inputs
  if (!digitsOnly || digitsOnly.length < 10) {
    return null;
  }

  // Handle US numbers
  if (digitsOnly.length === 10) {
    // 10 digits - add +1 country code
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // 11 digits starting with 1 - already has country code
    return `+${digitsOnly}`;
  } else if (digitsOnly.length === 11 && !digitsOnly.startsWith('1')) {
    // 11 digits not starting with 1 - assume it's a 10-digit number with extra digit
    return `+1${digitsOnly.slice(-10)}`;
  } else if (digitsOnly.length > 11) {
    // More than 11 digits - take last 10 and add +1
    return `+1${digitsOnly.slice(-10)}`;
  }

  // Fallback for edge cases
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const formData = await req.json();
    console.log('Received form data:', formData);

    // Determine experience level based on months
    const getExperienceLevel = (months: string) => {
      if (!months) return '';
      
      const monthsNum = parseInt(months);
      if (monthsNum < 3) {
        return 'Less than 3 months experience';
      } else {
        return 'More than 3 months experience';
      }
    };

    // Lookup city/state from zip code for consistency
    const lookupCityState = async (zipCode: string) => {
      if (!zipCode || zipCode.length < 5) {
        return { city: formData.city || '', state: formData.state || '' };
      }

      const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
      
      if (cleanZip.length !== 5) {
        return { city: formData.city || '', state: formData.state || '' };
      }

      try {
        const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
        
        if (!response.ok) {
          console.warn(`Zip code lookup failed for ${cleanZip}: ${response.status}`);
          return { city: formData.city || '', state: formData.state || '' };
        }

        const data = await response.json();
        
        if (data.places && data.places.length > 0) {
          const place = data.places[0];
          return {
            city: place['place name'],
            state: place['state abbreviation']
          };
        }
        
        return { city: formData.city || '', state: formData.state || '' };
      } catch (error) {
        console.error(`Error looking up zip code ${cleanZip}:`, error);
        return { city: formData.city || '', state: formData.state || '' };
      }
    };

    const { city, state } = await lookupCityState(formData.zip);

    // Get or create a job listing for the application
    let jobListingId = formData.job_listing_id;
    
    if (!jobListingId) {
      // Get the CR England organization ID
      const { data: crEnglandOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'cr-england')
        .single();
        
      if (crEnglandOrg) {
        // Find an active job listing for CR England
        const { data: activeJob } = await supabase
          .from('job_listings')
          .select('id')
          .eq('organization_id', crEnglandOrg.id)
          .eq('status', 'active')
          .limit(1)
          .single();
          
        if (activeJob) {
          jobListingId = activeJob.id;
        } else {
          // Create a default job listing if none exists
          const { data: defaultJob, error: jobError } = await supabase
            .from('job_listings')
            .insert({
              title: 'General Application',
              organization_id: crEnglandOrg.id,
              user_id: crEnglandOrg.id, // Temporary user_id, should be updated by admin
              category_id: (await supabase.from('job_categories').select('id').limit(1).single())?.data?.id,
              status: 'active'
            })
            .select('id')
            .single();
            
          if (!jobError && defaultJob) {
            jobListingId = defaultJob.id;
          }
        }
      }
    }

    // Map form data to applications table schema
    // Support both camelCase and snake_case field names
    const applicationData = {
      job_listing_id: jobListingId,
      first_name: formData.firstName || formData.first_name,
      last_name: formData.lastName || formData.last_name,
      applicant_email: formData.email || formData.applicant_email,
      phone: normalizePhoneNumber(formData.phone),
      city: city,
      state: state,
      zip: formData.zip,
      age: formData.over21,
      cdl: formData.cdl,
      exp: getExperienceLevel(formData.experience),
      drug: formData.drug,
      veteran: formData.veteran,
      employment_history: formData.employmentHistory,
      consent: formData.consent,
      privacy: formData.privacy,
      months: formData.experience,
      source: 'Direct Application',
      status: 'pending',
      applied_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert into applications table
    const { data, error } = await supabase
      .from('applications')
      .insert([applicationData])
      .select()
      .single();

    if (error) {
      console.error('Error inserting application:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to submit application', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Application submitted successfully:', data);

    return new Response(
      JSON.stringify({ 
        message: 'Application submitted successfully', 
        applicationId: data.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing application:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
