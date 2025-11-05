// @ts-nocheck

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  normalizePhone, 
  findOrCreateJobListing, 
  insertApplication 
} from "../_shared/application-processor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get the CR England organization ID
    const { data: crEnglandOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'cr-england')
      .single();

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

    // Get or create a job listing for the application using shared processor
    const jobListingId = await findOrCreateJobListing(supabase, {
      jobListingId: formData.job_listing_id,
      jobId: formData.job_id,
      jobTitle: 'General Application',
      organizationId: crEnglandOrg?.id || '',
      clientId: null,
      city,
      state,
      source: 'Direct Application',
    });

    // Map form data to applications table schema
    // Support both camelCase and snake_case field names
    const applicationData = {
      job_listing_id: jobListingId,
      first_name: formData.firstName || formData.first_name,
      last_name: formData.lastName || formData.last_name,
      applicant_email: formData.email || formData.applicant_email,
      phone: normalizePhone(formData.phone),
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

    // Insert into applications table using shared processor
    const { data, error } = await insertApplication(supabase, applicationData);

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
