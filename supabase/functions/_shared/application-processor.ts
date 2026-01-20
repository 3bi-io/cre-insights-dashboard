// @ts-nocheck
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from './logger.ts';

const logger = createLogger('application-processor');

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
 * Returns job listing ID or null if unable to create
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
): Promise<string | null> => {
  let { jobListingId, jobId, jobTitle, organizationId, clientId, city, state, source } = params;

  // Step 1: If job_listing_id provided, use it
  if (jobListingId) {
    return jobListingId;
  }

  // Step 2: Try to match by job_id text field
  if (jobId) {
    const query = supabase
      .from('job_listings')
      .select('id')
      .eq('job_id', jobId)
      .eq('organization_id', organizationId);
    
    if (clientId) {
      query.eq('client_id', clientId);
    }
    
    const { data: jobListing } = await query.maybeSingle();
    
    if (jobListing) {
      logger.info('Matched job_id to listing', { jobId, listingId: jobListing.id });
      return jobListing.id;
    }
  }

  // Step 3: Find any active job for this organization
  const activeQuery = supabase
    .from('job_listings')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .limit(1);
  
  if (clientId) {
    activeQuery.eq('client_id', clientId);
  }
  
  const { data: activeJob } = await activeQuery.maybeSingle();
  
  if (activeJob) {
    logger.info('Using active job listing', { listingId: activeJob.id });
    return activeJob.id;
  }

  // Step 4: Create new job if we have title
  if (jobTitle) {
    const { data: categories } = await supabase
      .from('job_categories')
      .select('id')
      .limit(1);
    
    if (categories?.[0]?.id) {
      const { data: newJob } = await supabase
        .from('job_listings')
        .insert({
          title: jobTitle,
          job_id: jobId,
          organization_id: organizationId,
          client_id: clientId,
          category_id: categories[0].id,
          status: 'active',
          job_summary: `Position from ${source || 'application'}`,
          location: city && state ? `${city}, ${state}` : null,
          city,
          state,
        })
        .select('id')
        .single();
      
      if (newJob) {
        logger.info('Created job listing', { listingId: newJob.id, jobId });
        return newJob.id;
      }
    }
  }

  // Step 5: Fallback to General Application
  const { data: fallbackJob } = await supabase
    .from('job_listings')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('title', 'General Application')
    .maybeSingle();
  
  if (fallbackJob) {
    logger.info('Using General Application fallback');
    return fallbackJob.id;
  }

  // Step 6: Create General Application if doesn't exist
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
      logger.info('Created General Application fallback');
      return newFallback.id;
    }
  }

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
