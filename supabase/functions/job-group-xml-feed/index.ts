import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { jobGroupId } = await req.json();

    if (!jobGroupId) {
      return new Response(
        JSON.stringify({ error: 'Job Group ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Generating XML feed for job group:', jobGroupId);

    // Get job group details
    const { data: jobGroup, error: jobGroupError } = await supabase
      .from('job_groups')
      .select('*, campaigns(*)')
      .eq('id', jobGroupId)
      .single();

    if (jobGroupError || !jobGroup) {
      console.error('Job group not found:', jobGroupError);
      return new Response(
        JSON.stringify({ error: 'Job group not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get job assignments for this group
    const { data: assignments, error: assignmentsError } = await supabase
      .from('job_group_assignments')
      .select(`
        job_listings (
          id,
          title,
          job_summary,
          location,
          city,
          state,
          job_type,
          salary_min,
          salary_max,
          salary_type,
          experience_level,
          apply_url,
          url,
          created_at,
          job_categories (
            name
          )
        )
      `)
      .eq('job_group_id', jobGroupId);

    if (assignmentsError) {
      console.error('Error fetching job assignments:', assignmentsError);
      return new Response(
        JSON.stringify({ error: 'Error fetching job assignments' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const jobs = assignments?.map(a => a.job_listings).filter(Boolean) || [];
    console.log(`Found ${jobs.length} jobs for job group ${jobGroup.name}`);

    // Generate XML feed based on publisher
    let xmlContent = '';
    const publisherName = jobGroup.publisher_name.toLowerCase();

    if (publisherName.includes('google') || publisherName.includes('jobs')) {
      xmlContent = generateGoogleJobsXML(jobs, jobGroup);
    } else if (publisherName.includes('indeed')) {
      xmlContent = generateIndeedXML(jobs, jobGroup);
    } else {
      // Generic XML feed
      xmlContent = generateGenericJobFeedXML(jobs, jobGroup);
    }

    // Generate public URL for the feed
    const feedUrl = `${supabaseUrl}/functions/v1/job-group-xml-feed?id=${jobGroupId}`;

    return new Response(
      JSON.stringify({ 
        xml: xmlContent,
        url: feedUrl,
        jobCount: jobs.length,
        publisher: jobGroup.publisher_name
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error generating XML feed:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Generate Google Jobs XML format
function generateGoogleJobsXML(jobs: any[], jobGroup: any): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`;

  const jobsXML = jobs.map(job => {
    return `  <url>
    <loc>${escapeXml(job.apply_url || job.url || '#')}</loc>
    <lastmod>${new Date(job.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  return `${xmlHeader}
<!-- Job Group: ${escapeXml(jobGroup.name)} -->
<!-- Publisher: ${escapeXml(jobGroup.publisher_name)} -->
<!-- Generated: ${new Date().toISOString()} -->
<!-- Job Count: ${jobs.length} -->

${jobsXML}
</urlset>`;
}

// Generate Indeed XML format
function generateIndeedXML(jobs: any[], jobGroup: any): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<source>`;

  const jobsXML = jobs.map(job => {
    return `  <job>
    <title>${escapeXml(job.title)}</title>
    <date>${new Date(job.created_at).toISOString().split('T')[0]}</date>
    <referencenumber>${escapeXml(job.id)}</referencenumber>
    <url>${escapeXml(job.apply_url || job.url || '#')}</url>
    <company>${escapeXml(jobGroup.campaigns?.name || 'Company')}</company>
    <city>${escapeXml(job.city || '')}</city>
    <state>${escapeXml(job.state || '')}</state>
    <country>US</country>
    <postalcode></postalcode>
    <description><![CDATA[${job.job_summary || job.title}]]></description>
    <salary>${formatSalary(job.salary_min, job.salary_max, job.salary_type)}</salary>
    <education></education>
    <jobtype>${formatJobType(job.job_type)}</jobtype>
    <category>${escapeXml(job.job_categories?.name || 'General')}</category>
    <experience>${formatExperienceLevel(job.experience_level)}</experience>
  </job>`;
  }).join('\n');

  return `${xmlHeader}
<!-- Job Group: ${escapeXml(jobGroup.name)} -->
<!-- Publisher: ${escapeXml(jobGroup.publisher_name)} -->
<!-- Generated: ${new Date().toISOString()} -->
<!-- Job Count: ${jobs.length} -->

${jobsXML}
</source>`;
}

// Generate generic XML feed
function generateGenericJobFeedXML(jobs: any[], jobGroup: any): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<jobs>`;

  const jobsXML = jobs.map(job => {
    return `  <job>
    <id>${escapeXml(job.id)}</id>
    <title>${escapeXml(job.title)}</title>
    <description><![CDATA[${job.job_summary || job.title}]]></description>
    <location>${escapeXml(formatLocation(job.location, job.city, job.state))}</location>
    <category>${escapeXml(job.job_categories?.name || 'General')}</category>
    <job_type>${escapeXml(job.job_type || 'Full-time')}</job_type>
    <experience_level>${escapeXml(job.experience_level || 'Entry Level')}</experience_level>
    <salary>${formatSalary(job.salary_min, job.salary_max, job.salary_type)}</salary>
    <apply_url>${escapeXml(job.apply_url || job.url || '#')}</apply_url>
    <posted_date>${new Date(job.created_at).toISOString().split('T')[0]}</posted_date>
  </job>`;
  }).join('\n');

  return `${xmlHeader}
<!-- Job Group: ${escapeXml(jobGroup.name)} -->
<!-- Publisher: ${escapeXml(jobGroup.publisher_name)} -->  
<!-- Campaign: ${escapeXml(jobGroup.campaigns?.name || 'N/A')} -->
<!-- Generated: ${new Date().toISOString()} -->
<!-- Job Count: ${jobs.length} -->

${jobsXML}
</jobs>`;
}

// Helper functions
function formatLocation(location?: string, city?: string, state?: string): string {
  if (location) return location;
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return 'Remote';
}

function formatSalary(min?: number, max?: number, type?: string): string {
  if (!min && !max) return '';
  
  const period = type === 'hourly' ? '/hour' : '/year';
  
  if (min && max) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}${period}`;
  } else if (min) {
    return `$${min.toLocaleString()}+${period}`;
  } else if (max) {
    return `Up to $${max.toLocaleString()}${period}`;
  }
  
  return '';
}

function formatJobType(jobType?: string): string {
  if (!jobType) return 'fulltime';
  
  const typeMap: { [key: string]: string } = {
    'full-time': 'fulltime',
    'full_time': 'fulltime',
    'part-time': 'parttime', 
    'part_time': 'parttime',
    'contract': 'contract',
    'temporary': 'temporary',
    'intern': 'internship',
    'internship': 'internship'
  };
  
  return typeMap[jobType.toLowerCase()] || 'fulltime';
}

function formatExperienceLevel(experienceLevel?: string): string {
  if (!experienceLevel) return 'entry_level';
  
  const levelMap: { [key: string]: string } = {
    'entry level': 'entry_level',
    'entry-level': 'entry_level', 
    'mid level': 'mid_level',
    'mid-level': 'mid_level',
    'senior level': 'senior_level',
    'senior-level': 'senior_level',
    'executive': 'executive'
  };
  
  return levelMap[experienceLevel.toLowerCase()] || 'entry_level';
}

function escapeXml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';
  
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}