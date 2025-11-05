// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { corsHeaders, handleCorsPrelight } from '../_shared/cors.ts'
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts'
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts'
import { getServiceClient } from '../_shared/supabase-client.ts'
import { parseXMLFeed } from '../_shared/xml-parser.ts'

const importSchema = z.object({
  feedUrl: z.string().url(),
  organizationId: z.string().uuid(),
  clientId: z.string().uuid().nullable().optional()
})

const handler = wrapHandler(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPrelight(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    throw new ValidationError('POST method required');
  }

  const supabase = getServiceClient();

  // Validate request body
  const body = await req.json();
  const { feedUrl, organizationId, clientId = null } = importSchema.parse(body);

  console.log('Fetching jobs from feed:', feedUrl);
  console.log('Organization ID:', organizationId);

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
    console.error('Feed API error:', feedResponse.status, feedResponse.statusText, errorText);
    throw new Error(`Feed API error: ${feedResponse.status} ${feedResponse.statusText}`);
  }

  const contentType = feedResponse.headers.get('content-type');
  let jobs = [];
  
  const text = await feedResponse.text();
  console.log('Feed response received:', text.substring(0, 500) + '...');
  
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
    console.log(`Parsed ${jobs.length} jobs from XML feed`);
  } else {
    throw new ValidationError('Unsupported content type. Expected JSON or XML.');
  }

  console.log(`Found ${jobs.length} jobs to import`);

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
            console.log(`Found existing client: ${companyName}`);
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
              console.error('Error creating client:', clientError);
            } else if (newClient) {
              finalClientId = newClient.id;
              console.log(`Created new client: ${companyName}`);
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
          apply_url: job.url || null,
          job_id: job.referencenumber || null,
          client_id: finalClientId || null,
          // Keep client text field for backward compatibility
          client: job.company || null
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
          console.log(`Job already exists, skipping: ${jobData.title}`);
          continue;
        }

        const { error: insertError } = await supabase
          .from('job_listings')
          .insert(jobData);

        if (insertError) {
          console.error('Error inserting job:', insertError, jobData);
        } else {
          importedCount++;
          console.log(`Imported job: ${jobData.title}`);
        }
      } catch (jobError) {
        console.error('Error processing job:', jobError, job);
      }
    }

  console.log(`Successfully imported ${importedCount} jobs`);

  return successResponse(
    { imported: importedCount, total: jobs.length },
    `Successfully imported ${importedCount} jobs`
  );
}, { context: 'ImportJobsFromFeed', logRequests: true });

serve(handler)