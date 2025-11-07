/**
 * Fetch Feeds Edge Function
 * REFACTORED: Uses modern shared utilities for consistency
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { getCorsHeaders } from '../_shared/cors-config.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { enforceAuth } from '../_shared/serverAuth.ts'
import { wrapHandler } from '../_shared/error-handler.ts'
import { createLogger } from '../_shared/logger.ts'
import { createHttpClient } from '../_shared/http-client.ts'
import { parseXMLFeedForListings } from '../_shared/xml-parser.ts'

const logger = createLogger('fetch-feeds')

const requestSchema = z.object({
  user: z.string().default('*'),
  board: z.string().nullable().optional()
})

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) })
  }

  // SECURITY: Server-side JWT verification with role check
  const authContext = await enforceAuth(req, ['admin', 'super_admin'])
  if (authContext instanceof Response) return authContext

  const { userId } = authContext
  logger.info('Request authenticated', { userId })

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
  logger.info('Fetching feeds', { user, board })

  // Build feed URL
  const feedsUrl = new URL('https://cdljobcast.com/client/recruiting/getfeeds')
  feedsUrl.searchParams.set('user', user)
  if (board) {
    feedsUrl.searchParams.set('board', board)
  }

  // Fetch feeds using HTTP client with retry
  const httpClient = createHttpClient({
    timeout: 15000,
    retries: 2,
    headers: {
      'User-Agent': 'Supabase-Edge-Function/1.0',
      'Accept': 'application/json, text/plain, */*',
    }
  })

  logger.apiRequest('GET', feedsUrl.toString())
  
  try {
    const response = await httpClient.get(feedsUrl.toString(), {
      throwOnError: false
    })

    logger.apiResponse('GET', feedsUrl.toString(), response.status)

    if (!response.ok) {
      logger.warn('External API returned error', { 
        status: response.status, 
        data: response.data 
      })
      return errorResponse(
        `External API error: ${response.status}`,
        200, // Return 200 so frontend can handle gracefully
        { details: response.data },
        origin
      )
    }

    const contentType = response.headers.get('content-type')
    logger.debug('Response received', { contentType })

    let data
    
    // Handle different content types
    if (contentType?.includes('application/json')) {
      data = response.data
    } else if (contentType?.includes('xml') || 
               (typeof response.data === 'string' && response.data.trim().startsWith('<?xml'))) {
      // Parse XML response for job listings
      const feeds = parseXMLFeedForListings(response.data, 'CDL Job Cast')
      logger.info('Parsed XML feed', { count: feeds.length })
      
      data = { 
        feeds, 
        message: `Found ${feeds.length} job listings`,
        source: 'XML',
        parsed_at: new Date().toISOString(),
        type: 'job_listings'
      }
    } else {
      // Try to parse as JSON
      try {
        data = typeof response.data === 'string' 
          ? JSON.parse(response.data) 
          : response.data
      } catch {
        logger.warn('Unable to parse response', { 
          dataType: typeof response.data 
        })
        data = { 
          feeds: [], 
          message: 'Received non-JSON/XML response', 
          raw: response.data 
        }
      }
    }

    logger.info('Feeds fetched successfully', { 
      feedCount: data.feeds?.length || 0 
    })

    return successResponse(data, undefined, undefined, origin)
  } catch (error) {
    logger.error('Failed to fetch feeds', error, { 
      url: feedsUrl.toString() 
    })
    throw error
  }
}, { context: 'FetchFeeds', logRequests: true })

serve(handler)
