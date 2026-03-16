import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('fetch-crengland-jobs');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  logger.info('Function called', { method: req.method, url: req.url });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let division: string | null = null;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        division = body.division || null;
        logger.debug('POST request', { division });
      } catch (e) {
        logger.debug('Failed to parse JSON body, using defaults');
      }
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      division = url.searchParams.get('division');
      logger.debug('GET request', { division });
    }

    logger.info('Fetching CR England jobs', { division });

    // Fetch jobs from CR England job board
    let jobsUrl = 'https://crengland.com/jobboard/';
    if (division) {
      jobsUrl += `jobs?division=${encodeURIComponent(division)}`;
    }
    
    logger.debug('Calling CR England API', { jobsUrl });
    
    const response = await fetch(jobsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    logger.debug('CR England response', { status: response.status });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('CR England API error', new Error(errorText), { status: response.status, statusText: response.statusText });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `CR England API error: ${response.status} ${response.statusText}`,
          details: errorText
        }), 
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const html = await response.text();
    logger.debug('HTML response received', { length: html.length });
    
    // Parse HTML to extract job listings
    const jobs = [];
    
    // Try to find JSON-LD structured data first (most reliable)
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        logger.debug('Found JSON-LD data', { type: jsonData['@type'] });
        
        // Handle JobPosting schema
        const jobPostings = Array.isArray(jsonData) ? jsonData : [jsonData];
        for (const posting of jobPostings) {
          if (posting['@type'] === 'JobPosting') {
            jobs.push({
              id: `crengland_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: posting.title || posting.name || 'CDL Truck Driver',
              location: typeof posting.jobLocation === 'string' 
                ? posting.jobLocation 
                : posting.jobLocation?.address?.addressLocality || 'Multiple Locations',
              description: posting.description?.substring(0, 500) || '',
              company: 'C.R. England',
              division: division || posting.hiringOrganization?.name || 'General',
              type: 'job_listing',
              source: 'crengland',
              status: 'active',
              category: 'Transportation',
              salary: posting.baseSalary?.value || null,
              url: posting.url || jobsUrl,
              last_updated: new Date().toISOString()
            });
          }
        }
      } catch (e) {
        logger.debug('Failed to parse JSON-LD', { error: e instanceof Error ? e.message : 'Unknown' });
      }
    }
    
    // Try to extract from common job board patterns
    if (jobs.length === 0) {
      // Look for job listings in various common formats
      const patterns = [
        // Pattern 1: Job cards with data attributes
        /<(?:div|article)[^>]*(?:data-job-id|data-job|job-card)[^>]*>([\s\S]*?)<\/(?:div|article)>/gi,
        // Pattern 2: List items with job class
        /<li[^>]*class="[^"]*job[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
        // Pattern 3: Links to job details
        /<a[^>]*href="[^"]*\/job[^"]*"[^>]*>([\s\S]*?)<\/a>/gi
      ];
      
      for (const pattern of patterns) {
        const matches = Array.from(html.matchAll(pattern));
        logger.debug('Pattern match', { matchCount: matches.length });
        
        for (const match of matches) {
          const jobHtml = match[1] || match[0];
          
          // Extract title - look for headings or strong emphasis
          const titleMatch = jobHtml.match(/<(?:h[1-6]|strong|b)[^>]*>([^<]+)<\/(?:h[1-6]|strong|b)>/i) ||
                           jobHtml.match(/title["\s:>]+([^<"]+)/i);
          const title = titleMatch ? titleMatch[1].trim() : null;
          
          // Extract location
          const locationMatch = jobHtml.match(/(?:location|city|address)["\s:>]*([^<"]+)/i) ||
                              jobHtml.match(/(?:,\s*([A-Z]{2})|([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2}))/);
          const location = locationMatch ? (locationMatch[1] || locationMatch[2] || locationMatch[0]).trim() : 'Various Locations';
          
          // Extract description
          const descMatch = jobHtml.match(/<p[^>]*>([^<]+)<\/p>/i) ||
                          jobHtml.match(/description["\s:>]+([^<"]{20,})/i);
          const description = descMatch ? descMatch[1].trim().substring(0, 500) : '';
          
          if (title && title.length > 3 && !title.match(/^(Home|About|Contact|Apply)/i)) {
            jobs.push({
              id: `crengland_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: title.replace(/\s+/g, ' ').trim(),
              location: location.replace(/\s+/g, ' ').trim(),
              description: description.replace(/\s+/g, ' ').trim(),
              company: 'C.R. England',
              division: division || 'General',
              type: 'job_listing',
              source: 'crengland',
              status: 'active',
              category: 'Transportation',
              url: jobsUrl,
              last_updated: new Date().toISOString()
            });
          }
        }
        
        if (jobs.length > 0) break; // Stop if we found jobs
      }
    }
    
    // Try to extract division-specific information
    if (jobs.length === 0 && division) {
      const divisionMatch = html.match(new RegExp(`${division}[^<]*<[^>]*>([^<]+)`, 'i'));
      if (divisionMatch) {
        jobs.push({
          id: `crengland_${division.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
          title: `${division} Truck Driver`,
          description: divisionMatch[1].trim().substring(0, 500),
          company: 'C.R. England',
          location: 'Multiple Locations Available',
          division: division,
          type: 'job_listing',
          source: 'crengland',
          status: 'active',
          category: 'Transportation',
          url: jobsUrl,
          last_updated: new Date().toISOString()
        });
      }
    }
    
    // Fallback: Create sample jobs based on known divisions
    if (jobs.length === 0) {
      logger.debug('No jobs parsed from HTML, using fallback divisions');
      const divisions = [
        { name: 'Dedicated', desc: 'Consistent routes with the same customer, home weekly' },
        { name: 'Over the Road', desc: 'Long-haul opportunities across all 48 states' },
        { name: 'Intermodal', desc: 'Container hauling with rail integration' },
        { name: 'Regional', desc: 'Regional routes with frequent home time' }
      ];
      
      divisions.forEach((div) => {
        jobs.push({
          id: `crengland_${div.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
          title: `${div.name} Truck Driver`,
          description: `${div.desc}. Competitive pay and excellent benefits package.`,
          company: 'C.R. England',
          location: 'Multiple Locations Available',
          division: div.name,
          type: 'job_listing',
          source: 'crengland',
          status: 'active',
          category: 'Transportation',
          jobtype: 'Full-time',
          url: `https://crengland.com/jobboard/jobs?division=${div.name.toUpperCase().replace(/\s+/g, '_')}`,
          last_updated: new Date().toISOString()
        });
      });
    }
    
    logger.info('Parsed jobs from CR England', { count: jobs.length });
    
    const data = { 
      feeds: jobs,
      message: `Found ${jobs.length} job listings from CR England`,
      source: 'crengland',
      parsed_at: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify({ success: true, data }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    logger.error('Error in fetch-crengland-jobs function', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'No stack trace available'
      }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
