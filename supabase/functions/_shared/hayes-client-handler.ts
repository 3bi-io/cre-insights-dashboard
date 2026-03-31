/**
 * Hayes Client Inbound Handler Factory
 * 
 * Creates client-specific handlers for Hayes Recruiting clients.
 * Each client gets a dedicated endpoint that pre-configures routing
 * to their specific jobs and applies client-specific UTM tracking.
 */

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2.50.0';
import { getCorsHeaders, handleCorsPreflightIfNeeded } from './cors-config.ts';
import { successResponse, errorResponse } from './response.ts';
import { createLogger } from './logger.ts';
import { wrapHandler } from './error-handler.ts';
import { findOrCreateJobListing, normalizePhone, insertApplication } from './application-processor.ts';
import { autoPostToATS } from './ats-adapters/auto-post-engine.ts';

// Hayes organization ID
const HAYES_ORG_ID = '84214b48-7b51-45bc-ad7f-723bcf50466c';

/**
 * Configuration for a Hayes client endpoint
 */
export interface HayesClientConfig {
  clientId: string;
  clientName: string;
  clientSlug: string;       // URL-safe slug for UTM tracking
  feedUserCode: string;     // CDL Job Cast user code
  feedBoard: string;        // CDL Job Cast board name
  utmCampaign?: string;     // Custom UTM campaign (defaults to client slug)
}

/**
 * CDL Job Cast job from XML feed
 */
interface CDLJobCastJob {
  id: string;
  title: string;
  city?: string;
  state?: string;
  description?: string;
  apply_url?: string;
}

/**
 * Application data from inbound request
 */
interface InboundApplication {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  applicant_email?: string;
  job_id?: string;
  job_listing_id?: string;
  city?: string;
  state?: string;
  zip?: string;
  cdl?: string;
  cdl_class?: string;
  exp?: string;
  driving_experience_years?: number;
  source?: string;
  [key: string]: unknown;
}

/**
 * Parse XML feed from CDL Job Cast
 */
async function parseJobFeed(feedXml: string): Promise<CDLJobCastJob[]> {
  const jobs: CDLJobCastJob[] = [];
  
  // Simple regex-based XML parsing for job elements
  const jobMatches = feedXml.matchAll(/<job>([\s\S]*?)<\/job>/gi);
  
  for (const match of jobMatches) {
    const jobXml = match[1];
    
    const getId = (xml: string) => xml.match(/<id>([^<]*)<\/id>/i)?.[1]?.trim() || '';
    const getTitle = (xml: string) => xml.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || '';
    const getCity = (xml: string) => xml.match(/<city>([^<]*)<\/city>/i)?.[1]?.trim();
    const getState = (xml: string) => xml.match(/<state>([^<]*)<\/state>/i)?.[1]?.trim();
    const getDescription = (xml: string) => {
      const desc = xml.match(/<description>([\s\S]*?)<\/description>/i)?.[1]?.trim();
      return desc?.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    };
    const getApplyUrl = (xml: string) => xml.match(/<apply_url>([^<]*)<\/apply_url>/i)?.[1]?.trim();
    
    const id = getId(jobXml);
    if (id) {
      jobs.push({
        id,
        title: getTitle(jobXml) || `Job ${id}`,
        city: getCity(jobXml),
        state: getState(jobXml),
        description: getDescription(jobXml),
        apply_url: getApplyUrl(jobXml),
      });
    }
  }
  
  return jobs;
}

/**
 * Sync jobs from CDL Job Cast feed for a specific client
 */
async function syncJobsFromFeed(
  supabase: SupabaseClient,
  config: HayesClientConfig,
  logger: ReturnType<typeof createLogger>
): Promise<{ synced: number; created: number; updated: number; errors: string[] }> {
  const feedUrl = `https://www.cdljobcast.com/client/recruiting/getfeeds?user=${encodeURIComponent(config.feedUserCode)}&board=${encodeURIComponent(config.feedBoard)}`;
  
  logger.info('Fetching CDL Job Cast feed', { feedUrl, client: config.clientName });
  
  const feedResponse = await fetch(feedUrl);
  if (!feedResponse.ok) {
    throw new Error(`Failed to fetch feed: ${feedResponse.status} ${feedResponse.statusText}`);
  }
  
  const feedXml = await feedResponse.text();
  const jobs = await parseJobFeed(feedXml);
  
  logger.info('Parsed jobs from feed', { count: jobs.length, client: config.clientName });
  
  const results = { synced: 0, created: 0, updated: 0, errors: [] as string[] };
  
  // Get a user_id for job creation
  const { data: orgMember } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('organization_id', HAYES_ORG_ID)
    .limit(1)
    .maybeSingle();
  
  const userId = orgMember?.user_id;
  if (!userId) {
    throw new Error('No organization member found for job creation');
  }
  
  // Get default category
  const { data: categories } = await supabase
    .from('job_categories')
    .select('id')
    .limit(1);
  
  const categoryId = categories?.[0]?.id;
  if (!categoryId) {
    throw new Error('No job category found');
  }
  
  // UTM parameters for this client
  const utmSource = 'cdl_jobcast';
  const utmMedium = 'job_board';
  const utmCampaign = config.utmCampaign || config.clientSlug;
  
  for (const job of jobs) {
    try {
      // Check if job exists
      const { data: existingJob } = await supabase
        .from('job_listings')
        .select('id, updated_at')
        .eq('job_id', job.id)
        .eq('organization_id', HAYES_ORG_ID)
        .eq('client_id', config.clientId)
        .maybeSingle();
      
      // Build apply URL with UTM tracking
      const baseApplyUrl = job.apply_url || `https://applyai.jobs/apply/${job.id}`;
      const applyUrlWithUtm = `${baseApplyUrl}${baseApplyUrl.includes('?') ? '&' : '?'}utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
      
      if (existingJob) {
        // Update existing job
        const { error: updateError } = await supabase
          .from('job_listings')
          .update({
            title: job.title,
            city: job.city,
            state: job.state,
            location: job.city && job.state ? `${job.city}, ${job.state}` : null,
            job_summary: job.description,
            apply_url: applyUrlWithUtm,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingJob.id);
        
        if (updateError) {
          results.errors.push(`Failed to update job ${job.id}: ${updateError.message}`);
        } else {
          results.updated++;
        }
      } else {
        // Create new job
        const { error: insertError } = await supabase
          .from('job_listings')
          .insert({
            job_id: job.id,
            title: job.title,
            organization_id: HAYES_ORG_ID,
            client_id: config.clientId,
            category_id: categoryId,
            user_id: userId,
            city: job.city,
            state: job.state,
            location: job.city && job.state ? `${job.city}, ${job.state}` : null,
            job_summary: job.description,
            apply_url: applyUrlWithUtm,
            status: 'active',
            is_hidden: false,
          });
        
        if (insertError) {
          results.errors.push(`Failed to create job ${job.id}: ${insertError.message}`);
        } else {
          results.created++;
        }
      }
      
      results.synced++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.errors.push(`Error processing job ${job.id}: ${errorMsg}`);
    }
  }
  
  logger.info('Job sync complete', { 
    client: config.clientName,
    synced: results.synced,
    created: results.created,
    updated: results.updated,
    errorCount: results.errors.length
  });
  
  return results;
}

/**
 * Process inbound application for a specific client
 */
async function processApplication(
  supabase: SupabaseClient,
  config: HayesClientConfig,
  data: InboundApplication,
  logger: ReturnType<typeof createLogger>
): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  logger.info('Processing inbound application', { 
    client: config.clientName,
    jobId: data.job_id,
    hasPhone: !!data.phone,
    hasEmail: !!(data.email || data.applicant_email)
  });
  
  // Normalize phone
  const normalizedPhone = normalizePhone(data.phone);
  
  // Find or create job listing (scoped to this client)
  const jobResult = await findOrCreateJobListing(supabase, {
    jobListingId: data.job_listing_id,
    jobId: data.job_id,
    organizationId: HAYES_ORG_ID,
    clientId: config.clientId,
    city: data.city,
    state: data.state,
    source: `hayes-${config.clientSlug}-inbound`,
  });
  
  if (!jobResult) {
    return { success: false, error: 'Could not resolve job listing' };
  }
  
  // UTM attribution for this client
  const utmSource = 'cdl_jobcast';
  const utmMedium = 'job_board';
  const utmCampaign = config.utmCampaign || config.clientSlug;
  
  // Build application data
  const applicationData = {
    job_listing_id: jobResult.id,
    job_id: data.job_id || null,
    first_name: data.first_name || null,
    last_name: data.last_name || null,
    phone: normalizedPhone || data.phone || null,
    applicant_email: data.applicant_email || data.email || null,
    city: data.city || null,
    state: data.state || null,
    zip: data.zip || null,
    cdl: data.cdl || null,
    cdl_class: data.cdl_class || null,
    exp: data.exp || null,
    driving_experience_years: data.driving_experience_years || null,
    source: `hayes-${config.clientSlug}-inbound`,
    status: 'pending',
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    applied_at: new Date().toISOString(),
  };
  
  const { data: application, error } = await insertApplication(supabase, applicationData);
  
  if (error) {
    logger.error('Failed to insert application', error, { client: config.clientName });
    return { success: false, error: error.message };
  }
  
  logger.info('Application created', { 
    client: config.clientName,
    applicationId: application.id,
    matchType: jobResult.matchType
  });

  // Auto-post to ATS (non-blocking) — delivers to Double Nickel, Tenstreet, etc.
  EdgeRuntime.waitUntil(
    autoPostToATS(supabase, application.id, HAYES_ORG_ID, applicationData as Record<string, unknown>, {
      clientId: config.clientId
    })
  );
  
  return { success: true, applicationId: application.id };
}

/**
 * Create client-specific inbound handler
 */
export function createClientHandler(config: HayesClientConfig) {
  const logger = createLogger(`hayes-${config.clientSlug}-inbound`);
  
  return wrapHandler(async (req: Request): Promise<Response> => {
    const origin = req.headers.get('origin');
    
    // Handle CORS preflight
    const preflightResponse = handleCorsPreflightIfNeeded(req);
    if (preflightResponse) return preflightResponse;
    
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return errorResponse('Server configuration error', 500, undefined, origin);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse URL and determine action
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    logger.info('Inbound request', { 
      method: req.method,
      action,
      client: config.clientName 
    });
    
    // GET request or action=jobs: Sync jobs from feed
    if (req.method === 'GET' || action === 'jobs') {
      try {
        const results = await syncJobsFromFeed(supabase, config, logger);
        return successResponse(results, `Job sync complete for ${config.clientName}`, undefined, origin);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error('Job sync failed', err, { client: config.clientName });
        return errorResponse(errorMsg, 500, undefined, origin);
      }
    }
    
    // POST request: Process application
    if (req.method === 'POST') {
      try {
        const body = await req.json() as InboundApplication;
        
        // Check if this is an application (has name/phone/email)
        const isApplication = body.first_name || body.last_name || body.phone || body.email || body.applicant_email;
        
        if (!isApplication) {
          // Empty POST or no app data - treat as job sync request
          const results = await syncJobsFromFeed(supabase, config, logger);
          return successResponse(results, `Job sync complete for ${config.clientName}`, undefined, origin);
        }
        
        const result = await processApplication(supabase, config, body, logger);
        
        if (result.success) {
          return successResponse(
            { applicationId: result.applicationId },
            'Application received',
            undefined,
            origin
          );
        } else {
          return errorResponse(result.error || 'Failed to process application', 400, undefined, origin);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error('Application processing failed', err, { client: config.clientName });
        return errorResponse(errorMsg, 500, undefined, origin);
      }
    }
    
    return errorResponse('Method not allowed', 405, undefined, origin);
  }, { context: `hayes-${config.clientSlug}-inbound`, logRequests: true });
}

// Export Hayes client configurations
export const HAYES_CLIENT_CONFIGS: Record<string, HayesClientConfig> = {
  'danny-herman': {
    clientId: '1d54e463-4d7f-4a05-8189-3e33d0586dea',
    clientName: 'Danny Herman Trucking',
    clientSlug: 'danny-herman',
    feedUserCode: 'danny_herman_trucking',
    feedBoard: 'AIRecruiter',
  },
  'pemberton': {
    clientId: '67cadf11-8cce-41c6-8e19-7d2bb0be3b03',
    clientName: 'Pemberton Truck Lines Inc',
    clientSlug: 'pemberton',
    feedUserCode: 'Pemberton-Truck-Lines-1749741664',
    feedBoard: 'AIRecruiter',
  },
  'dayross': {
    clientId: '30ab5f68-258c-4e81-8217-1123c4536259',
    clientName: 'Day and Ross',
    clientSlug: 'dayross',
    feedUserCode: 'Day-and-Ross-1745523293',
    feedBoard: 'AIRecruiter',
  },
  'novco': {
    clientId: '4a9ef1df-dcc9-499c-999a-446bb9a329fc',
    clientName: 'Novco, Inc.',
    clientSlug: 'novco',
    feedUserCode: 'Novco%2C-Inc.-1760547390',
    feedBoard: 'AIRecruiter',
  },
  'james-burg': {
    clientId: 'b2a29507-32a6-4f5e-85d6-a7e6ffac3c52',
    clientName: 'James Burg Trucking Company',
    clientSlug: 'james-burg',
    feedUserCode: 'James-Burg-Trucking-Company-1770928232',
    feedBoard: 'AIRecruiter',
  },
  're-garrison': {
    clientId: 'be8b645e-d480-4c22-8e75-b09a7fc1db7a',
    clientName: 'R.E. Garrison Trucking',
    clientSlug: 're-garrison',
    feedUserCode: 'RE-Garrison-Trucking-1760000000',
    feedBoard: 'AIRecruiter',
  },
};
