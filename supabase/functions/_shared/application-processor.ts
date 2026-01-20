// @ts-nocheck
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from './logger.ts';

const logger = createLogger('application-processor');

// Hayes Recruiting Solutions organization ID
const HAYES_ORG_ID = '84214b48-7b51-45bc-ad7f-723bcf50466c';

// Job ID prefix → Client ID mapping for Hayes organization (CDL Job Cast integration)
// Each 5-digit prefix maps to a specific client within Hayes
const HAYES_JOB_ID_CLIENT_MAP: Record<string, string> = {
  // Danny Herman Trucking
  '13979': '1d54e463-4d7f-4a05-8189-3e33d0586dea',
  '13980': '1d54e463-4d7f-4a05-8189-3e33d0586dea',
  '14204': '1d54e463-4d7f-4a05-8189-3e33d0586dea',
  // Day and Ross
  '13934': '30ab5f68-258c-4e81-8217-1123c4536259',
  '13991': '30ab5f68-258c-4e81-8217-1123c4536259',
  '14279': '30ab5f68-258c-4e81-8217-1123c4536259',
  '14280': '30ab5f68-258c-4e81-8217-1123c4536259',
  // Novco, Inc.
  '14284': '4a9ef1df-dcc9-499c-999a-446bb9a329fc',
  // Pemberton Truck Lines Inc
  '14086': '67cadf11-8cce-41c6-8e19-7d2bb0be3b03',
  '14230': '67cadf11-8cce-41c6-8e19-7d2bb0be3b03',
  '14294': '67cadf11-8cce-41c6-8e19-7d2bb0be3b03',
};

/**
 * Get client ID from job_id prefix for Hayes organization
 */
export const getClientIdFromJobId = (jobId: string | undefined | null): string | null => {
  if (!jobId || typeof jobId !== 'string' || jobId.length < 5) {
    return null;
  }
  const prefix = jobId.substring(0, 5);
  return HAYES_JOB_ID_CLIENT_MAP[prefix] || null;
};

/**
 * Normalize phone number to E.164 format (+1XXXXXXXXXX)
 */
export const normalizePhone = (phone: string | undefined | null): string | null => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }
  
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length < 10) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  if (digits.length === 11 && digits[0] !== '1') return `+1${digits.slice(-10)}`;
  if (digits.length > 11) return `+1${digits.slice(-10)}`;
  
  return null;
};

/**
 * Find or create job listing for application
 * 
 * Resolution priority:
 * 1. Explicit job_listing_id (UUID) - use directly
 * 2. Match by job_id text field within organization
 * 3. If job_id provided but not matched - CREATE new listing for that job_id
 * 4. General Application fallback (find or create)
 * 
 * NOTE: We no longer fall back to "any active job" to prevent mismatched applications
 */
export const findOrCreateJobListing = async (
  supabase: SupabaseClient,
  params: {
    jobListingId?: string;
    jobId?: string;
    jobTitle?: string;
    organizationId: string;
    clientId?: string | null;
    city?: string;
    state?: string;
    source?: string;
  }
): Promise<{ id: string; matchType: 'exact_uuid' | 'exact_job_id' | 'created_from_job_id' | 'general_fallback' | 'created_general' } | null> => {
  const { jobListingId, jobId, jobTitle, organizationId, city, state, source } = params;
  
  // For Hayes organization, determine client from job_id prefix if not explicitly provided
  let clientId = params.clientId;
  if (organizationId === HAYES_ORG_ID && !clientId && jobId) {
    const inferredClientId = getClientIdFromJobId(jobId);
    if (inferredClientId) {
      logger.info('Inferred client from job_id prefix', { jobId, clientId: inferredClientId });
      clientId = inferredClientId;
    }
  }

  // Step 1: If job_listing_id (UUID) provided, use it directly
  if (jobListingId) {
    logger.info('Using explicit job_listing_id', { jobListingId });
    return { id: jobListingId, matchType: 'exact_uuid' };
  }

  // Step 2: Try to match by job_id text field
  if (jobId) {
    const query = supabase
      .from('job_listings')
      .select('id, title')
      .eq('job_id', jobId)
      .eq('organization_id', organizationId);
    
    if (clientId) {
      query.eq('client_id', clientId);
    }
    
    const { data: jobListing } = await query.maybeSingle();
    
    if (jobListing) {
      logger.info('Matched job_id to existing listing', { 
        jobId, 
        listingId: jobListing.id,
        title: jobListing.title 
      });
      return { id: jobListing.id, matchType: 'exact_job_id' };
    }
    
    // Step 3: job_id provided but not matched - CREATE new listing for this job_id
    // This ensures each unique external job_id gets its own listing
    logger.info('No match for job_id - creating new listing', { jobId, organizationId });
    
    const { data: categories } = await supabase
      .from('job_categories')
      .select('id')
      .limit(1);
    
    if (categories?.[0]?.id) {
      const newTitle = jobTitle || `Job ${jobId}`;
      const { data: newJob, error: createError } = await supabase
        .from('job_listings')
        .insert({
          title: newTitle,
          job_id: jobId,
          organization_id: organizationId,
          client_id: clientId,
          category_id: categories[0].id,
          status: 'active',
          job_summary: `Position ${jobId} from ${source || 'application'}`,
          location: city && state ? `${city}, ${state}` : null,
          city,
          state,
        })
        .select('id')
        .single();
      
      if (newJob) {
        logger.info('Created new job listing from job_id', { 
          listingId: newJob.id, 
          jobId,
          title: newTitle,
          source 
        });
        return { id: newJob.id, matchType: 'created_from_job_id' };
      }
      
      if (createError) {
        logger.error('Failed to create job listing from job_id', { jobId, error: createError });
      }
    }
  }

  // Step 4: Fallback to General Application (find existing)
  const { data: fallbackJob } = await supabase
    .from('job_listings')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('title', 'General Application')
    .maybeSingle();
  
  if (fallbackJob) {
    logger.info('Using General Application fallback', { 
      listingId: fallbackJob.id,
      reason: jobId ? 'job_id creation failed' : 'no job identifier provided'
    });
    return { id: fallbackJob.id, matchType: 'general_fallback' };
  }

  // Step 5: Create General Application if doesn't exist
  const { data: categories } = await supabase
    .from('job_categories')
    .select('id')
    .limit(1);
  
  if (categories?.[0]?.id) {
    const { data: newFallback } = await supabase
      .from('job_listings')
      .insert({
        title: 'General Application',
        organization_id: organizationId,
        category_id: categories[0].id,
        status: 'active',
        job_summary: 'General applications',
      })
      .select('id')
      .single();
    
    if (newFallback) {
      logger.info('Created General Application fallback', { listingId: newFallback.id });
      return { id: newFallback.id, matchType: 'created_general' };
    }
  }

  logger.error('Failed to resolve or create any job listing', { organizationId, jobId });
  return null;
};

/**
 * Find client by name or slug
 */
export const findClientByIdentifier = async (
  supabase: SupabaseClient,
  organizationId: string,
  clientIdentifier?: string
): Promise<string | null> => {
  if (!clientIdentifier) {
    return null;
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('organization_id', organizationId)
    .or(`name.ilike.%${clientIdentifier}%,company.ilike.%${clientIdentifier}%`)
    .maybeSingle();

  if (client) {
    logger.info('Matched client', { name: client.name, id: client.id });
    return client.id;
  }

  logger.warn('Client not found for identifier', { clientIdentifier });
  return null;
};

/**
 * Insert application record
 */
export const insertApplication = async (
  supabase: SupabaseClient,
  applicationData: any
): Promise<{ data: any; error: any }> => {
  const { data, error } = await supabase
    .from('applications')
    .insert(applicationData)
    .select()
    .single();

  return { data, error };
};
