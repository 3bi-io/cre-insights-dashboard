import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logger = createLogger('import-applications');

interface ImportRequest {
  csv: string;
  organizationId: string;
}

interface ApplicationRow {
  // Required fields
  job_listing_id?: string;
  first_name?: string;
  last_name?: string;
  applicant_email?: string;
  phone?: string;
  
  // Personal info
  middle_name?: string;
  prefix?: string;
  suffix?: string;
  full_name?: string;
  date_of_birth?: string;
  ssn?: string;
  age?: string;
  
  // Contact info
  secondary_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  preferred_contact_method?: string;
  
  // Address
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  
  // CDL info
  cdl?: string;
  cdl_class?: string;
  cdl_state?: string;
  cdl_expiration_date?: string;
  cdl_endorsements?: string;
  
  // Experience
  exp?: string;
  driving_experience_years?: string;
  accident_history?: string;
  violation_history?: string;
  
  // Education & Work
  education_level?: string;
  work_authorization?: string;
  employment_history?: string;
  
  // Military
  military_service?: string;
  military_branch?: string;
  military_start_date?: string;
  military_end_date?: string;
  veteran?: string;
  
  // Documents
  hazmat_endorsement?: string;
  passport_card?: string;
  twic_card?: string;
  
  // Medical
  medical_card_expiration?: string;
  dot_physical_date?: string;
  can_pass_drug_test?: string;
  can_pass_physical?: string;
  drug?: string;
  
  // Work preferences
  salary_expectations?: string;
  preferred_start_date?: string;
  willing_to_relocate?: string;
  can_work_nights?: string;
  can_work_weekends?: string;
  
  // Background
  convicted_felony?: string;
  felony_details?: string;
  over_21?: string;
  
  // Compliance
  consent?: string;
  background_check_consent?: string;
  consent_to_email?: string;
  consent_to_sms?: string;
  agree_privacy_policy?: string;
  privacy?: string;
  
  // Source & Status
  status?: string;
  source?: string;
  how_did_you_hear?: string;
  referral_source?: string;
  notes?: string;
  
  // Campaign tracking
  campaign_id?: string;
  ad_id?: string;
  adset_id?: string;
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

    logger.info('Starting import', { organizationId });

    // Parse CSV
    const rows = parseCSV(csv);
    logger.info('Parsed CSV rows', { rowCount: rows.length });

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
          full_name: row.full_name || `${row.first_name} ${row.last_name}`,
          applicant_email: row.applicant_email,
          phone: row.phone,
          status: row.status || 'pending',
          source: row.source || 'CSV Import',
          applied_at: new Date().toISOString(),
        };

        // Personal info
        if (row.middle_name) applicationData.middle_name = row.middle_name;
        if (row.prefix) applicationData.prefix = row.prefix;
        if (row.suffix) applicationData.suffix = row.suffix;
        if (row.date_of_birth) applicationData.date_of_birth = row.date_of_birth;
        if (row.ssn) applicationData.ssn = row.ssn;
        if (row.age) applicationData.age = row.age;
        
        // Contact info
        if (row.secondary_phone) applicationData.secondary_phone = row.secondary_phone;
        if (row.emergency_contact_name) applicationData.emergency_contact_name = row.emergency_contact_name;
        if (row.emergency_contact_phone) applicationData.emergency_contact_phone = row.emergency_contact_phone;
        if (row.emergency_contact_relationship) applicationData.emergency_contact_relationship = row.emergency_contact_relationship;
        if (row.preferred_contact_method) applicationData.preferred_contact_method = row.preferred_contact_method;
        
        // Address
        if (row.address_1) applicationData.address_1 = row.address_1;
        if (row.address_2) applicationData.address_2 = row.address_2;
        if (row.city) applicationData.city = row.city;
        if (row.state) applicationData.state = row.state;
        if (row.zip) applicationData.zip = row.zip;
        if (row.country) applicationData.country = row.country;
        
        // CDL info
        if (row.cdl) applicationData.cdl = row.cdl;
        if (row.cdl_class) applicationData.cdl_class = row.cdl_class;
        if (row.cdl_state) applicationData.cdl_state = row.cdl_state;
        if (row.cdl_expiration_date) applicationData.cdl_expiration_date = row.cdl_expiration_date;
        if (row.cdl_endorsements) {
          // Convert comma-separated or semicolon-separated string to array
          applicationData.cdl_endorsements = row.cdl_endorsements.split(/[,;]/).map(e => e.trim()).filter(e => e);
        }
        
        // Experience
        if (row.exp) applicationData.exp = row.exp;
        if (row.accident_history) applicationData.accident_history = row.accident_history;
        if (row.violation_history) applicationData.violation_history = row.violation_history;
        if (row.driving_experience_years) {
          const years = parseInt(row.driving_experience_years);
          if (!isNaN(years)) {
            applicationData.driving_experience_years = years;
          }
        }
        
        // Education & Work
        if (row.education_level) applicationData.education_level = row.education_level;
        if (row.work_authorization) applicationData.work_authorization = row.work_authorization;
        if (row.employment_history) {
          try {
            applicationData.employment_history = JSON.parse(row.employment_history);
          } catch {
            // If not valid JSON, store as single entry
            applicationData.employment_history = [{ description: row.employment_history }];
          }
        }
        
        // Military
        if (row.military_service) applicationData.military_service = row.military_service;
        if (row.military_branch) applicationData.military_branch = row.military_branch;
        if (row.military_start_date) applicationData.military_start_date = row.military_start_date;
        if (row.military_end_date) applicationData.military_end_date = row.military_end_date;
        if (row.veteran) applicationData.veteran = row.veteran;
        
        // Documents
        if (row.hazmat_endorsement) applicationData.hazmat_endorsement = row.hazmat_endorsement;
        if (row.passport_card) applicationData.passport_card = row.passport_card;
        if (row.twic_card) applicationData.twic_card = row.twic_card;
        
        // Medical
        if (row.medical_card_expiration) applicationData.medical_card_expiration = row.medical_card_expiration;
        if (row.dot_physical_date) applicationData.dot_physical_date = row.dot_physical_date;
        if (row.can_pass_drug_test) applicationData.can_pass_drug_test = row.can_pass_drug_test;
        if (row.can_pass_physical) applicationData.can_pass_physical = row.can_pass_physical;
        if (row.drug) applicationData.drug = row.drug;
        
        // Work preferences
        if (row.salary_expectations) applicationData.salary_expectations = row.salary_expectations;
        if (row.preferred_start_date) applicationData.preferred_start_date = row.preferred_start_date;
        if (row.willing_to_relocate) applicationData.willing_to_relocate = row.willing_to_relocate;
        if (row.can_work_nights) applicationData.can_work_nights = row.can_work_nights;
        if (row.can_work_weekends) applicationData.can_work_weekends = row.can_work_weekends;
        
        // Background
        if (row.convicted_felony) applicationData.convicted_felony = row.convicted_felony;
        if (row.felony_details) applicationData.felony_details = row.felony_details;
        if (row.over_21) applicationData.over_21 = row.over_21;
        
        // Compliance
        if (row.consent) applicationData.consent = row.consent;
        if (row.background_check_consent) applicationData.background_check_consent = row.background_check_consent;
        if (row.consent_to_email) applicationData.consent_to_email = row.consent_to_email;
        if (row.consent_to_sms) applicationData.consent_to_sms = row.consent_to_sms;
        if (row.agree_privacy_policy) applicationData.agree_privacy_policy = row.agree_privacy_policy;
        if (row.privacy) applicationData.privacy = row.privacy;
        
        // Source & tracking
        if (row.how_did_you_hear) applicationData.how_did_you_hear = row.how_did_you_hear;
        if (row.referral_source) applicationData.referral_source = row.referral_source;
        if (row.notes) applicationData.notes = row.notes;
        if (row.campaign_id) applicationData.campaign_id = row.campaign_id;
        if (row.ad_id) applicationData.ad_id = row.ad_id;
        if (row.adset_id) applicationData.adset_id = row.adset_id;

        // Insert application
        const { error: insertError } = await supabaseClient
          .from('applications')
          .insert(applicationData);

        if (insertError) {
          logger.error('Error inserting row', insertError, { rowNumber });
          results.failed++;
          results.errors.push({
            row: rowNumber, 
            error: insertError.message 
          });
        } else {
          results.imported++;
        }
      } catch (error) {
        logger.error('Error processing row', error, { rowNumber });
        results.failed++;
        results.errors.push({ 
          row: rowNumber, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    logger.info('Import complete', { imported: results.imported, failed: results.failed });

    return new Response(
      JSON.stringify(results),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    logger.error('Import function error', error);
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
