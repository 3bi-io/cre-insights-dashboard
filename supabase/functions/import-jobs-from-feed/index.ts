// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Import jobs from feed function called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let feedUrl: string;
    let organizationId: string;
    
    if (req.method === 'POST') {
      const body = await req.json();
      feedUrl = body.feedUrl;
      organizationId = body.organizationId;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'POST method required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!feedUrl || !organizationId) {
      return new Response(
        JSON.stringify({ success: false, error: 'feedUrl and organizationId are required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Feed API error: ${feedResponse.status} ${feedResponse.statusText}`,
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = feedResponse.headers.get('content-type');
    let jobs = [];
    
    const text = await feedResponse.text();
    console.log('Feed response received:', text.substring(0, 500) + '...');
    
    if (contentType?.includes('application/json')) {
      try {
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
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid JSON response from feed' }), 
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (contentType?.includes('xml') || text.trim().startsWith('<?xml')) {
      // Parse XML feed
      try {
        // Extract job elements from XML using regex
        const jobMatches = text.matchAll(/<job>(.*?)<\/job>/gs);
        
        for (const match of jobMatches) {
          const jobXml = match[1];
          
          // Extract fields from each job XML
          const extractField = (field: string) => {
            const regex = new RegExp(`<${field}><!\\[CDATA\\[(.*?)\\]\\]><\/${field}>`, 'i');
            const match = jobXml.match(regex);
            if (match) return match[1].trim();
            
            // Fallback for non-CDATA fields
            const simpleRegex = new RegExp(`<${field}>(.*?)<\/${field}>`, 'i');
            const simpleMatch = jobXml.match(simpleRegex);
            return simpleMatch ? simpleMatch[1].trim() : null;
          };
          
          // Parse salary from format like "$65000 - $80000 per year"
          const parseSalaryRange = (salaryText: string) => {
            if (!salaryText) return { min: null, max: null, type: 'yearly' };
            
            const match = salaryText.match(/\$(\d+)(?:,(\d+))?\s*-\s*\$(\d+)(?:,(\d+))?\s+per\s+(\w+)/i);
            if (match) {
              const minSalary = parseInt(match[1] + (match[2] || ''));
              const maxSalary = parseInt(match[3] + (match[4] || ''));
              const period = match[5].toLowerCase();
              
              return {
                min: minSalary,
                max: maxSalary,
                type: period === 'year' ? 'yearly' : period === 'hour' ? 'hourly' : 'yearly'
              };
            }
            
            return { min: null, max: null, type: 'yearly' };
          };
          
          const salary = parseSalaryRange(extractField('salary'));
          
          jobs.push({
            title: extractField('title'),
            description: extractField('description'),
            company: extractField('company'),
            city: extractField('city'),
            state: extractField('state'),
            url: extractField('url'),
            phone: extractField('phone'),
            salary: extractField('salary'),
            salary_min: salary.min,
            salary_max: salary.max,
            salary_type: salary.type,
            jobtype: extractField('jobtype'),
            category: extractField('category'),
            referencenumber: extractField('referencenumber'),
            experience: extractField('experience'),
            education: extractField('education'),
            country: extractField('country'),
            postalcode: extractField('postalcode')
          });
        }
        
        console.log(`Parsed ${jobs.length} jobs from XML feed`);
        
      } catch (error) {
        console.error('Error parsing XML:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to parse XML feed' }), 
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Unsupported content type. Expected JSON or XML.' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${jobs.length} jobs to import`);

    if (jobs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No jobs found in feed',
          imported: 0
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get default category for jobs
    const { data: categories, error: categoryError } = await supabase
      .from('job_categories')
      .select('id')
      .limit(1);

    if (categoryError || !categories || categories.length === 0) {
      console.error('Error getting job category:', categoryError);
      return new Response(
        JSON.stringify({ success: false, error: 'No job categories found' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const defaultCategoryId = categories[0].id;

    // Get super admin user ID for creating jobs
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'c@3bi.io')
      .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
      console.error('Error getting super admin profile:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Super admin profile not found' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const superAdminId = profiles[0].id;
    let importedCount = 0;

    // Import each job
    for (const job of jobs) {
      try {
        // Map XML fields to database schema
        const location = job.city && job.state ? `${job.city}, ${job.state}` : 
                        job.city || job.state || null;
        
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
          client: job.company || 'Hayes Recruiting Solutions'
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${importedCount} jobs`,
        imported: importedCount,
        total: jobs.length
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in import-jobs-from-feed function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})