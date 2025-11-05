import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { enforceAuth, getClientInfo } from '../_shared/serverAuth.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { corsHeaders, handleCorsPrelight } from '../_shared/cors.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { wrapHandler } from '../_shared/error-handler.ts'
import { parseXMLFeedForListings } from '../_shared/xml-parser.ts'

const requestSchema = z.object({
  user: z.string().default('*'),
  board: z.string().nullable().optional()
})

const handler = wrapHandler(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPrelight(req);
  if (corsResponse) return corsResponse;

  // SECURITY: Server-side JWT verification with role check
  const authContext = await enforceAuth(req, ['admin', 'super_admin'])
  if (authContext instanceof Response) return authContext

  const { userId } = authContext
  console.log('[FETCH_FEEDS] Authenticated user:', userId)

  // VALIDATION: Parse and validate request parameters
  let validatedParams
  if (req.method === 'GET') {
    const url = new URL(req.url)
    validatedParams = requestSchema.parse({
      user: url.searchParams.get('user') || '*',
      board: url.searchParams.get('board')
    })
  } else {
    try {
      const body = await req.json()
      validatedParams = requestSchema.parse(body)
    } catch {
      validatedParams = { user: '*', board: null }
    }
  }

  const { user, board } = validatedParams
  console.log('Fetching feeds for user:', user, 'board:', board)

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
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('External API error:', response.status, response.statusText, errorText);
    return errorResponse(
      `External API error: ${response.status} ${response.statusText}`,
      200, // Return 200 so frontend can handle the error
      { details: errorText }
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
      const feeds = parseXMLFeedForListings(text, 'CDL Job Cast');
      console.log(`Parsed ${feeds.length} job listings from XML feed`);
      
      data = { 
        feeds, 
        message: `Found ${feeds.length} job listings`,
        source: 'XML',
        parsed_at: new Date().toISOString(),
        type: 'job_listings'
      };
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
  return successResponse(data);
}, { context: 'FetchFeeds', logRequests: true });

serve(handler)