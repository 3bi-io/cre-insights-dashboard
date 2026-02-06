// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { getCorsHeaders } from '../_shared/cors-config.ts'
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts'
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts'
import { getServiceClient } from '../_shared/supabase-client.ts'
import { parseXMLFeed } from '../_shared/xml-parser.ts'
import { createLogger } from '../_shared/logger.ts'

const logger = createLogger('import-jobs-from-feed');

const importSchema = z.object({
  feedUrl: z.string().url(),
  organizationId: z.string().uuid(),
  clientId: z.string().uuid().nullable().optional()
})

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    throw new ValidationError('POST method required');
  }

  const supabase = getServiceClient();

  // Validate request body
  const body = await req.json();
  const { feedUrl, organizationId, clientId = null } = importSchema.parse(body);

  logger.info('Fetching jobs from feed', { feedUrl, organizationId });

  // Fetch jobs from the feed
  const feedResponse = await fetch(feedUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Supabase-Edge-Function/1.0',
      'Accept': 'application/json, text/plain, */*',
    },
  });

  if (!feedResponse.ok) {
    const errorText = await feedResponse.text();
    logger.error('Feed API error', { status: feedResponse.status, statusText: feedResponse.statusText, errorText });
    throw new Error(`Feed API error: ${feedResponse.status} ${feedResponse.statusText}`);
  }

  const contentType = feedResponse.headers.get('content-type');
  let jobs = [];
  
  const text = await feedResponse.text();
  logger.debug('Feed response received', { preview: text.substring(0, 200) });
  
  if (contentType?.includes('application/json')) {
    const feedData = JSON.parse(text);
    if (Array.isArray(feedData)) {
      jobs = feedData;
    } else if (feedData.jobs && Array.isArray(feedData.jobs)) {
      jobs = feedData.jobs;
    } else if (feedData.data && Array.isArray(feedData.data)) {
      jobs = feedData.data;
    } else if (typeof feedData === 'object' && feedData !== null) {
      jobs = [feedData];
    }
  } else if (contentType?.includes('xml') || text.trim().startsWith('<?xml')) {
    // Parse XML feed using shared utility
    jobs = parseXMLFeed(text);
    logger.info('Parsed jobs from XML feed', { count: jobs.length });
  } else {
    throw new ValidationError('Unsupported content type. Expected JSON or XML.');
  }

  logger.info('Found jobs to import', { count: jobs.length });

  if (jobs.length === 0) {
    return successResponse(
      { imported: 0, total: 0 },
      'No jobs found in feed'
    );
  }

  // Get default category for jobs
  const { data: categories, error: categoryError } = await supabase
    .from('job_categories')
    .select('id')
    .limit(1);

  if (categoryError || !categories || categories.length === 0) {
    throw new Error('No job categories found');
  }

  const defaultCategoryId = categories[0].id;

  // Get super admin user ID for creating jobs
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'c@3bi.io')
    .limit(1);

  if (profileError || !profiles || profiles.length === 0) {
    throw new Error('Super admin profile not found');
  }

  const superAdminId = profiles[0].id;
  let importedCount = 0;

  /**
   * Generate internal apply URL with UTM parameters for imported jobs
   */
  const generateApplyUrl = (jobListingId: string, clientName: string): string => {
    const baseUrl = 'https://ats.me/apply';
    
    // Generate campaign name from client
    const clientSlug = (clientName || 'unknown')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 30);
    
    const quarter = `q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
    const year = new Date().getFullYear();
    const campaign = `${clientSlug}_import_${quarter}_${year}`;
    
    const params = new URLSearchParams({
      job_id: jobListingId,
      utm_source: 'job_feed_import',
      utm_medium: 'import',
      utm_campaign: campaign,
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Import each job
  for (const job of jobs) {
    try {
        // Map XML fields to database schema
        const location = job.city && job.state ? `${job.city}, ${job.state}` : 
                        job.city || job.state || null;
        
        // Handle client_id: if not provided, find or create client based on company name
        let finalClientId = clientId;
        if (!finalClientId && job.company) {
          const companyName = job.company.trim();
          
          // Try to find existing client
          const { data: existingClients } = await supabase
            .from('clients')
            .select('id')
            .eq('organization_id', organizationId)
            .ilike('name', companyName)
            .limit(1);
          
          if (existingClients && existingClients.length > 0) {
            finalClientId = existingClients[0].id;
            logger.debug('Found existing client', { companyName });
          } else {
            // Create new client
            const { data: newClient, error: clientError } = await supabase
              .from('clients')
              .insert({
                name: companyName,
                status: 'active',
                organization_id: organizationId,
                notes: 'Auto-created from job feed import'
              })
              .select('id')
              .single();
            
            if (clientError) {
              logger.error('Error creating client', clientError);
            } else if (newClient) {
              finalClientId = newClient.id;
              logger.debug('Created new client', { companyName });
            }
          }
        }
        
        // If still no client_id, use "Unassigned" (will be handled by trigger)
        const jobData = {
          title: job.title || 'Untitled Position',
          job_summary: job.description || null,
          location: location,
          city: job.city || null,
          state: job.state || null,
          salary_min: job.salary_min || null,
          salary_max: job.salary_max || null,
          salary_type: job.salary_type || 'yearly',
          experience_level: job.experience || null,
          remote_type: 'on-site', // Default for trucking jobs (must match DB constraint)
          job_type: job.jobtype === 'Full-time' ? 'full-time' : 'full-time',
          status: 'active',
          user_id: superAdminId,
          organization_id: organizationId,
          category_id: defaultCategoryId,
          url: job.url || null,
          // apply_url will be set after insert with UTM-enriched URL
          apply_url: null as string | null,
          job_id: job.referencenumber || null,
          client_id: finalClientId || null,
          // Keep client text field for backward compatibility
          client: job.company || null,
          // Sponsorship tracking from jobreferrer field
          jobreferrer: job.jobreferrer || null,
          is_sponsored: job.is_sponsored ?? false,
        };

        // Check if job already exists by reference number or title + location
        let existingJob = null;
        if (job.referencenumber) {
          const { data: existing } = await supabase
            .from('job_listings')
            .select('id')
            .eq('job_id', job.referencenumber)
            .eq('organization_id', organizationId)
            .limit(1);
          existingJob = existing?.[0];
        }

        if (!existingJob && jobData.title && jobData.location) {
          const { data: existing } = await supabase
            .from('job_listings')
            .select('id')
            .eq('title', jobData.title)
            .eq('location', jobData.location)
            .eq('organization_id', organizationId)
            .limit(1);
          existingJob = existing?.[0];
        }

        if (existingJob) {
          // Update existing job with UTM-enriched apply URL
          const applyUrl = generateApplyUrl(existingJob.id, job.company || 'imported');
          await supabase
            .from('job_listings')
            .update({ apply_url: applyUrl, updated_at: new Date().toISOString() })
            .eq('id', existingJob.id);
          
          logger.debug('Updated existing job with UTM apply URL', { title: jobData.title });
          continue;
        }

        const { data: newJob, error: insertError } = await supabase
          .from('job_listings')
          .insert(jobData)
          .select('id')
          .single();

        if (insertError) {
          logger.error('Error inserting job', insertError, { title: jobData.title });
        } else if (newJob) {
          // Update with UTM-enriched apply URL now that we have the ID
          const applyUrl = generateApplyUrl(newJob.id, job.company || 'imported');
          await supabase
            .from('job_listings')
            .update({ apply_url: applyUrl })
            .eq('id', newJob.id);
          
          importedCount++;
          logger.debug('Imported job with UTM apply URL', { title: jobData.title, applyUrl });
        }
      } catch (jobError) {
        logger.error('Error processing job', jobError);
      }
    }

  logger.info('Import complete', { imported: importedCount });

  return successResponse(
    { imported: importedCount, total: jobs.length },
    `Successfully imported ${importedCount} jobs`
  );
}, { context: 'ImportJobsFromFeed', logRequests: true });

serve(handler)