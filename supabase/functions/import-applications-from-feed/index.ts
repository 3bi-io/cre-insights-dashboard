// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { applications, organizationId } = await req.json();
    
    if (!applications || !Array.isArray(applications)) {
      throw new Error('Invalid applications data');
    }

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    console.log(`Importing ${applications.length} applications for organization:`, organizationId);

    // Get or create a default job listing for Hayes
    let jobListingId;
    const { data: existingJobs, error: fetchError } = await supabase
      .from('job_listings')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('title', 'CDL Driver - General Application')
      .limit(1)
      .single();

    if (existingJobs) {
      jobListingId = existingJobs.id;
      console.log('Using existing job listing:', jobListingId);
    } else {
      // Create a default job listing for applications
      const { data: newJob, error: createError } = await supabase
        .from('job_listings')
        .insert({
          title: 'CDL Driver - General Application',
          description: 'General application for CDL drivers',
          organization_id: organizationId,
          status: 'active',
          city: 'Various',
          state: 'US',
          platform_id: (await supabase.from('platforms').select('id').eq('name', 'CDL Job Cast').single()).data?.id
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating job listing:', createError);
        throw createError;
      }

      jobListingId = newJob.id;
      console.log('Created new job listing:', jobListingId);
    }

    // Normalize phone numbers
    const normalizePhone = (phone: string | null | undefined): string | null => {
      if (!phone) return null;
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10) return `+1${digits}`;
      if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
      return null;
    };

    // Process applications
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const app of applications) {
      try {
        // Skip if missing critical data
        if (!app.applicant_email && !app.phone) {
          skipped++;
          console.log('Skipping application: no email or phone');
          continue;
        }

        const applicationData = {
          job_listing_id: jobListingId,
          first_name: app.first_name || '',
          last_name: app.last_name || '',
          applicant_email: app.applicant_email || null,
          phone: normalizePhone(app.phone),
          city: app.city || null,
          state: app.state || null,
          zip: app.zip || null,
          cdl: app.cdl || null,
          exp: app.exp || null,
          age: app.age || null,
          education_level: app.education_level || null,
          work_authorization: app.work_authorization || null,
          source: app.source || 'CDL Job Cast',
          notes: app.notes || null,
          status: 'pending',
          applied_at: app.date || new Date().toISOString()
        };

        // Check for duplicate by email or phone
        const { data: existing } = await supabase
          .from('applications')
          .select('id')
          .eq('job_listing_id', jobListingId)
          .or(`applicant_email.eq.${applicationData.applicant_email},phone.eq.${applicationData.phone}`)
          .limit(1)
          .single();

        if (existing) {
          skipped++;
          console.log('Skipping duplicate application:', applicationData.applicant_email || applicationData.phone);
          continue;
        }

        const { error: insertError } = await supabase
          .from('applications')
          .insert(applicationData);

        if (insertError) {
          errors.push(`Failed to import ${app.applicant_email || app.phone}: ${insertError.message}`);
          console.error('Insert error:', insertError);
          continue;
        }

        imported++;
      } catch (err) {
        errors.push(`Error processing application: ${err.message}`);
        console.error('Processing error:', err);
      }
    }

    const message = `Imported ${imported} applications, skipped ${skipped} duplicates`;
    console.log(message);

    return new Response(
      JSON.stringify({
        success: true,
        message,
        total: applications.length,
        imported,
        skipped,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error importing applications:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
