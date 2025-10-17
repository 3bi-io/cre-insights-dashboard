import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  csv: string;
  organizationId: string;
}

interface ApplicationRow {
  job_listing_id?: string;
  first_name?: string;
  last_name?: string;
  applicant_email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  address_1?: string;
  address_2?: string;
  cdl?: string;
  cdl_class?: string;
  cdl_state?: string;
  exp?: string;
  education_level?: string;
  work_authorization?: string;
  status?: string;
  source?: string;
  notes?: string;
  age?: string;
  veteran?: string;
  hazmat_endorsement?: string;
  passport_card?: string;
  twic_card?: string;
  driving_experience_years?: string;
}

function parseCSV(csv: string): ApplicationRow[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: ApplicationRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: ApplicationRow = {};

    headers.forEach((header, index) => {
      const value = values[index];
      if (value && value !== '') {
        row[header as keyof ApplicationRow] = value;
      }
    });

    rows.push(row);
  }

  return rows;
}

function validateRow(row: ApplicationRow, rowNumber: number): string | null {
  // Required fields
  if (!row.job_listing_id) {
    return `Missing required field: job_listing_id`;
  }
  if (!row.first_name) {
    return `Missing required field: first_name`;
  }
  if (!row.last_name) {
    return `Missing required field: last_name`;
  }
  if (!row.applicant_email) {
    return `Missing required field: applicant_email`;
  }
  if (!row.phone) {
    return `Missing required field: phone`;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(row.applicant_email)) {
    return `Invalid email format: ${row.applicant_email}`;
  }

  // Validate UUID format for job_listing_id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(row.job_listing_id)) {
    return `Invalid job_listing_id format (must be UUID): ${row.job_listing_id}`;
  }

  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (!roleData) {
      throw new Error('Insufficient permissions. Only administrators can import applications.');
    }

    const { csv, organizationId }: ImportRequest = await req.json();

    console.log('Starting import for organization:', organizationId);

    // Parse CSV
    const rows = parseCSV(csv);
    console.log(`Parsed ${rows.length} rows from CSV`);

    const results = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because index starts at 0 and we skip header

      try {
        // Validate row
        const validationError = validateRow(row, rowNumber);
        if (validationError) {
          results.failed++;
          results.errors.push({ row: rowNumber, error: validationError });
          continue;
        }

        // Verify job listing exists and belongs to the organization
        const { data: jobListing, error: jobError } = await supabaseClient
          .from('job_listings')
          .select('id, organization_id')
          .eq('id', row.job_listing_id)
          .maybeSingle();

        if (jobError || !jobListing) {
          results.failed++;
          results.errors.push({ 
            row: rowNumber, 
            error: `Job listing not found: ${row.job_listing_id}` 
          });
          continue;
        }

        if (jobListing.organization_id !== organizationId) {
          results.failed++;
          results.errors.push({ 
            row: rowNumber, 
            error: `Job listing does not belong to your organization` 
          });
          continue;
        }

        // Prepare application data
        const applicationData: any = {
          job_listing_id: row.job_listing_id,
          first_name: row.first_name,
          last_name: row.last_name,
          full_name: `${row.first_name} ${row.last_name}`,
          applicant_email: row.applicant_email,
          phone: row.phone,
          status: row.status || 'pending',
          source: row.source || 'CSV Import',
          applied_at: new Date().toISOString(),
        };

        // Add optional fields if present
        if (row.city) applicationData.city = row.city;
        if (row.state) applicationData.state = row.state;
        if (row.zip) applicationData.zip = row.zip;
        if (row.address_1) applicationData.address_1 = row.address_1;
        if (row.address_2) applicationData.address_2 = row.address_2;
        if (row.cdl) applicationData.cdl = row.cdl;
        if (row.cdl_class) applicationData.cdl_class = row.cdl_class;
        if (row.cdl_state) applicationData.cdl_state = row.cdl_state;
        if (row.exp) applicationData.exp = row.exp;
        if (row.education_level) applicationData.education_level = row.education_level;
        if (row.work_authorization) applicationData.work_authorization = row.work_authorization;
        if (row.notes) applicationData.notes = row.notes;
        if (row.age) applicationData.age = row.age;
        if (row.veteran) applicationData.veteran = row.veteran;
        if (row.hazmat_endorsement) applicationData.hazmat_endorsement = row.hazmat_endorsement;
        if (row.passport_card) applicationData.passport_card = row.passport_card;
        if (row.twic_card) applicationData.twic_card = row.twic_card;
        if (row.driving_experience_years) {
          const years = parseInt(row.driving_experience_years);
          if (!isNaN(years)) {
            applicationData.driving_experience_years = years;
          }
        }

        // Insert application
        const { error: insertError } = await supabaseClient
          .from('applications')
          .insert(applicationData);

        if (insertError) {
          console.error(`Error inserting row ${rowNumber}:`, insertError);
          results.failed++;
          results.errors.push({ 
            row: rowNumber, 
            error: insertError.message 
          });
        } else {
          results.imported++;
        }
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        results.failed++;
        results.errors.push({ 
          row: rowNumber, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    console.log('Import complete:', results);

    return new Response(
      JSON.stringify(results),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Import function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: false,
        imported: 0,
        failed: 0,
        errors: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
