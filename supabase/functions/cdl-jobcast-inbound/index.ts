/**
 * CDL Job Cast Universal Inbound Endpoint
 * 
 * Single entry point for all CDL Job Cast integrations:
 * - Job listings sync with UTM-enriched apply URLs
 * - Application forwarding with automatic UTM attribution
 * 
 * Endpoint: /functions/v1/cdl-jobcast-inbound
 * 
 * Query Parameters:
 *   action: 'jobs' | 'apps' | 'auto' (default: auto-detect)
 *   client_name: Client identifier for routing
 *   board: CDL Job Cast board name (default: ATSme)
 *   user: CDL Job Cast user parameter
 *   utm_source: Override default source (default: cdl_jobcast)
 *   utm_medium: Override default medium (default: job_board)
 *   utm_campaign: Custom campaign name or auto-generate
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { parseXMLFeed } from '../_shared/xml-parser.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('cdl-jobcast-inbound');

// Hayes Recruiting Solutions organization ID
const HAYES_ORG_ID = '84214b48-7b51-45bc-ad7f-723bcf50466c';

// Default UTM parameters for CDL Job Cast
const DEFAULT_UTM = {
  source: 'cdl_jobcast',
  medium: 'job_board',
};

/**
 * Generate internal apply URL with UTM parameters
 */
function generateApplyUrl(jobListingId: string, clientName: string, utmParams: {
  source: string;
  medium: string;
  campaign?: string;
}): string {
  const baseUrl = 'https://applyai.jobs/apply';
  
  // Generate campaign name if not provided
  const campaign = utmParams.campaign || generateCampaignName(clientName);
  
  const params = new URLSearchParams({
    job_id: jobListingId,
    utm_source: utmParams.source,
    utm_medium: utmParams.medium,
    utm_campaign: campaign,
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate campaign name from client name
 */
function generateCampaignName(clientName: string): string {
  const slug = slugify(clientName);
  const quarter = `q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
  const year = new Date().getFullYear();
  return `${slug}_${quarter}_${year}`;
}

/**
 * Convert string to URL-safe slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}

/**
 * Handle job listings import with UTM-enriched apply URLs
 */
async function handleJobsImport(
  supabase: ReturnType<typeof getServiceClient>,
  feedUrl: string,
  clientId: string | null,
  clientName: string,
  utmParams: { source: string; medium: string; campaign?: string }
): Promise<{
  processed: number;
  inserted: number;
  updated: number;
  errors: string[];
}> {
  const result = {
    processed: 0,
    inserted: 0,
    updated: 0,
    errors: [] as string[],
  };

  try {
    logger.info('Fetching jobs from CDL Job Cast', { feedUrl, clientName });
    
    // Fetch the feed
    const response = await fetch(feedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Supabase-Edge-Function/1.0',
        'Accept': 'application/xml, text/xml, application/json, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`Feed fetch failed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    let jobs: Record<string, unknown>[] = [];

    // Parse based on content type
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const jsonData = JSON.parse(text);
      jobs = Array.isArray(jsonData) ? jsonData : 
             jsonData.jobs ? jsonData.jobs : 
             jsonData.data ? jsonData.data : [jsonData];
    } else if (text.trim().startsWith('<?xml') || text.includes('<job>')) {
      jobs = parseXMLFeed(text);
    } else {
      // Try JSON first, then XML
      try {
        const jsonData = JSON.parse(text);
        jobs = Array.isArray(jsonData) ? jsonData : [jsonData];
      } catch {
        jobs = parseXMLFeed(text);
      }
    }

    logger.info('Parsed jobs from feed', { count: jobs.length });
    result.processed = jobs.length;

    if (jobs.length === 0) {
      return result;
    }

    // Get default category
    const { data: categories } = await supabase
      .from('job_categories')
      .select('id')
      .limit(1);

    if (!categories || categories.length === 0) {
      throw new Error('No job categories found');
    }

    // Get super admin ID
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'c@3bi.io')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      throw new Error('Super admin profile not found');
    }

    const defaultCategoryId = categories[0].id;
    const superAdminId = profiles[0].id;

    // Process each job
    for (const job of jobs) {
      try {
        const jobId = (job.referencenumber || job.id || job.job_id) as string;
        if (!jobId) {
          result.errors.push(`Job skipped: no reference number`);
          continue;
        }

        const location = job.city && job.state 
          ? `${job.city}, ${job.state}` 
          : (job.city || job.state || job.location || null) as string | null;

        // Check if job already exists
        const { data: existingJobs } = await supabase
          .from('job_listings')
          .select('id')
          .eq('job_id', jobId)
          .eq('organization_id', HAYES_ORG_ID)
          .limit(1);

        const existingJobId = existingJobs?.[0]?.id;

        // Generate the UTM-enriched apply URL
        const applyUrl = existingJobId 
          ? generateApplyUrl(existingJobId, clientName, utmParams)
          : null; // Will be updated after insert

        // Fix R.E. Garrison titles: replace "CO" prefix with "LP" (Lease Purchase)
        let finalTitle = (job.title as string) || 'Untitled Position';
        if (clientId === 'be8b645e-d480-4c22-8e75-b09a7fc1db7a' && finalTitle.startsWith('CO ')) {
          finalTitle = 'LP' + finalTitle.substring(2);
        }

        const jobData = {
          title: finalTitle,
          job_summary: (job.description as string) || null,
          location,
          city: (job.city as string) || null,
          state: (job.state as string) || null,
          salary_min: (job.salary_min as number) || null,
          salary_max: (job.salary_max as number) || null,
          salary_type: (job.salary_type as string) || 'yearly',
          experience_level: (job.experience as string) || null,
          remote_type: 'on-site',
          job_type: 'full-time',
          status: 'active',
          user_id: superAdminId,
          organization_id: HAYES_ORG_ID,
          category_id: defaultCategoryId,
          url: (job.url as string) || null,
          job_id: jobId,
          client_id: clientId,
          client: clientName,
          updated_at: new Date().toISOString(),
        };

        if (existingJobId) {
          // Update existing job with new apply URL
          const { error: updateError } = await supabase
            .from('job_listings')
            .update({
              ...jobData,
              apply_url: generateApplyUrl(existingJobId, clientName, utmParams),
            })
            .eq('id', existingJobId);

          if (updateError) {
            result.errors.push(`Update failed for ${jobId}: ${updateError.message}`);
          } else {
            result.updated++;
          }
        } else {
          // Insert new job
          const { data: newJob, error: insertError } = await supabase
            .from('job_listings')
            .insert(jobData)
            .select('id')
            .single();

          if (insertError) {
            result.errors.push(`Insert failed for ${jobId}: ${insertError.message}`);
          } else if (newJob) {
            // Update with the apply URL now that we have the ID
            await supabase
              .from('job_listings')
              .update({
                apply_url: generateApplyUrl(newJob.id, clientName, utmParams),
              })
              .eq('id', newJob.id);

            result.inserted++;
          }
        }
      } catch (jobError) {
        result.errors.push(`Job processing error: ${jobError instanceof Error ? jobError.message : String(jobError)}`);
      }
    }

    logger.info('Jobs import complete', { 
      processed: result.processed, 
      inserted: result.inserted, 
      updated: result.updated,
      errors: result.errors.length
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMsg);
    logger.error('Jobs import failed', { error: errorMsg });
  }

  return result;
}

/**
 * Forward application to inbound-applications with UTM parameters
 */
async function handleApplicationForward(
  req: Request,
  body: Record<string, unknown>,
  utmParams: { source: string; medium: string; campaign?: string }
): Promise<Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  // Enrich the body with UTM parameters
  const enrichedBody = {
    ...body,
    utm_source: body.utm_source || utmParams.source,
    utm_medium: body.utm_medium || utmParams.medium,
    utm_campaign: body.utm_campaign || utmParams.campaign,
    source: body.source || 'CDL Job Cast',
    raw_payload: body,
  };

  logger.info('Forwarding application with UTM enrichment', {
    utm_source: enrichedBody.utm_source,
    utm_medium: enrichedBody.utm_medium,
    utm_campaign: enrichedBody.utm_campaign,
  });

  // Forward to inbound-applications
  const forwardUrl = `${supabaseUrl}/functions/v1/inbound-applications`;
  
  const response = await fetch(forwardUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': req.headers.get('Authorization') || `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify(enrichedBody),
  });

  const responseData = await response.json();
  
  return new Response(JSON.stringify({
    ...responseData,
    utm_attribution: {
      source: enrichedBody.utm_source,
      medium: enrichedBody.utm_medium,
      campaign: enrichedBody.utm_campaign,
    },
  }), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Auto-detect action based on request content
 */
function detectAction(
  body: Record<string, unknown>,
  queryParams: URLSearchParams
): 'jobs' | 'apps' {
  // Explicit action parameter takes precedence
  const explicitAction = queryParams.get('action');
  if (explicitAction === 'jobs' || explicitAction === 'apps') {
    return explicitAction;
  }

  // Check for application-specific fields
  const applicationFields = ['first_name', 'last_name', 'email', 'applicant_email', 'phone'];
  const hasApplicationData = applicationFields.some(field => body[field]);
  
  if (hasApplicationData) {
    return 'apps';
  }

  // Check for feed URL or job-specific fields
  const feedUrl = queryParams.get('feed_url') || body.feed_url;
  const hasJobFields = body.jobs || body.job || body.title;
  
  if (feedUrl || hasJobFields) {
    return 'jobs';
  }

  // Default to apps for POST requests with body data
  return Object.keys(body).length > 0 ? 'apps' : 'jobs';
}

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  const url = new URL(req.url);
  const queryParams = url.searchParams;

  // Parse request body
  let body: Record<string, unknown> = {};
  if (req.method === 'POST') {
    try {
      const rawBody = await req.text();
      if (rawBody) {
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          body = JSON.parse(rawBody);
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          body = Object.fromEntries(new URLSearchParams(rawBody));
        } else {
          // Try JSON first
          try {
            body = JSON.parse(rawBody);
          } catch {
            body = Object.fromEntries(new URLSearchParams(rawBody));
          }
        }
      }
    } catch (e) {
      logger.warn('Failed to parse request body', { error: e });
    }
  }

  // Extract UTM parameters from query or body
  const utmParams = {
    source: queryParams.get('utm_source') || (body.utm_source as string) || DEFAULT_UTM.source,
    medium: queryParams.get('utm_medium') || (body.utm_medium as string) || DEFAULT_UTM.medium,
    campaign: queryParams.get('utm_campaign') || (body.utm_campaign as string) || undefined,
  };

  // Extract client info
  const clientName = queryParams.get('client_name') || 
                     queryParams.get('user') || 
                     (body.client_name as string) || 
                     (body.company as string) || 
                     'Unknown Client';

  // Detect or use explicit action
  const action = detectAction(body, queryParams);

  logger.info('CDL Job Cast inbound request', {
    action,
    clientName,
    utmParams,
    method: req.method,
    hasBody: Object.keys(body).length > 0,
  });

  const supabase = getServiceClient();

  if (action === 'jobs') {
    // Handle job listings import
    const feedUrl = queryParams.get('feed_url') || 
                    (body.feed_url as string) ||
                    buildFeedUrl(queryParams);

    if (!feedUrl) {
      throw new ValidationError('Feed URL is required for job import. Provide feed_url parameter or user/board combination.');
    }

    // Find client by name if possible
    let clientId: string | null = null;
    const { data: clients } = await supabase
      .from('clients')
      .select('id')
      .eq('organization_id', HAYES_ORG_ID)
      .ilike('name', `%${clientName}%`)
      .limit(1);

    if (clients && clients.length > 0) {
      clientId = clients[0].id;
    }

    // Generate campaign name if not provided
    if (!utmParams.campaign) {
      utmParams.campaign = generateCampaignName(clientName);
    }

    const result = await handleJobsImport(
      supabase,
      feedUrl,
      clientId,
      clientName,
      utmParams
    );

    return successResponse({
      action: 'jobs',
      processed: result.processed,
      inserted: result.inserted,
      updated: result.updated,
      errors: result.errors.length > 0 ? result.errors : undefined,
      utm_attribution: {
        source: utmParams.source,
        medium: utmParams.medium,
        campaign: utmParams.campaign,
      },
    }, `Processed ${result.processed} jobs: ${result.inserted} inserted, ${result.updated} updated`);
  }

  if (action === 'apps') {
    // Generate campaign name if not provided
    if (!utmParams.campaign) {
      utmParams.campaign = generateCampaignName(clientName);
    }

    // Forward to inbound-applications with UTM enrichment
    return await handleApplicationForward(req, body, utmParams);
  }

  throw new ValidationError(`Invalid action: ${action}. Use 'jobs' or 'apps'.`);
}, { context: 'CDLJobCastInbound', logRequests: true });

/**
 * Build CDL Job Cast feed URL from query parameters
 */
function buildFeedUrl(params: URLSearchParams): string | null {
  const user = params.get('user');
  const board = params.get('board') || 'ATSme';
  
  if (!user) {
    return null;
  }
  
  return `https://cdljobcast.com/client/recruiting/getfeeds?user=${encodeURIComponent(user)}&board=${encodeURIComponent(board)}`;
}

serve(handler);
