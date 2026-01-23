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
/**
 * Helper to get a user_id for job creation (required field)
 * Returns the first organization member's user_id from user_roles table
 */
const getOrganizationUserId = async (
  supabase: SupabaseClient,
  organizationId: string
): Promise<string | null> => {
  // First try user_roles table
  const { data: role } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('organization_id', organizationId)
    .limit(1)
    .maybeSingle();
  
  if (role?.user_id) {
    return role.user_id;
  }
  
  // Fallback: get user_id from an existing job listing in this org
  const { data: existingJob } = await supabase
    .from('job_listings')
    .select('user_id')
    .eq('organization_id', organizationId)
    .not('user_id', 'is', null)
    .limit(1)
    .maybeSingle();
  
  return existingJob?.user_id || null;
};

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
    
    // Get a user_id for the job listing (required field)
    const userId = await getOrganizationUserId(supabase, organizationId);
    if (!userId) {
      logger.error('No organization member found for job creation', { organizationId });
      return null;
    }
    
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
          user_id: userId,
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
        logger.error('Failed to create job listing from job_id', { 
          jobId, 
          errorMessage: createError.message,
          errorCode: createError.code 
        });
      }
    }
  }

  // Step 4: Fallback to General Application (find existing)
  // First try client-specific, then organization-wide
  let fallbackQuery = supabase
    .from('job_listings')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('title', 'General Application');
  
  if (clientId) {
    fallbackQuery = fallbackQuery.eq('client_id', clientId);
  }
  
  const { data: clientFallback } = await fallbackQuery.maybeSingle();
  
  if (clientFallback) {
    logger.info('Using client-specific General Application fallback', { 
      listingId: clientFallback.id,
      clientId,
      reason: jobId ? 'job_id creation failed' : 'no job identifier provided'
    });
    return { id: clientFallback.id, matchType: 'general_fallback' };
  }
  
  // If no client-specific fallback, try org-wide (only if clientId was provided)
  if (clientId) {
    const { data: orgFallback } = await supabase
      .from('job_listings')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('title', 'General Application')
      .is('client_id', null)
      .maybeSingle();
    
    if (orgFallback) {
      logger.info('Using organization-wide General Application fallback', { 
        listingId: orgFallback.id,
        reason: jobId ? 'job_id creation failed' : 'no job identifier provided'
      });
      return { id: orgFallback.id, matchType: 'general_fallback' };
    }
  }

  // Step 5: Create General Application if doesn't exist
  // First get a user_id for the job listing (required field)
  const userId = await getOrganizationUserId(supabase, organizationId);
  if (!userId) {
    logger.error('No organization member found for General Application creation', { organizationId });
    return null;
  }
  
  const { data: categories } = await supabase
    .from('job_categories')
    .select('id')
    .limit(1);
  
  if (categories?.[0]?.id) {
    const insertData: Record<string, unknown> = {
      title: 'General Application',
      organization_id: organizationId,
      category_id: categories[0].id,
      status: 'active',
      is_hidden: true, // Hide General Applications from public view
      job_summary: clientId ? 'General applications for this carrier' : 'General applications',
      user_id: userId,
    };
    
    // Include client_id if available to create client-specific fallback
    if (clientId) {
      insertData.client_id = clientId;
    }
    
    const { data: newFallback, error: createError } = await supabase
      .from('job_listings')
      .insert(insertData)
      .select('id')
      .single();
    
    if (newFallback) {
      logger.info('Created General Application fallback', { 
        listingId: newFallback.id,
        clientId,
        clientSpecific: !!clientId
      });
      return { id: newFallback.id, matchType: 'created_general' };
    }
    
    if (createError) {
      logger.error('Failed to create General Application', { 
        errorMessage: createError.message,
        errorCode: createError.code,
        organizationId,
        clientId
      });
    }
  }

  logger.error('Failed to resolve or create any job listing', { organizationId, jobId, clientId });
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
