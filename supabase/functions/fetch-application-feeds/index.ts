import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createLogger } from '../_shared/logger.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0"

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
          
          // Forward applications to inbound-applications endpoint
          if (applications.length > 0) {
            const supabaseUrl = Deno.env.get('SUPABASE_URL');
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
            
            if (supabaseUrl && supabaseServiceKey) {
              const supabase = createClient(supabaseUrl, supabaseServiceKey);
              let insertedCount = 0;
              let skippedCount = 0;
              let errorCount = 0;
              
              for (const app of applications) {
                try {
                  // Check for duplicate by referencenumber or email+date combo
                  const { data: existing } = await supabase
                    .from('applications')
                    .select('id')
                    .or(`job_id.eq.${app.referencenumber},and(applicant_email.eq.${app.applicant_email},applied_at.eq.${app.date})`)
                    .limit(1);
                  
                  if (existing && existing.length > 0) {
                    logger.debug('Skipping duplicate application', { refNum: app.referencenumber });
                    skippedCount++;
                    continue;
                  }
                  
                  // Forward to inbound-applications endpoint
                  const inboundUrl = `${supabaseUrl}/functions/v1/inbound-applications?client_name=cdljobcast`;
                  const response = await fetch(inboundUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${supabaseServiceKey}`,
                    },
                    body: JSON.stringify({
                      first_name: app.first_name,
                      last_name: app.last_name,
                      applicant_email: app.applicant_email,
                      phone: app.phone,
                      city: app.city,
                      state: app.state,
                      zip: app.zip,
                      cdl: app.cdl,
                      exp: app.exp,
                      age: app.age,
                      education_level: app.education_level,
                      work_authorization: app.work_authorization,
                      source: 'CDL Job Cast',
                      job_id: app.referencenumber,
                      job_title: app.job_title,
                      notes: app.notes,
                      status: app.status || 'pending',
                    }),
                  });
                  
                  if (response.ok) {
                    insertedCount++;
                    logger.debug('Application forwarded', { refNum: app.referencenumber });
                  } else {
                    const errText = await response.text();
                    logger.warn('Failed to forward application', { refNum: app.referencenumber, error: errText });
                    errorCount++;
                  }
                } catch (appError) {
                  logger.error('Error processing application', appError);
                  errorCount++;
                }
              }
              
              logger.info('Application forwarding complete', { insertedCount, skippedCount, errorCount });
              
              data = { 
                feeds: applications, 
                message: `Processed ${applications.length} applications: ${insertedCount} inserted, ${skippedCount} skipped, ${errorCount} errors`,
                source: 'XML',
                parsed_at: new Date().toISOString(),
                type: 'applications',
                stats: { insertedCount, skippedCount, errorCount }
              };
            } else {
              logger.warn('Supabase credentials not available, skipping inbound forwarding');
              data = { 
                feeds: applications, 
                message: `Found ${applications.length} applications (not forwarded - missing credentials)`,
                source: 'XML',
                parsed_at: new Date().toISOString(),
                type: 'applications'
              };
            }
          } else {
            data = { 
              feeds: [], 
              message: 'No applications found in feed',
              source: 'XML',
              parsed_at: new Date().toISOString(),
              type: 'applications'
            };
          }
          
        } catch (error: unknown) {
          logger.error('Error parsing XML', error);
          const errMsg = error instanceof Error ? error.message : String(error);
          data = { feeds: [], message: 'Failed to parse XML feed', error: errMsg };
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
