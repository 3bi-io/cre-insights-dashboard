// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { getCorsHeaders } from '../_shared/cors-config.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { wrapHandler } from '../_shared/error-handler.ts'
import { getServiceClient } from '../_shared/supabase-client.ts'
import { parseXMLFeed } from '../_shared/xml-parser.ts'
import { createLogger } from '../_shared/logger.ts'

const logger = createLogger('sync-cdl-feeds');

// Hayes Recruiting Solutions organization ID
const HAYES_ORG_ID = '84214b48-7b51-45bc-ad7f-723bcf50466c';

// CDL Job Cast feed configurations for Hayes clients
const CDL_FEEDS = [
  {
    clientId: '67cadf11-8cce-41c6-8e19-7d2bb0be3b03',
    clientName: 'Pemberton Truck Lines Inc',
    feedUrl: 'https://cdljobcast.com/client/recruiting/getfeeds?user=Pemberton-Truck-Lines-1749741664&board=ATSme'
  },
  {
    clientId: '1d54e463-4d7f-4a05-8189-3e33d0586dea',
    clientName: 'Danny Herman Trucking',
    feedUrl: 'https://cdljobcast.com/client/recruiting/getfeeds?user=danny_herman_trucking&board=AIRecruiter'
  },
  {
    clientId: '4a9ef1df-dcc9-499c-999a-446bb9a329fc',
    clientName: 'Novco, Inc.',
    feedUrl: 'https://cdljobcast.com/client/recruiting/getfeeds?user=Novco%2C-Inc.-1760547390&board=ATSme'
  },
  {
    clientId: '30ab5f68-258c-4e81-8217-1123c4536259',
    clientName: 'Day and Ross',
    feedUrl: 'https://cdljobcast.com/client/recruiting/getfeeds?user=Day-and-Ross-1745523293&board=ATSme'
  }
];

interface SyncResult {
  clientId: string;
  clientName: string;
  jobsInFeed: number;
  jobsInserted: number;
  jobsUpdated: number;
  jobsDeactivated: number;
  durationMs: number;
  error?: string;
}

async function syncClientFeed(
  supabase: any,
  feed: typeof CDL_FEEDS[0],
  defaultCategoryId: string,
  superAdminId: string
): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    clientId: feed.clientId,
    clientName: feed.clientName,
    jobsInFeed: 0,
    jobsInserted: 0,
    jobsUpdated: 0,
    jobsDeactivated: 0,
    durationMs: 0
  };

  try {
    logger.info('Fetching feed', { clientName: feed.clientName, feedUrl: feed.feedUrl });
    
    // Fetch the XML feed
    const response = await fetch(feed.feedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Supabase-Edge-Function/1.0',
        'Accept': 'application/xml, text/xml, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`Feed fetch failed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // Check if response is XML
    if (!xmlText.trim().startsWith('<?xml') && !xmlText.includes('<job>')) {
      logger.info('Response is not XML, checking JSON...', { clientName: feed.clientName });
      // Try parsing as JSON
      try {
        const jsonData = JSON.parse(xmlText);
        logger.info('Received JSON response', { clientName: feed.clientName, itemCount: Array.isArray(jsonData) ? jsonData.length : 'unknown' });
      } catch {
        throw new Error('Feed returned neither valid XML nor JSON');
      }
    }

    // Parse XML feed
    const jobs = parseXMLFeed(xmlText);
    result.jobsInFeed = jobs.length;
    logger.info('Parsed jobs from feed', { clientName: feed.clientName, count: jobs.length });

    if (jobs.length === 0) {
      logger.info('No jobs in feed, skipping sync', { clientName: feed.clientName });
      result.durationMs = Date.now() - startTime;
      return result;
    }

    // Get current active job IDs for this client
    const { data: existingJobs, error: fetchError } = await supabase
      .from('job_listings')
      .select('id, job_id, title, location, updated_at')
      .eq('client_id', feed.clientId)
      .eq('organization_id', HAYES_ORG_ID)
      .eq('status', 'active')
      .not('job_id', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch existing jobs: ${fetchError.message}`);
    }

    const existingJobMap = new Map(
      (existingJobs || []).map((j: any) => [j.job_id, j])
    );
    const feedJobIds = new Set<string>();

    // Process each job from the feed
    for (const job of jobs) {
      const jobId = job.referencenumber || job.id;
      if (!jobId) {
        logger.debug('Skipping job without ID', { clientName: feed.clientName, title: job.title });
        continue;
      }

      feedJobIds.add(jobId);
      const location = job.city && job.state ? `${job.city}, ${job.state}` : 
                      job.city || job.state || job.location || null;

      const jobData = {
        title: job.title || 'Untitled Position',
        job_summary: job.description || null,
        location,
        city: job.city || null,
        state: job.state || null,
        salary_min: job.salary_min || null,
        salary_max: job.salary_max || null,
        salary_type: job.salary_type || 'yearly',
        experience_level: job.experience || null,
        remote_type: 'on-site',
        job_type: 'full-time',
        status: 'active',
        user_id: superAdminId,
        organization_id: HAYES_ORG_ID,
        category_id: defaultCategoryId,
        url: job.url || null,
        apply_url: job.url || null,
        job_id: jobId,
        client_id: feed.clientId,
        client: feed.clientName,
        updated_at: new Date().toISOString()
      };

      const existingJob = existingJobMap.get(jobId);

      if (existingJob) {
        // Update existing job
        const { error: updateError } = await supabase
          .from('job_listings')
          .update({
            title: jobData.title,
            job_summary: jobData.job_summary,
            location: jobData.location,
            city: jobData.city,
            state: jobData.state,
            salary_min: jobData.salary_min,
            salary_max: jobData.salary_max,
            salary_type: jobData.salary_type,
            experience_level: jobData.experience_level,
            url: jobData.url,
            apply_url: jobData.apply_url,
            updated_at: jobData.updated_at
          })
          .eq('id', existingJob.id);

        if (updateError) {
          logger.error('Failed to update job', updateError, { clientName: feed.clientName, jobId });
        } else {
          result.jobsUpdated++;
        }
      } else {
        // Check for duplicates by job_id (in case of non-unique constraint)
        const { data: duplicates } = await supabase
          .from('job_listings')
          .select('id')
          .eq('job_id', jobId)
          .eq('client_id', feed.clientId)
          .limit(1);

        if (duplicates && duplicates.length > 0) {
          // Update the duplicate instead of inserting
          const { error: updateError } = await supabase
            .from('job_listings')
            .update({
              ...jobData,
              id: undefined // Don't try to update ID
            })
            .eq('id', duplicates[0].id);

          if (!updateError) {
            result.jobsUpdated++;
          }
        } else {
          // Insert new job
          const { error: insertError } = await supabase
            .from('job_listings')
            .insert(jobData);

          if (insertError) {
            logger.error('Failed to insert job', insertError, { clientName: feed.clientName, jobId });
          } else {
            result.jobsInserted++;
          }
        }
      }
    }

    // Deactivate jobs no longer in the feed
    const jobsToDeactivate = (existingJobs || [])
      .filter((j: any) => !feedJobIds.has(j.job_id))
      .map((j: any) => j.id);

    if (jobsToDeactivate.length > 0) {
      logger.info('Deactivating stale jobs', { clientName: feed.clientName, count: jobsToDeactivate.length });
      
      // Deactivate in smaller batches to avoid issues with large updates
      const BATCH_SIZE = 50;
      for (let i = 0; i < jobsToDeactivate.length; i += BATCH_SIZE) {
        const batch = jobsToDeactivate.slice(i, i + BATCH_SIZE);
        const { error: deactivateError } = await supabase
          .from('job_listings')
          .update({ 
            status: 'inactive', 
            updated_at: new Date().toISOString() 
          })
          .in('id', batch);

        if (deactivateError) {
          logger.error('Failed to deactivate jobs batch', { 
            clientName: feed.clientName,
            errorMessage: deactivateError.message,
            batchStart: i,
            batchSize: batch.length
          });
        } else {
          result.jobsDeactivated += batch.length;
        }
      }
    }

    logger.info('Sync complete', { 
      clientName: feed.clientName, 
      inserted: result.jobsInserted, 
      updated: result.jobsUpdated, 
      deactivated: result.jobsDeactivated 
    });

  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    logger.error('Sync failed', error, { clientName: feed.clientName });
  }

  result.durationMs = Date.now() - startTime;
  return result;
}

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  logger.info('CDL Job Cast Feed Sync Started');
  const startTime = Date.now();
  
  const supabase = getServiceClient();

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

  // Sync all feeds
  const results: SyncResult[] = [];
  
  for (const feed of CDL_FEEDS) {
    const result = await syncClientFeed(supabase, feed, defaultCategoryId, superAdminId);
    results.push(result);

    // Log sync result to database
    await supabase
      .from('feed_sync_logs')
      .insert({
        client_id: feed.clientId,
        client_name: feed.clientName,
        feed_url: feed.feedUrl,
        jobs_in_feed: result.jobsInFeed,
        jobs_inserted: result.jobsInserted,
        jobs_updated: result.jobsUpdated,
        jobs_deactivated: result.jobsDeactivated,
        sync_duration_ms: result.durationMs,
        error: result.error || null,
        sync_type: 'scheduled'
      });
  }

  const totalDuration = Date.now() - startTime;
  const summary = {
    totalClients: results.length,
    totalJobsProcessed: results.reduce((sum, r) => sum + r.jobsInFeed, 0),
    totalInserted: results.reduce((sum, r) => sum + r.jobsInserted, 0),
    totalUpdated: results.reduce((sum, r) => sum + r.jobsUpdated, 0),
    totalDeactivated: results.reduce((sum, r) => sum + r.jobsDeactivated, 0),
    failedClients: results.filter(r => r.error).length,
    durationMs: totalDuration,
    results
  };

  logger.info('CDL Job Cast Feed Sync Complete', { 
    inserted: summary.totalInserted, 
    updated: summary.totalUpdated, 
    deactivated: summary.totalDeactivated,
    durationMs: totalDuration 
  });

  return successResponse(summary, 'CDL feeds synchronized successfully');
}, { context: 'SyncCDLFeeds', logRequests: true });

serve(handler);
