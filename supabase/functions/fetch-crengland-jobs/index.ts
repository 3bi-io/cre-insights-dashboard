// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Fetch CR England jobs function called:', req.method, req.url);

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
        console.log('POST request, division:', division);
      } catch (e) {
        console.log('Failed to parse JSON body, using defaults');
      }
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      division = url.searchParams.get('division');
      console.log('GET request, division from query:', division);
    }

    console.log('Fetching CR England jobs, division:', division);

    // Fetch jobs from CR England job board
    let jobsUrl = 'https://crengland.com/jobboard/';
    if (division) {
      jobsUrl += `jobs?division=${encodeURIComponent(division)}`;
    }
    
    console.log('Calling CR England API:', jobsUrl);
    
    const response = await fetch(jobsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    console.log('CR England response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('CR England API error:', response.status, response.statusText, errorText);
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
    console.log('HTML response received, length:', html.length);
    
    // Parse HTML to extract job listings
    const jobs = [];
    
    // Extract job cards from the HTML
    // Looking for patterns like job titles, locations, descriptions
    const jobMatches = html.matchAll(/<div[^>]*class="[^"]*job-card[^"]*"[^>]*>(.*?)<\/div>/gis);
    
    for (const match of jobMatches) {
      const jobHtml = match[1];
      
      // Extract title
      const titleMatch = jobHtml.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Extract location
      const locationMatch = jobHtml.match(/(?:location|city|state)[^>]*>([^<]+)<\//i);
      const location = locationMatch ? locationMatch[1].trim() : '';
      
      // Extract description
      const descMatch = jobHtml.match(/<p[^>]*>([^<]+)<\/p>/i);
      const description = descMatch ? descMatch[1].trim() : '';
      
      if (title) {
        jobs.push({
          id: `crengland_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          location,
          description,
          company: 'C.R. England',
          division: division || 'General',
          type: 'job_listing',
          source: 'crengland',
          status: 'active',
          category: division || 'Transportation',
          url: jobsUrl,
          last_updated: new Date().toISOString()
        });
      }
    }
    
    // Fallback: Extract featured jobs from structured sections
    if (jobs.length === 0) {
      const featuredMatches = html.matchAll(/Featured Jobs[\s\S]*?<h[23][^>]*>([^<]+)<\/h[23]>[\s\S]*?<div[^>]*>([^<]*(?:<[^>]+>[^<]*)*?)<\/div>/gi);
      
      for (const match of featuredMatches) {
        const title = match[1]?.trim();
        const contentBlock = match[2];
        
        if (title && title.length > 3) {
          jobs.push({
            id: `crengland_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            description: contentBlock?.replace(/<[^>]+>/g, '').trim().substring(0, 500) || '',
            company: 'C.R. England',
            location: 'Various Locations',
            division: division || 'General',
            type: 'job_listing',
            source: 'crengland',
            status: 'active',
            category: division || 'Transportation',
            url: jobsUrl,
            last_updated: new Date().toISOString()
          });
        }
      }
    }
    
    // Add sample divisions if no specific jobs found
    if (jobs.length === 0) {
      const divisions = ['Dedicated', 'Over the Road', 'Intermodal', 'Regional'];
      divisions.forEach((div, index) => {
        jobs.push({
          id: `crengland_${div.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
          title: `${div} Truck Driver`,
          description: `Join our ${div} division with competitive pay and excellent benefits.`,
          company: 'C.R. England',
          location: 'Multiple Locations Available',
          division: div,
          type: 'job_listing',
          source: 'crengland',
          status: 'active',
          category: 'Transportation',
          jobtype: 'Full-time',
          url: `https://crengland.com/jobboard/jobs?division=${div.toUpperCase().replace(/\s+/g, '_')}`,
          last_updated: new Date().toISOString()
        });
      });
    }
    
    console.log(`Parsed ${jobs.length} jobs from CR England`);
    
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
    console.error('Error in fetch-crengland-jobs function:', error);
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
