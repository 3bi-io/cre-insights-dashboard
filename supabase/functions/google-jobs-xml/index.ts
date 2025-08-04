import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user_id from query params or auth header
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    
    if (!userId) {
      return new Response('Missing user_id parameter', { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    console.log('Generating Google Jobs XML feed for user:', userId);

    // Fetch active job listings for the user
    const { data: jobListings, error } = await supabase
      .from('job_listings')
      .select(`
        id,
        title,
        job_summary,
        location,
        city,
        state,
        salary_min,
        salary_max,
        salary_type,
        job_type,
        experience_level,
        apply_url,
        created_at,
        updated_at,
        status,
        client
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching job listings:', error);
      return new Response('Error fetching job listings', { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    console.log(`Found ${jobListings?.length || 0} active job listings`);

    // Generate XML feed
    const xmlContent = generateGoogleJobsXML(jobListings || [], userId);

    // Log the feed generation
    const { error: logError } = await supabase
      .from('background_tasks')
      .insert({
        user_id: userId,
        task_type: 'google_jobs_xml_generation',
        status: 'completed',
        parameters: { job_count: jobListings?.length || 0 },
        results: { xml_length: xmlContent.length }
      });

    if (logError) {
      console.error('Error logging feed generation:', logError);
    }

    return new Response(xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error in google-jobs-xml function:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
    });
  }
});

function generateGoogleJobsXML(jobListings: any[], userId: string): string {
  const currentDate = new Date().toISOString();
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Job Listings Feed - User ${userId}</title>
    <description>Active job listings for Google Jobs integration</description>
    <link>https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/google-jobs-xml?user_id=${userId}</link>
    <language>en-US</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <generator>Lovable Job Feed Generator</generator>
`;

  jobListings.forEach(job => {
    const jobTitle = escapeXML(job.title || 'Position Available');
    const jobDescription = escapeXML(job.job_summary || 'Job opportunity available. Contact us for more details.');
    const location = formatLocation(job.location, job.city, job.state);
    const company = escapeXML(job.client || 'Hiring Company');
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
    const jobType = formatJobType(job.job_type);
    const experienceLevel = formatExperienceLevel(job.experience_level);
    const applyUrl = job.apply_url || `https://apply.example.com/job/${job.id}`;
    const datePosted = new Date(job.created_at).toISOString();
    const validThrough = getValidThroughDate(job.created_at);

    xml += `
    <item>
      <title>${jobTitle}</title>
      <description><![CDATA[${jobDescription}]]></description>
      <link>${escapeXML(applyUrl)}</link>
      <guid isPermaLink="false">job-${job.id}</guid>
      <pubDate>${datePosted}</pubDate>
      
      <!-- Google Jobs specific fields -->
      <g:job_title>${jobTitle}</g:job_title>
      <g:job_description><![CDATA[${jobDescription}]]></g:job_description>
      <g:job_location>${escapeXML(location)}</g:job_location>
      <g:company_name>${company}</g:company_name>
      <g:job_type>${jobType}</g:job_type>
      <g:experience_level>${experienceLevel}</g:experience_level>
      <g:application_url>${escapeXML(applyUrl)}</g:application_url>
      <g:date_posted>${datePosted}</g:date_posted>
      <g:valid_through>${validThrough}</g:valid_through>
      ${salary ? `<g:salary>${escapeXML(salary)}</g:salary>` : ''}
      <g:job_id>job-${job.id}</g:job_id>
    </item>`;
  });

  xml += `
  </channel>
</rss>`;

  return xml;
}

function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatLocation(location?: string, city?: string, state?: string): string {
  if (location) return location;
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return 'Location TBD';
}

function formatSalary(min?: number, max?: number, type?: string): string {
  if (!min && !max) return '';
  
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const period = type === 'hourly' ? ' per hour' : type === 'weekly' ? ' per week' : ' per year';
  
  if (min && max) {
    return `${formatAmount(min)} - ${formatAmount(max)}${period}`;
  } else if (min) {
    return `${formatAmount(min)}+${period}`;
  } else if (max) {
    return `Up to ${formatAmount(max)}${period}`;
  }
  
  return '';
}

function formatJobType(jobType?: string): string {
  if (!jobType) return 'FULL_TIME';
  
  const typeMap: { [key: string]: string } = {
    'full-time': 'FULL_TIME',
    'part-time': 'PART_TIME',
    'contract': 'CONTRACTOR',
    'temporary': 'TEMPORARY',
    'internship': 'INTERN',
    'volunteer': 'VOLUNTEER'
  };
  
  return typeMap[jobType.toLowerCase()] || 'FULL_TIME';
}

function formatExperienceLevel(experienceLevel?: string): string {
  if (!experienceLevel) return 'ENTRY_LEVEL';
  
  const levelMap: { [key: string]: string } = {
    'entry': 'ENTRY_LEVEL',
    'entry-level': 'ENTRY_LEVEL',
    'mid': 'MID_LEVEL',
    'mid-level': 'MID_LEVEL',
    'senior': 'SENIOR_LEVEL',
    'senior-level': 'SENIOR_LEVEL',
    'executive': 'EXECUTIVE',
    'director': 'DIRECTOR'
  };
  
  return levelMap[experienceLevel.toLowerCase()] || 'ENTRY_LEVEL';
}

function getValidThroughDate(createdAt: string): string {
  const created = new Date(createdAt);
  const validThrough = new Date(created.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from creation
  return validThrough.toISOString();
}