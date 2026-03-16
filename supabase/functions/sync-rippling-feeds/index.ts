import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { getCorsHeaders } from '../_shared/cors-config.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { wrapHandler } from '../_shared/error-handler.ts'
import { getServiceClient } from '../_shared/supabase-client.ts'
import { createLogger } from '../_shared/logger.ts'

const logger = createLogger('sync-rippling-feeds');

// AspenView / Aspen Analytics configuration
const ASPENVIEW_CONFIG = {
  clientId: '82513316-7df2-4bf0-83d8-6c511c83ddfb',
  clientName: 'AspenView Technology Partners',
  organizationId: '9335c64c-b793-4578-bf51-63d0c3b5d66d',
  feedUrl: 'https://ats.rippling.com/es-419/aspenview',
  source: 'rippling',
};

const DEFAULT_UTM = {
  source: 'rippling',
  medium: 'ats_feed',
};

// Department to category mapping (cyber-focused org)
const DEPARTMENT_CATEGORY_MAP: Record<string, string> = {
  'technology': 'Cybersecurity',
  'engineering': 'Cybersecurity',
  'cybersecurity': 'Cybersecurity',
  'security': 'Cybersecurity',
  'it': 'Cybersecurity',
  'development': 'Cybersecurity',
  'sales': 'Customer Service',
  'business operations': 'Administrative',
  'operations': 'Administrative',
  'people': 'Administrative',
  'hr': 'Administrative',
  'marketing': 'Administrative',
  'finance': 'Administrative',
  'legal': 'Administrative',
};

function generateApplyUrl(jobListingId: string): string {
  const baseUrl = 'https://applyai.jobs/apply';
  const quarter = `q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
  const year = new Date().getFullYear();
  const campaign = `aspenview_${quarter}_${year}`;

  const params = new URLSearchParams({
    job_id: jobListingId,
    utm_source: DEFAULT_UTM.source,
    utm_medium: DEFAULT_UTM.medium,
    utm_campaign: campaign,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Extract job UUID from a Rippling job URL
 * e.g. /jobs/af7ab95f-b971-45eb-b51f-209364342b91 → af7ab95f-b971-45eb-b51f-209364342b91
 */
function extractJobUuid(url: string): string | null {
  const match = url.match(/\/jobs\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return match ? match[1] : null;
}

/**
 * Parse location string into city, state, remote_type
 */
function parseLocation(location: string | null): { city: string | null; state: string | null; remote_type: string | null; location: string | null } {
  if (!location) return { city: null, state: null, remote_type: null, location: null };

  let loc = location.trim();

  // Fix truncated parentheses like "Remoto (Bogotá"
  if (loc.includes('(') && !loc.includes(')')) {
    loc = loc + ')';
  }

  // Check for remote indicators (Spanish and English)
  if (/remoto|remote/i.test(loc)) {
    // Purely remote
    if (/^(remoto|remote)$/i.test(loc)) {
      return { city: null, state: null, remote_type: 'remote', location: 'Remote' };
    }
    
    // "Remoto (City)" or "Remoto (City, Country)" pattern
    const parenMatch = loc.match(/(?:remoto|remote)\s*\(([^)]+)\)/i);
    if (parenMatch) {
      const inner = parenMatch[1].trim();
      const parts = inner.split(',').map(p => p.trim());
      return {
        city: parts[0] || null,
        state: parts.length > 1 ? parts[parts.length - 1] : null,
        remote_type: 'remote',
        location: `${parts[0] || 'Remote'} (Remote)`,
      };
    }

    // "City, State - Remote" pattern
    const cleanLoc = loc.replace(/[-–]\s*(remoto|remote)/i, '').trim();
    const parts = cleanLoc.split(',').map(p => p.trim());
    return {
      city: parts[0] || null,
      state: parts[1] || null,
      remote_type: 'remote',
      location: cleanLoc ? `${cleanLoc} (Remote)` : 'Remote',
    };
  }

  // Standard "City, State" or "City, State, Country"
  const parts = loc.split(',').map(p => p.trim());
  return {
    city: parts[0] || null,
    state: parts[1] || null,
    remote_type: 'on-site',
    location: loc,
  };
}

/**
 * Map department to a category name
 */
function mapDepartmentToCategory(department: string | null): string {
  if (!department) return 'Cybersecurity';
  const key = department.toLowerCase().trim();
  return DEPARTMENT_CATEGORY_MAP[key] || 'Cybersecurity';
}

interface ScrapedJob {
  title: string;
  department: string | null;
  location: string | null;
  url: string;
  jobId: string;
}

/**
 * Scrape jobs from the Rippling ATS page using Firecrawl
 */
async function scrapeRipplingJobs(): Promise<ScrapedJob[]> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const allJobs: ScrapedJob[] = [];
  const seenJobIds = new Set<string>();

  // Scrape the main page first using JSON extraction
  const pagesToScrape = [
    ASPENVIEW_CONFIG.feedUrl,
    `${ASPENVIEW_CONFIG.feedUrl}?page=2`,
    `${ASPENVIEW_CONFIG.feedUrl}?page=3`,
    `${ASPENVIEW_CONFIG.feedUrl}?page=4`,
    `${ASPENVIEW_CONFIG.feedUrl}?page=5`,
  ];

  for (const pageUrl of pagesToScrape) {
    logger.info('Scraping Rippling page', { url: pageUrl });

    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: pageUrl,
          formats: ['links', 'markdown'],
          onlyMainContent: true,
          waitFor: 3000, // Wait for JS rendering
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        logger.error('Firecrawl API error', null, { status: response.status, error: errData });
        continue;
      }

      const data = await response.json();
      const content = data.data || data;

      // Extract job links from the page
      const links: string[] = content.links || [];
      const jobLinks = links.filter((link: string) =>
        link.includes('/jobs/') && link.includes('rippling.com')
      );

      // Parse markdown for job details (title, department, location)
      const markdown: string = content.markdown || '';
      
      // Extract structured job data from markdown
      // Rippling pages typically show jobs in a list format
      const jobEntries = parseJobsFromMarkdown(markdown, jobLinks);

      for (const job of jobEntries) {
        if (!seenJobIds.has(job.jobId)) {
          seenJobIds.add(job.jobId);
          allJobs.push(job);
        }
      }

      logger.info('Scraped page results', {
        url: pageUrl,
        linksFound: jobLinks.length,
        jobsExtracted: jobEntries.length,
        totalUnique: allJobs.length,
      });

      // If no new jobs found on this page, stop pagination
      if (jobEntries.length === 0) {
        logger.info('No more jobs found, stopping pagination', { lastPage: pageUrl });
        break;
      }

    } catch (error) {
      logger.error('Failed to scrape page', error, { url: pageUrl });
    }
  }

  return allJobs;
}

/**
 * Parse job listings from Rippling page markdown content
 */
function parseJobsFromMarkdown(markdown: string, jobLinks: string[]): ScrapedJob[] {
  const jobs: ScrapedJob[] = [];

  // Build a map of job UUIDs from links
  const jobUrlMap = new Map<string, string>();
  for (const link of jobLinks) {
    const uuid = extractJobUuid(link);
    if (uuid) {
      jobUrlMap.set(uuid, link);
    }
  }

  // Try to parse job entries from markdown
  // Rippling markdown typically has patterns like:
  // [Job Title](url)\n\nDepartment\n\nLocation
  // or structured as sections
  
  const lines = markdown.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Strategy 1: Look for markdown links with job URLs
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match markdown links: [Title](url)
    const linkMatch = line.match(/\[([^\]]+)\]\(([^)]*\/jobs\/[0-9a-f-]+[^)]*)\)/i);
    if (linkMatch) {
      const title = linkMatch[1].trim();
      const url = linkMatch[2].trim();
      const jobId = extractJobUuid(url);
      
      if (jobId && title && title.length > 2) {
        // Look ahead for department and location info
        let department: string | null = null;
        let location: string | null = null;
        
        // Check next few non-link lines for department/location
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j];
          // Skip if it's another job link
          if (nextLine.match(/\[([^\]]+)\]\(([^)]*\/jobs\/)/i)) break;
          // Skip empty or header lines
          if (nextLine.startsWith('#') || nextLine === '---') continue;
          
          if (!department && !nextLine.includes('http') && nextLine.length < 60) {
            department = nextLine.replace(/^[-•*]\s*/, '').trim();
          } else if (!location && !nextLine.includes('http') && nextLine.length < 80) {
            location = nextLine.replace(/^[-•*]\s*/, '').trim();
          }
        }

        jobs.push({
          title,
          department,
          location,
          url,
          jobId,
        });
      }
    }
  }

  // Strategy 2: If no markdown links found, match by title patterns and known URLs
  if (jobs.length === 0 && jobUrlMap.size > 0) {
    // Fall back to associating titles with URLs by position
    logger.info('Falling back to positional job extraction', { urlCount: jobUrlMap.size });
    
    for (const [uuid, url] of jobUrlMap) {
      jobs.push({
        title: 'Position at AspenView', // Will be updated if we can extract better
        department: null,
        location: null,
        url,
        jobId: uuid,
      });
    }
  }

  return jobs;
}

interface SyncResult {
  jobsInFeed: number;
  jobsInserted: number;
  jobsUpdated: number;
  jobsDeactivated: number;
  durationMs: number;
  error?: string;
}

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  logger.info('Rippling Feed Sync Started');
  const startTime = Date.now();

  const supabase = getServiceClient();
  const result: SyncResult = {
    jobsInFeed: 0,
    jobsInserted: 0,
    jobsUpdated: 0,
    jobsDeactivated: 0,
    durationMs: 0,
  };

  try {
    // Get default category
    const { data: categories } = await supabase
      .from('job_categories')
      .select('id, name')
      .limit(100);

    if (!categories || categories.length === 0) {
      throw new Error('No job categories found');
    }

    // Build category name → id map
    const categoryMap = new Map(
      categories.map((c: any) => [c.name, c.id])
    );
    const defaultCategoryId = categories[0].id;

    // Get super admin ID
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'c@3bi.io')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      throw new Error('Super admin profile not found');
    }
    const superAdminId = profiles[0].id;

    // Scrape jobs from Rippling
    const scrapedJobs = await scrapeRipplingJobs();
    result.jobsInFeed = scrapedJobs.length;
    logger.info('Total jobs scraped from Rippling', { count: scrapedJobs.length });

    if (scrapedJobs.length === 0) {
      logger.info('No jobs scraped, checking consecutive empty syncs');

      const { data: recentLogs } = await supabase
        .from('feed_sync_logs')
        .select('jobs_in_feed')
        .eq('client_id', ASPENVIEW_CONFIG.clientId)
        .order('created_at', { ascending: false })
        .limit(3);

      const consecutiveEmpty = (recentLogs || []).filter((l: any) => l.jobs_in_feed === 0).length;
      const totalConsecutiveEmpty = consecutiveEmpty + 1;

      if (totalConsecutiveEmpty >= 3) {
        logger.warn('Feed empty for 3+ consecutive syncs, deactivating stale jobs');

        const { data: staleJobs } = await supabase
          .from('job_listings')
          .select('id')
          .eq('client_id', ASPENVIEW_CONFIG.clientId)
          .eq('organization_id', ASPENVIEW_CONFIG.organizationId)
          .eq('status', 'active');

        const staleIds = (staleJobs || []).map((j: any) => j.id);
        if (staleIds.length > 0) {
          const BATCH_SIZE = 50;
          for (let i = 0; i < staleIds.length; i += BATCH_SIZE) {
            const batch = staleIds.slice(i, i + BATCH_SIZE);
            const { error: deactErr } = await supabase
              .from('job_listings')
              .update({ status: 'inactive', updated_at: new Date().toISOString() })
              .in('id', batch);
            if (deactErr) {
              logger.error('Failed to deactivate stale jobs', deactErr);
            } else {
              result.jobsDeactivated += batch.length;
            }
          }
        }
      }
    } else {
      // Get existing active jobs for AspenView
      const { data: existingJobs } = await supabase
        .from('job_listings')
        .select('id, job_id, title, location, updated_at')
        .eq('client_id', ASPENVIEW_CONFIG.clientId)
        .eq('organization_id', ASPENVIEW_CONFIG.organizationId)
        .eq('status', 'active')
        .not('job_id', 'is', null);

      const existingJobMap = new Map(
        (existingJobs || []).map((j: any) => [j.job_id, j])
      );
      const feedJobIds = new Set<string>();

      // Process each scraped job
      for (const job of scrapedJobs) {
        feedJobIds.add(job.jobId);

        const locationData = parseLocation(job.location);
        const categoryName = mapDepartmentToCategory(job.department);
        const categoryId = categoryMap.get(categoryName) || defaultCategoryId;

        const jobData = {
          title: job.title || 'Untitled Position',
          job_summary: job.department ? `Department: ${job.department}` : null,
          location: locationData.location,
          city: locationData.city,
          state: locationData.state,
          remote_type: locationData.remote_type,
          job_type: 'full-time',
          status: 'active',
          user_id: superAdminId,
          organization_id: ASPENVIEW_CONFIG.organizationId,
          category_id: categoryId,
          url: job.url,
          apply_url: null as string | null,
          job_id: job.jobId,
          client_id: ASPENVIEW_CONFIG.clientId,
          client: ASPENVIEW_CONFIG.clientName,
          experience_level: null,
          salary_type: null,
          updated_at: new Date().toISOString(),
        };

        const existingJob = existingJobMap.get(job.jobId);

        if (existingJob) {
          // Update existing job
          const applyUrl = generateApplyUrl(existingJob.id);

          const { error: updateError } = await supabase
            .from('job_listings')
            .update({
              title: jobData.title,
              job_summary: jobData.job_summary,
              location: jobData.location,
              city: jobData.city,
              state: jobData.state,
              remote_type: jobData.remote_type,
              url: jobData.url,
              apply_url: applyUrl,
              category_id: jobData.category_id,
              updated_at: jobData.updated_at,
            })
            .eq('id', existingJob.id);

          if (updateError) {
            logger.error('Failed to update job', new Error(JSON.stringify(updateError)), { jobId: job.jobId });
          } else {
            result.jobsUpdated++;
          }
        } else {
          // Check for duplicates
          const { data: duplicates } = await supabase
            .from('job_listings')
            .select('id')
            .eq('job_id', job.jobId)
            .eq('client_id', ASPENVIEW_CONFIG.clientId)
            .limit(1);

          if (duplicates && duplicates.length > 0) {
            const applyUrl = generateApplyUrl(duplicates[0].id);
            await supabase
              .from('job_listings')
              .update({ ...jobData, apply_url: applyUrl })
              .eq('id', duplicates[0].id);
            result.jobsUpdated++;
          } else {
            // Insert new job
            const { data: newJob, error: insertError } = await supabase
              .from('job_listings')
              .insert(jobData)
              .select('id')
              .single();

            if (insertError) {
              logger.error('Failed to insert job', new Error(JSON.stringify(insertError)), { jobId: job.jobId });
            } else if (newJob) {
              const applyUrl = generateApplyUrl(newJob.id);
              await supabase
                .from('job_listings')
                .update({ apply_url: applyUrl })
                .eq('id', newJob.id);
              result.jobsInserted++;
            }
          }
        }
      }

      // Deactivate stale jobs
      const jobsToDeactivate = (existingJobs || [])
        .filter((j: any) => !feedJobIds.has(j.job_id))
        .map((j: any) => j.id);

      if (jobsToDeactivate.length > 0) {
        logger.info('Deactivating stale jobs', { count: jobsToDeactivate.length });
        const BATCH_SIZE = 50;
        for (let i = 0; i < jobsToDeactivate.length; i += BATCH_SIZE) {
          const batch = jobsToDeactivate.slice(i, i + BATCH_SIZE);
          const { error: deactErr } = await supabase
            .from('job_listings')
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
            .in('id', batch);
          if (!deactErr) {
            result.jobsDeactivated += batch.length;
          }
        }
      }
    }

    result.durationMs = Date.now() - startTime;

    // Log sync result
    await supabase
      .from('feed_sync_logs')
      .insert({
        client_id: ASPENVIEW_CONFIG.clientId,
        client_name: ASPENVIEW_CONFIG.clientName,
        feed_url: ASPENVIEW_CONFIG.feedUrl,
        jobs_in_feed: result.jobsInFeed,
        jobs_inserted: result.jobsInserted,
        jobs_updated: result.jobsUpdated,
        jobs_deactivated: result.jobsDeactivated,
        sync_duration_ms: result.durationMs,
        error: result.error || null,
        sync_type: 'scheduled',
      });

    logger.info('Rippling Feed Sync Complete', {
      inserted: result.jobsInserted,
      updated: result.jobsUpdated,
      deactivated: result.jobsDeactivated,
      durationMs: result.durationMs,
    });

    return successResponse(result, 'Rippling feeds synchronized successfully');

  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    result.durationMs = Date.now() - startTime;

    // Log the failed sync
    await supabase
      .from('feed_sync_logs')
      .insert({
        client_id: ASPENVIEW_CONFIG.clientId,
        client_name: ASPENVIEW_CONFIG.clientName,
        feed_url: ASPENVIEW_CONFIG.feedUrl,
        jobs_in_feed: result.jobsInFeed,
        jobs_inserted: result.jobsInserted,
        jobs_updated: result.jobsUpdated,
        jobs_deactivated: result.jobsDeactivated,
        sync_duration_ms: result.durationMs,
        error: result.error,
        sync_type: 'scheduled',
      });

    logger.error('Rippling Feed Sync Failed', error);
    throw error;
  }
}, { context: 'SyncRipplingFeeds', logRequests: true });

serve(handler);
