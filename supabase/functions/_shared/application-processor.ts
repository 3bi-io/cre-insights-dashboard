import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { createLogger } from './logger.ts';

const logger = createLogger('application-processor');

// Organization IDs
const HAYES_ORG_ID = '84214b48-7b51-45bc-ad7f-723bcf50466c';
const CR_ENGLAND_ORG_ID = '682af95c-e95a-4e21-8753-ddef7f8c1749';

// Job ID prefix → Organization mapping (5-digit prefixes)
// Used when source-based routing fails to catch misrouted applications
const JOB_ID_PREFIX_ORG_MAP: Record<string, string> = {
  // Hayes Recruiting clients
  '13979': HAYES_ORG_ID, // Danny Herman Trucking
  '13980': HAYES_ORG_ID, // Danny Herman Trucking
  '13934': HAYES_ORG_ID, // Day and Ross
  '13991': HAYES_ORG_ID, // Day and Ross
  '14086': HAYES_ORG_ID, // Pemberton Truck Lines Inc
  '14204': HAYES_ORG_ID, // Danny Herman Trucking
  '14230': HAYES_ORG_ID, // Pemberton Truck Lines Inc
  '14279': HAYES_ORG_ID, // Day and Ross
  '14280': HAYES_ORG_ID, // Day and Ross
  '14284': HAYES_ORG_ID, // Novco, Inc.
  '14294': HAYES_ORG_ID, // Pemberton Truck Lines Inc
  '14361': HAYES_ORG_ID, // New Hayes prefix (observed)
  '14496': HAYES_ORG_ID, // James Burg Trucking Company
  // CR England clients (ZipRecruiter-style job IDs)
  '14380': CR_ENGLAND_ORG_ID, // Dollar Tree
  '14382': CR_ENGLAND_ORG_ID, // Dollar Tree
  '14383': CR_ENGLAND_ORG_ID, // Dollar Tree
};

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
  '14361': '67cadf11-8cce-41c6-8e19-7d2bb0be3b03', // New Pemberton prefix
  // James Burg Trucking Company
  '14496': 'b2a29507-32a6-4f5e-85d6-a7e6ffac3c52',
};

// CR England Job ID → Client ID mapping (simple 2-3 digit IDs)
const CR_ENGLAND_JOB_ID_CLIENT_MAP: Record<string, string> = {
  // Sysco
  '13': 'e2619f0a-f111-4f6e-9c23-c5c618528b4a',
  // Family Dollar
  '328': '31bfde0f-8f96-4e88-9630-cc3a44910101',
  // Dollar Tree
  '338': '853d514a-bfe7-44f8-a02a-3f0b10e9642d',
  '361': '853d514a-bfe7-44f8-a02a-3f0b10e9642d',
  '371': '853d514a-bfe7-44f8-a02a-3f0b10e9642d',
  '882': '853d514a-bfe7-44f8-a02a-3f0b10e9642d',
  // Kroger
  '911': '0f406b8c-7eb7-4d84-b0d6-1e0ee287b20c',
};

// CR England 5-digit prefix → Client ID mapping (ZipRecruiter-style job IDs like "14380J14628")
const CR_ENGLAND_PREFIX_CLIENT_MAP: Record<string, string> = {
  // Dollar Tree
  '14380': '853d514a-bfe7-44f8-a02a-3f0b10e9642d',
  '14382': '853d514a-bfe7-44f8-a02a-3f0b10e9642d',
  '14383': '853d514a-bfe7-44f8-a02a-3f0b10e9642d',
};

/**
 * Infer organization from job_id prefix
 * Used when source-based routing fails (e.g., Direct Application)
 */
export const getOrganizationFromJobId = (jobId: string | undefined | null): string | null => {
  if (!jobId || typeof jobId !== 'string' || jobId.length < 5) {
    return null;
  }
  const prefix = jobId.substring(0, 5);
  return JOB_ID_PREFIX_ORG_MAP[prefix] || null;
};

/**
 * Get client ID from job_id for a specific organization
 * Supports Hayes (5-digit prefix), CR England (exact match + 5-digit prefix)
 */
export const getClientIdFromJobId = (
  jobId: string | undefined | null, 
  organizationId?: string
): string | null => {
  if (!jobId || typeof jobId !== 'string') {
    return null;
  }
  
  // Hayes: 5-digit prefix mapping
  if (organizationId === HAYES_ORG_ID && jobId.length >= 5) {
    const prefix = jobId.substring(0, 5);
    return HAYES_JOB_ID_CLIENT_MAP[prefix] || null;
  }
  
  // CR England: Try 5-digit prefix first (ZipRecruiter-style), then exact match
  if (organizationId === CR_ENGLAND_ORG_ID) {
    if (jobId.length >= 5) {
      const prefix = jobId.substring(0, 5);
      const prefixMatch = CR_ENGLAND_PREFIX_CLIENT_MAP[prefix];
      if (prefixMatch) return prefixMatch;
    }
    return CR_ENGLAND_JOB_ID_CLIENT_MAP[jobId] || null;
  }
  
  // Legacy: Try Hayes prefix matching without org context
  if (jobId.length >= 5) {
    const prefix = jobId.substring(0, 5);
    return HAYES_JOB_ID_CLIENT_MAP[prefix] || null;
  }
  
  return null;
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
): Promise<{ id: string; matchType: 'exact_uuid' | 'exact_job_id' | 'location_fallback' | 'created_from_job_id' | 'general_fallback' | 'created_general' } | null> => {
  const { jobListingId, jobId, jobTitle, organizationId, city, state, source } = params;
  
  // Determine client from job_id for supported organizations
  let clientId = params.clientId;
  if (!clientId && jobId) {
    const inferredClientId = getClientIdFromJobId(jobId, organizationId);
    if (inferredClientId) {
      logger.info('Inferred client from job_id', { 
        jobId, 
        clientId: inferredClientId,
        organizationId 
      });
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
    
    // Step 2b: Try matching by city+state within client if job_id not found
    // This handles cases where partner reference numbers don't match feed job_ids
    if (city && state && clientId) {
      const { data: locationMatch } = await supabase
        .from('job_listings')
        .select('id, title, job_id')
        .eq('organization_id', organizationId)
        .eq('client_id', clientId)
        .ilike('city', city)
        .ilike('state', state)
        .eq('status', 'active')
        .neq('title', 'General Application')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (locationMatch) {
        logger.info('Matched by city/state fallback', {
          originalJobId: jobId,
          matchedJobId: locationMatch.job_id,
          matchedListingId: locationMatch.id,
          matchedTitle: locationMatch.title,
          city,
          state
        });
        return { id: locationMatch.id, matchType: 'location_fallback' };
      }
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
          is_hidden: true, // Hide auto-created job listings from public view
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
          isHidden: true,
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
  applicationData: Record<string, unknown>
): Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }> => {
  const { data, error } = await supabase
    .from('applications')
    .insert(applicationData)
    .select()
    .single();

  return { data, error };
};
