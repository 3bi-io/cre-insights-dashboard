// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('[FETCH_FEEDS] Request:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Server-side authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[FETCH_FEEDS] Authenticated user:', user.id);

    // Check user role - require admin or super_admin
    const { data: roleData } = await supabase.rpc('get_current_user_role');
    const userRole = roleData as string;

    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[FETCH_FEEDS] Authorized role:', userRole);

  try {
    let user: string = '*'; // Default to '*'
    let board: string | null = null;
    
    // Handle both GET and POST requests
    if (req.method === 'GET') {
      const url = new URL(req.url);
      user = url.searchParams.get('user') || '*';
      board = url.searchParams.get('board');
      console.log('GET request, user from query:', user, 'board:', board);
    } else if (req.method === 'POST') {
      try {
        const body = await req.json();
        user = body.user || '*';
        board = body.board || null;
        console.log('POST request, user from body:', user, 'board:', board);
      } catch (e) {
        console.log('Failed to parse JSON body, using defaults');
        user = '*';
        board = null;
      }
    }

    console.log('Fetching feeds for user:', user, 'board:', board);

    // Fetch feeds from the external API
    let feedsUrl = `https://cdljobcast.com/client/recruiting/getfeeds?user=${encodeURIComponent(user)}`;
    if (board) {
      feedsUrl += `&board=${encodeURIComponent(board)}`;
    }
    console.log('Calling external API:', feedsUrl);
    
    const response = await fetch(feedsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Supabase-Edge-Function/1.0',
        'Accept': 'application/json, text/plain, */*',
      },
    });
    
    console.log('External API response status:', response.status);
    console.log('External API response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', response.status, response.statusText, errorText);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `External API error: ${response.status} ${response.statusText}`,
          details: errorText
        }), 
        { 
          status: 200, // Return 200 so frontend can handle the error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);
    
    let data;
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log('Non-JSON response received:', text.substring(0, 500) + '...');
      
      // Parse XML response for job listings
      if (contentType?.includes('xml') || text.trim().startsWith('<?xml')) {
        try {
          // Extract jobs from XML
          const jobMatches = text.matchAll(/<job>(.*?)<\/job>/gs);
          const feeds = [];
          
          for (const match of jobMatches) {
            const jobXml = match[1];
            
            // Extract fields from XML
            const extractField = (field: string) => {
              const regex = new RegExp(`<${field}><!\\[CDATA\\[(.*?)\\]\\]><\/${field}>`, 'i');
              const cdataMatch = jobXml.match(regex);
              if (cdataMatch) return cdataMatch[1].trim();
              
              const simpleRegex = new RegExp(`<${field}>(.*?)<\/${field}>`, 'i');
              const simpleMatch = jobXml.match(simpleRegex);
              return simpleMatch ? simpleMatch[1].trim() : '';
            };
            
            // Parse as job listing
            const job = {
              id: extractField('referencenumber') || extractField('id') || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: extractField('title') || extractField('job_title') || '',
              description: extractField('description') || extractField('notes') || '',
              company: extractField('company') || '',
              location: extractField('city') ? `${extractField('city')}, ${extractField('state')}` : extractField('location') || '',
              city: extractField('city') || '',
              state: extractField('state') || '',
              url: extractField('url') || extractField('link') || '',
              source: extractField('source') || 'CDL Job Cast',
              referencenumber: extractField('referencenumber') || extractField('id') || '',
              date: extractField('date') || '',
              status: 'active',
              type: 'job_listing',
              last_updated: new Date().toISOString()
            };
            
            feeds.push(job);
          }
          
          console.log(`Parsed ${feeds.length} job listings from XML feed`);
          data = { 
            feeds, 
            message: `Found ${feeds.length} job listings`,
            source: 'XML',
            parsed_at: new Date().toISOString(),
            type: 'job_listings'
          };
          
        } catch (error) {
          console.error('Error parsing XML:', error);
          data = { feeds: [], message: 'Failed to parse XML feed', error: error.message };
        }
      } else {
        // Try to parse as JSON anyway
        try {
          data = JSON.parse(text);
        } catch {
          data = { feeds: [], message: 'Received non-JSON response', raw: text };
        }
      }
    }
    
    console.log('Successfully fetched feeds:', JSON.stringify(data).substring(0, 500) + '...');
    
    return new Response(
      JSON.stringify({ success: true, data }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('[FETCH_FEEDS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
  } catch (outerError) {
    console.error('[FETCH_FEEDS] Outer error:', outerError);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})