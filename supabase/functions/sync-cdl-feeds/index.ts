// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { getCorsHeaders } from '../_shared/cors-config.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { wrapHandler } from '../_shared/error-handler.ts'
import { getServiceClient } from '../_shared/supabase-client.ts'
import { parseXMLFeed } from '../_shared/xml-parser.ts'

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
    console.log(`[${feed.clientName}] Fetching feed: ${feed.feedUrl}`);
    
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
      console.log(`[${feed.clientName}] Response is not XML, checking JSON...`);
      // Try parsing as JSON
      try {
        const jsonData = JSON.parse(xmlText);
        console.log(`[${feed.clientName}] Received JSON response with ${Array.isArray(jsonData) ? jsonData.length : 'unknown'} items`);
      } catch {
        throw new Error('Feed returned neither valid XML nor JSON');
      }
    }

    // Parse XML feed
    const jobs = parseXMLFeed(xmlText);
    result.jobsInFeed = jobs.length;
    console.log(`[${feed.clientName}] Parsed ${jobs.length} jobs from feed`);

    if (jobs.length === 0) {
      console.log(`[${feed.clientName}] No jobs in feed, skipping sync`);
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
        console.log(`[${feed.clientName}] Skipping job without ID: ${job.title}`);
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
          console.error(`[${feed.clientName}] Failed to update job ${jobId}:`, updateError);
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
            console.error(`[${feed.clientName}] Failed to insert job ${jobId}:`, insertError);
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
      console.log(`[${feed.clientName}] Deactivating ${jobsToDeactivate.length} stale jobs`);
      
      const { error: deactivateError } = await supabase
        .from('job_listings')
        .update({ 
          status: 'inactive', 
          updated_at: new Date().toISOString() 
        })
        .in('id', jobsToDeactivate);

      if (deactivateError) {
        console.error(`[${feed.clientName}] Failed to deactivate jobs:`, deactivateError);
      } else {
        result.jobsDeactivated = jobsToDeactivate.length;
      }
    }

    console.log(`[${feed.clientName}] Sync complete: ${result.jobsInserted} inserted, ${result.jobsUpdated} updated, ${result.jobsDeactivated} deactivated`);

  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    console.error(`[${feed.clientName}] Sync failed:`, result.error);
  }

  result.durationMs = Date.now() - startTime;
  return result;
}

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  console.log('=== CDL Job Cast Feed Sync Started ===');
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

  console.log('=== CDL Job Cast Feed Sync Complete ===');
  console.log(`Total: ${summary.totalInserted} inserted, ${summary.totalUpdated} updated, ${summary.totalDeactivated} deactivated in ${totalDuration}ms`);

  return successResponse(summary, 'CDL feeds synchronized successfully');
}, { context: 'SyncCDLFeeds', logRequests: true });

serve(handler);
