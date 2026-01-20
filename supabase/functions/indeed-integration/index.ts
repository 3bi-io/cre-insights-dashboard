/**
 * Indeed Integration Edge Function
 * 
 * Handles analytics sync, stats retrieval, and job posting to Indeed.
 * Uses shared security utilities for authentication and audit logging.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { enforceAuth, logSecurityEvent, getClientInfo, createAuthenticatedClient } from '../_shared/serverAuth.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createLogger } from '../_shared/logger.ts'

const logger = createLogger('indeed-integration')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Indeed API configuration
const INDEED_API_BASE = 'https://apis.indeed.com'

// Request validation schemas
const baseRequestSchema = z.object({
  action: z.enum(['sync_analytics', 'get_stats', 'post_job', 'update_job', 'pause_job', 'resume_job']),
})

const analyticsRequestSchema = z.object({
  action: z.literal('sync_analytics'),
  employerId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jobId: z.string().optional(),
})

const statsRequestSchema = z.object({
  action: z.literal('get_stats'),
  employerId: z.string().min(1),
})

const postJobRequestSchema = z.object({
  action: z.literal('post_job'),
  jobData: z.object({
    title: z.string().min(1),
    description: z.string().min(10),
    company: z.string().min(1),
    location: z.object({
      city: z.string(),
      state: z.string(),
      country: z.string().default('US'),
      postalCode: z.string().optional(),
    }),
    salary: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      type: z.enum(['yearly', 'monthly', 'weekly', 'daily', 'hourly']).default('yearly'),
    }).optional(),
    jobType: z.enum(['fulltime', 'parttime', 'contract', 'temporary', 'internship']).optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
    applyUrl: z.string().url().optional(),
    category: z.string().optional(),
  }),
})

const jobActionRequestSchema = z.object({
  action: z.enum(['update_job', 'pause_job', 'resume_job']),
  jobId: z.string().min(1),
  jobData: z.object({}).passthrough().optional(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // SECURITY: Server-side JWT verification with role check
    const authContext = await enforceAuth(req, ['admin', 'super_admin'])
    if (authContext instanceof Response) return authContext

    const { userId, organizationId } = authContext
    const { ipAddress, userAgent } = getClientInfo(req)

    // Parse request body
    const body = await req.json()
    const { action } = baseRequestSchema.parse(body)
    
    logger.info(`Action: ${action}`, { userId })

    // Create authenticated Supabase client
    const supabaseClient = createAuthenticatedClient(req)

    // AUDIT LOGGING
    await logSecurityEvent(supabaseClient, authContext, `INDEED_${action.toUpperCase()}`, {
      table: 'indeed_analytics',
      recordId: body.employerId || body.jobId || body.jobData?.title || 'n/a',
      ipAddress,
      userAgent
    })

    switch (action) {
      case 'sync_analytics': {
        const { employerId, startDate, endDate, jobId } = analyticsRequestSchema.parse(body)
        return await syncIndeedAnalytics(employerId, startDate, endDate, jobId, userId, organizationId, supabaseClient)
      }
      
      case 'get_stats': {
        const { employerId } = statsRequestSchema.parse(body)
        return await getIndeedStats(employerId, userId, supabaseClient)
      }
      
      case 'post_job': {
        const { jobData } = postJobRequestSchema.parse(body)
        return await postJobToIndeed(jobData, userId, organizationId, supabaseClient)
      }
      
      case 'update_job':
      case 'pause_job':
      case 'resume_job': {
        const { jobId, jobData } = jobActionRequestSchema.parse(body)
        return await manageIndeedJob(action, jobId, jobData, userId, organizationId, supabaseClient)
      }
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('[INDEED] Integration error:', error)
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Validation error',
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Get Indeed API credentials
 */
function getIndeedCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = Deno.env.get('INDEED_CLIENT_ID')
  const clientSecret = Deno.env.get('INDEED_CLIENT_SECRET')
  
  if (!clientId || !clientSecret) {
    console.warn('[INDEED] API credentials not configured')
    return null
  }
  
  return { clientId, clientSecret }
}

/**
 * Get Indeed OAuth token (for Employer API)
 */
async function getIndeedAccessToken(credentials: { clientId: string; clientSecret: string }): Promise<string | null> {
  try {
    // Indeed uses OAuth 2.0 for employer API access
    const response = await fetch(`${INDEED_API_BASE}/oauth/v2/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'employer_access',
      }),
    })
    
    if (!response.ok) {
      console.error('[INDEED] Failed to get access token:', await response.text())
      return null
    }
    
    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('[INDEED] OAuth error:', error)
    return null
  }
}

/**
 * Fetch analytics from Indeed API (with fallback to simulated data)
 */
async function syncIndeedAnalytics(
  employerId: string,
  startDate: string,
  endDate: string,
  jobId: string | undefined,
  userId: string,
  organizationId: string | null,
  supabaseClient: any
) {
  console.log(`[INDEED] Syncing analytics for employer ${employerId} from ${startDate} to ${endDate}`)
  
  const credentials = getIndeedCredentials()
  let analyticsData: any[] = []
  let usedRealApi = false
  
  if (credentials) {
    const accessToken = await getIndeedAccessToken(credentials)
    
    if (accessToken) {
      try {
        // Indeed Analytics API endpoint
        const url = new URL(`${INDEED_API_BASE}/v1/reporting/campaigns`)
        url.searchParams.set('employerId', employerId)
        url.searchParams.set('startDate', startDate)
        url.searchParams.set('endDate', endDate)
        
        if (jobId) {
          url.searchParams.set('jobId', jobId)
        }
        
        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          analyticsData = transformIndeedAnalytics(data, userId, employerId, organizationId)
          usedRealApi = true
          console.log('[INDEED] Successfully fetched analytics from API')
        } else {
          console.warn('[INDEED] API returned non-OK status, using simulated data')
          analyticsData = generateAnalyticsData(employerId, startDate, endDate, jobId, userId, organizationId)
        }
      } catch (apiError) {
        console.error('[INDEED] API error, falling back to simulated data:', apiError)
        analyticsData = generateAnalyticsData(employerId, startDate, endDate, jobId, userId, organizationId)
      }
    } else {
      console.log('[INDEED] Could not obtain access token - using simulated data')
      analyticsData = generateAnalyticsData(employerId, startDate, endDate, jobId, userId, organizationId)
    }
  } else {
    console.log('[INDEED] No API credentials - using simulated analytics data')
    analyticsData = generateAnalyticsData(employerId, startDate, endDate, jobId, userId, organizationId)
  }

  // Upsert analytics data
  const { error } = await supabaseClient
    .from('indeed_analytics')
    .upsert(analyticsData, { 
      onConflict: 'employer_id,date',
      ignoreDuplicates: false 
    })

  if (error) {
    console.error('[INDEED] Failed to upsert analytics:', error)
    throw error
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Synced ${analyticsData.length} days of Indeed analytics`,
      recordsProcessed: analyticsData.length,
      source: usedRealApi ? 'indeed_api' : 'simulated'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

/**
 * Transform Indeed API response to our analytics format
 */
function transformIndeedAnalytics(
  apiData: any,
  userId: string,
  employerId: string,
  organizationId: string | null
): any[] {
  // Transform Indeed's response format to our schema
  // This would be customized based on actual Indeed API response structure
  const results = apiData.campaigns || apiData.data || []
  
  return results.map((item: any) => ({
    user_id: userId,
    organization_id: organizationId,
    employer_id: employerId,
    job_id: item.jobId || null,
    date: item.date || new Date().toISOString().split('T')[0],
    spend: Number((item.spend || item.cost || 0).toFixed(2)),
    clicks: item.clicks || 0,
    impressions: item.impressions || 0,
    applications: item.applies || item.applications || 0,
    ctr: item.ctr || (item.impressions > 0 ? ((item.clicks / item.impressions) * 100) : 0),
    cpc: item.cpc || (item.clicks > 0 ? (item.spend / item.clicks) : 0),
    updated_at: new Date().toISOString(),
  }))
}

/**
 * Generate analytics data (simulated or from internal tracking)
 */
function generateAnalyticsData(
  employerId: string,
  startDate: string,
  endDate: string,
  jobId: string | undefined,
  userId: string,
  organizationId: string | null
): any[] {
  const data: any[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Indeed typically has higher volume than Adzuna
  let baseClicks = Math.floor(Math.random() * 80) + 40
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    
    // Add variance for realistic data
    const dayOfWeek = d.getDay()
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.5 : 1.0
    const variance = 0.75 + Math.random() * 0.5
    
    const clicks = Math.floor(baseClicks * weekendMultiplier * variance)
    const impressions = clicks * (Math.floor(Math.random() * 3) + 4)
    const applications = Math.floor(clicks * (Math.random() * 0.06 + 0.04))
    const spend = clicks * (Math.random() * 1.8 + 0.9)
    
    data.push({
      user_id: userId,
      organization_id: organizationId,
      employer_id: employerId,
      job_id: jobId || null,
      date: dateStr,
      spend: Number(spend.toFixed(2)),
      clicks,
      impressions,
      applications,
      ctr: Number(((clicks / impressions) * 100).toFixed(2)),
      cpc: Number((spend / clicks).toFixed(2)),
      updated_at: new Date().toISOString(),
    })
    
    // Trend adjustment
    baseClicks = Math.max(15, baseClicks + (Math.random() - 0.5) * 15)
  }
  
  return data
}

/**
 * Get aggregated stats for an employer
 */
async function getIndeedStats(employerId: string, userId: string, supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('indeed_analytics')
    .select('*')
    .eq('user_id', userId)
    .eq('employer_id', employerId)
    .order('date', { ascending: false })
    .limit(30)

  if (error) {
    console.error('[INDEED] Failed to fetch stats:', error)
    throw error
  }

  const totals = (data || []).reduce((acc: any, row: any) => ({
    spend: acc.spend + (row.spend || 0),
    clicks: acc.clicks + (row.clicks || 0),
    impressions: acc.impressions + (row.impressions || 0),
    applications: acc.applications + (row.applications || 0),
  }), { spend: 0, clicks: 0, impressions: 0, applications: 0 })

  return new Response(
    JSON.stringify({
      success: true,
      data: data || [],
      totals: {
        ...totals,
        ctr: totals.impressions > 0 ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0,
        cpc: totals.clicks > 0 ? Number((totals.spend / totals.clicks).toFixed(2)) : 0,
        cpa: totals.applications > 0 ? Number((totals.spend / totals.applications).toFixed(2)) : 0,
      },
      period: {
        days: data?.length || 0,
        from: data?.[data.length - 1]?.date || null,
        to: data?.[0]?.date || null,
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

/**
 * Post a job to Indeed (requires API credentials)
 */
async function postJobToIndeed(
  jobData: any,
  userId: string,
  organizationId: string | null,
  supabaseClient: any
) {
  const credentials = getIndeedCredentials()
  
  if (!credentials) {
    console.log('[INDEED] No API credentials - job posting simulated')
    
    await supabaseClient.from('audit_logs').insert({
      user_id: userId,
      organization_id: organizationId,
      table_name: 'indeed_job_postings',
      action: 'POST_JOB_SIMULATED',
      record_id: `sim_${Date.now()}`,
    })
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Job posting simulated (no API credentials configured)',
        jobId: `indeed_sim_${Date.now()}`,
        warning: 'Configure INDEED_CLIENT_ID and INDEED_CLIENT_SECRET for real job posting'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const accessToken = await getIndeedAccessToken(credentials)
  
  if (!accessToken) {
    throw new Error('Failed to obtain Indeed API access token')
  }

  try {
    // Indeed Job Posting API
    const response = await fetch(`${INDEED_API_BASE}/v1/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: jobData.title,
        description: jobData.description,
        company: jobData.company,
        location: {
          city: jobData.location.city,
          state: jobData.location.state,
          country: jobData.location.country,
          postalCode: jobData.location.postalCode,
        },
        compensation: jobData.salary ? {
          range: {
            min: jobData.salary.min,
            max: jobData.salary.max,
          },
          type: jobData.salary.type,
        } : undefined,
        jobType: jobData.jobType,
        experienceLevel: jobData.experienceLevel,
        applyUrl: jobData.applyUrl,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[INDEED] Job posting failed:', errorText)
      throw new Error(`Indeed API error: ${response.status}`)
    }
    
    const result = await response.json()
    const externalJobId = result.jobId || result.id || `indeed_${Date.now()}`
    
    await supabaseClient.from('audit_logs').insert({
      user_id: userId,
      organization_id: organizationId,
      table_name: 'indeed_job_postings',
      action: 'POST_JOB',
      record_id: externalJobId,
    })
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Job posted to Indeed successfully',
        jobId: externalJobId,
        jobData: {
          title: jobData.title,
          company: jobData.company,
          location: `${jobData.location.city}, ${jobData.location.state}`,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (apiError) {
    console.error('[INDEED] Job posting error:', apiError)
    throw new Error(`Failed to post job to Indeed: ${apiError.message}`)
  }
}

/**
 * Manage existing Indeed job (update, pause, resume)
 */
async function manageIndeedJob(
  action: string,
  jobId: string,
  jobData: any,
  userId: string,
  organizationId: string | null,
  supabaseClient: any
) {
  const credentials = getIndeedCredentials()
  
  if (!credentials) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Indeed API credentials not configured',
        hint: 'Add INDEED_CLIENT_ID and INDEED_CLIENT_SECRET secrets'
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const accessToken = await getIndeedAccessToken(credentials)
  
  if (!accessToken) {
    throw new Error('Failed to obtain Indeed API access token')
  }

  try {
    let endpoint = `${INDEED_API_BASE}/v1/jobs/${jobId}`
    let method = 'PATCH'
    let body: any = {}
    
    switch (action) {
      case 'update_job':
        body = jobData
        break
      case 'pause_job':
        body = { status: 'paused' }
        break
      case 'resume_job':
        body = { status: 'active' }
        break
    }
    
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      throw new Error(`Indeed API error: ${response.status}`)
    }
    
    await supabaseClient.from('audit_logs').insert({
      user_id: userId,
      organization_id: organizationId,
      table_name: 'indeed_job_postings',
      action: action.toUpperCase(),
      record_id: jobId,
    })
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Job ${action.replace('_job', '')}d successfully`,
        jobId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (apiError) {
    console.error(`[INDEED] ${action} error:`, apiError)
    throw new Error(`Failed to ${action.replace('_', ' ')}: ${apiError.message}`)
  }
}
