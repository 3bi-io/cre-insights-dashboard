// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createLogger } from '../_shared/logger.ts'

const logger = createLogger('fetch-application-feeds')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  logger.info('Fetch application feeds function called', { method: req.method });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let user: string = '*';
    let board: string | null = null;
    
    // Handle both GET and POST requests
    if (req.method === 'GET') {
      const url = new URL(req.url);
      user = url.searchParams.get('user') || '*';
      board = url.searchParams.get('board');
      logger.debug('GET request params', { user, board });
    } else if (req.method === 'POST') {
      try {
        const body = await req.json();
        user = body.user || '*';
        board = body.board || null;
        logger.debug('POST request params', { user, board });
      } catch (e) {
        logger.warn('Failed to parse JSON body, using defaults');
        user = '*';
        board = null;
      }
    }

    logger.info('Fetching application feeds', { user, board });

    // Fetch feeds from the external API
    let feedsUrl = `https://cdljobcast.com/client/recruiting/getfeeds?user=${encodeURIComponent(user)}`;
    if (board) {
      feedsUrl += `&board=${encodeURIComponent(board)}`;
    }
    logger.info('Calling external API', { feedsUrl });
    
    const response = await fetch(feedsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Supabase-Edge-Function/1.0',
        'Accept': 'application/json, text/plain, */*',
      },
    });
    
    logger.info('External API response', { status: response.status });
    logger.debug('External API headers', { headers: Object.fromEntries(response.headers.entries()) });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('External API error', new Error(errorText), { status: response.status });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `External API error: ${response.status} ${response.statusText}`,
          details: errorText
        }), 
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const contentType = response.headers.get('content-type');
    logger.debug('Response content-type', { contentType });
    
    let data;
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      logger.debug('Non-JSON response received', { preview: text.substring(0, 200) });
      
      // Parse XML response for applications
      if (contentType?.includes('xml') || text.trim().startsWith('<?xml')) {
        try {
          const jobMatches = text.matchAll(/<job>(.*?)<\/job>/gs);
          const applications = [];
          
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
            
            // Parse as application data
            const application = {
              id: extractField('referencenumber') || extractField('id') || `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              first_name: extractField('firstname') || extractField('first_name') || '',
              last_name: extractField('lastname') || extractField('last_name') || '',
              applicant_email: extractField('email') || extractField('applicant_email') || '',
              phone: extractField('phone') || extractField('phone_number') || '',
              city: extractField('city') || '',
              state: extractField('state') || '',
              zip: extractField('zip') || extractField('zipcode') || '',
              cdl: extractField('cdl') || extractField('cdl_class') || '',
              exp: extractField('experience') || extractField('exp') || '',
              age: extractField('age') || '',
              education_level: extractField('education') || extractField('education_level') || '',
              work_authorization: extractField('work_authorization') || '',
              source: extractField('source') || 'CDL Job Cast',
              job_title: extractField('title') || extractField('job_title') || '',
              company: extractField('company') || '',
              referencenumber: extractField('referencenumber') || extractField('id') || '',
              date: extractField('date') || extractField('applied_date') || '',
              status: extractField('status') || 'pending',
              notes: extractField('notes') || extractField('description') || '',
              type: 'application',
              last_updated: new Date().toISOString()
            };
            
            applications.push(application);
          }
          
          logger.info('Parsed applications from XML', { count: applications.length });
          data = { 
            feeds: applications, 
            message: `Found ${applications.length} applications`,
            source: 'XML',
            parsed_at: new Date().toISOString(),
            type: 'applications'
          };
          
        } catch (error) {
          logger.error('Error parsing XML', error);
          data = { feeds: [], message: 'Failed to parse XML feed', error: error.message };
        }
      } else {
        try {
          data = JSON.parse(text);
        } catch {
          data = { feeds: [], message: 'Received non-JSON response', raw: text };
        }
      }
    }
    
    logger.info('Successfully fetched application feeds', { dataPreview: JSON.stringify(data).substring(0, 200) });
    
    return new Response(
      JSON.stringify({ success: true, data }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    logger.error('Error in fetch-application-feeds function', error);
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
