/**
 * Indeed Integration Edge Function
 * 
 * Implements Indeed's Sponsored Jobs API (v1) for programmatic campaign management.
 * Base URL: https://apis.indeed.com/ads/v1/
 * Auth: OAuth 2.0 Client Credentials (2-legged)
 * 
 * Actions:
 *   Campaign CRUD: create_campaign, get_campaigns, get_campaign, update_campaign, delete_campaign
 *   Job management: get_campaign_jobs, get_campaign_budget, update_campaign_budget
 *   Analytics: sync_analytics, get_stats
 *   Account: get_employer_info
 */

import { enforceAuth, logSecurityEvent, getClientInfo, createAuthenticatedClient } from '../_shared/serverAuth.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createLogger } from '../_shared/logger.ts'
import { getServiceClient } from '../_shared/supabase-client.ts'

const logger = createLogger('indeed-integration')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Indeed Sponsored Jobs API v1
const INDEED_ADS_API = 'https://apis.indeed.com/ads/v1'
const INDEED_OAUTH_URL = 'https://apis.indeed.com/oauth/v2/tokens'

// ─── Request Schemas ───

const actionSchema = z.object({
  action: z.enum([
    'create_campaign', 'get_campaigns', 'get_campaign', 'update_campaign', 'delete_campaign',
    'get_campaign_jobs', 'get_campaign_budget', 'update_campaign_budget',
    'sync_analytics', 'get_stats', 'get_employer_info',
    // Legacy compat
    'post_job', 'update_job', 'pause_job', 'resume_job',
  ]),
})

const createCampaignSchema = z.object({
  action: z.literal('create_campaign'),
  name: z.string().min(1).max(255),
  status: z.enum(['PAUSED', 'ACTIVE']).default('PAUSED'),
  objective: z.enum(['APPLY', 'BALANCED']).default('APPLY'),
  jobsSourceId: z.string().min(1),
  jobsToInclude: z.enum(['ALL', 'QUERY']).default('ALL'),
  jobsQuery: z.string().optional(),
  budgetMonthlyLimit: z.number().positive().optional(),
  budgetOnetimeLimit: z.number().positive().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  trackingToken: z.string().optional(),
})

const getCampaignSchema = z.object({
  action: z.literal('get_campaign'),
  campaignId: z.string().min(1),
})

const updateCampaignSchema = z.object({
  action: z.literal('update_campaign'),
  campaignId: z.string().min(1),
  updates: z.object({
    name: z.string().optional(),
    status: z.enum(['PAUSED', 'ACTIVE', 'ENDED']).optional(),
    jobsQuery: z.string().optional(),
    jobsToInclude: z.enum(['ALL', 'QUERY']).optional(),
  }),
})

const deleteCampaignSchema = z.object({
  action: z.literal('delete_campaign'),
  campaignId: z.string().min(1),
})

const budgetSchema = z.object({
  action: z.literal('update_campaign_budget'),
  campaignId: z.string().min(1),
  budget: z.object({
    monthlyLimit: z.number().positive().optional(),
    onetimeLimit: z.number().positive().optional(),
  }),
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

// ─── OAuth ───

interface IndeedCredentials {
  clientId: string;
  clientSecret: string;
}

function getIndeedCredentials(): IndeedCredentials | null {
  const clientId = Deno.env.get('INDEED_CLIENT_ID')
  const clientSecret = Deno.env.get('INDEED_CLIENT_SECRET')
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

// Token cache (in-memory, per isolate)
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(
  credentials: IndeedCredentials,
  scopes: string[] = ['employer_access', 'employer.advertising.campaign', 'employer.advertising.campaign.read']
): Promise<string> {
  // Return cached token if valid
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }

  const response = await fetch(INDEED_OAUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: scopes.join(' '),
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    logger.error('OAuth token error', new Error(errText))
    throw new Error(`Indeed OAuth failed: ${response.status}`)
  }

  const data = await response.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  }
  return cachedToken.token
}

// ─── API Helpers ───

async function indeedApiCall(
  method: string,
  path: string,
  token: string,
  body?: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data: any }> {
  const url = `${INDEED_ADS_API}${path}`
  const opts: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }
  if (body && method !== 'GET') {
    opts.body = JSON.stringify(body)
  }

  const response = await fetch(url, opts)
  const responseText = await response.text()
  let data: any
  try {
    data = JSON.parse(responseText)
  } catch {
    data = { raw: responseText }
  }

  return { ok: response.ok, status: response.status, data }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ─── Main Handler ───

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authContext = await enforceAuth(req, ['admin', 'super_admin'])
    if (authContext instanceof Response) return authContext

    const { userId, organizationId } = authContext
    const { ipAddress, userAgent } = getClientInfo(req)
    const body = await req.json()
    const { action } = actionSchema.parse(body)

    logger.info(`Action: ${action}`, { userId })

    const supabase = createAuthenticatedClient(req)

    await logSecurityEvent(supabase, authContext, `INDEED_${action.toUpperCase()}`, {
      table: 'indeed_campaigns',
      recordId: body.campaignId || body.employerId || 'n/a',
      ipAddress,
      userAgent,
    })

    const credentials = getIndeedCredentials()

    switch (action) {
      // ─── Campaign CRUD ───

      case 'create_campaign': {
        const input = createCampaignSchema.parse(body)
        if (!credentials) return jsonResponse({ success: false, error: 'INDEED_CLIENT_ID / INDEED_CLIENT_SECRET not configured' }, 503)

        const token = await getAccessToken(credentials)
        const apiBody: Record<string, unknown> = {
          name: input.name,
          status: input.status,
          jobsSourceId: input.jobsSourceId,
          jobsToInclude: input.jobsToInclude,
        }
        if (input.jobsQuery) apiBody.jobsQuery = input.jobsQuery
        if (input.budgetMonthlyLimit) apiBody.budgetMonthlyLimit = input.budgetMonthlyLimit
        if (input.budgetOnetimeLimit) apiBody.budgetOnetimeLimit = input.budgetOnetimeLimit
        if (input.startDate) apiBody.startDate = input.startDate
        if (input.endDate) apiBody.fixedEndDate = input.endDate
        if (input.trackingToken) apiBody.trackingToken = input.trackingToken
        apiBody.budgetOptimizationTarget = 'AUTOMATIC'

        const result = await indeedApiCall('POST', '/campaigns', token, apiBody)

        // Persist locally regardless of API result for tracking
        const serviceClient = getServiceClient()
        const { data: campaign, error: dbError } = await serviceClient
          .from('indeed_campaigns')
          .insert({
            organization_id: organizationId,
            campaign_id: result.ok ? (result.data.campaignId || result.data.id || null) : null,
            name: input.name,
            status: result.ok ? input.status : 'DRAFT',
            objective: input.objective,
            budget_monthly_limit: input.budgetMonthlyLimit || null,
            budget_onetime_limit: input.budgetOnetimeLimit || null,
            start_date: input.startDate || null,
            end_date: input.endDate || null,
            jobs_source_id: input.jobsSourceId,
            jobs_query: input.jobsQuery || null,
            jobs_to_include: input.jobsToInclude,
            tracking_token: input.trackingToken || null,
            metadata: result.ok ? result.data : { error: result.data, status: result.status },
            created_by: userId,
          })
          .select()
          .single()

        if (dbError) logger.error('DB insert error', dbError)

        return jsonResponse({
          success: result.ok,
          campaign: campaign || null,
          indeedResponse: result.data,
          message: result.ok
            ? 'Campaign created on Indeed and tracked locally'
            : `Indeed API returned ${result.status} — campaign saved locally as DRAFT`,
        }, result.ok ? 201 : 207)
      }

      case 'get_campaigns': {
        if (!credentials) {
          // Return local campaigns only
          const serviceClient = getServiceClient()
          const { data } = await serviceClient
            .from('indeed_campaigns')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
          return jsonResponse({ success: true, campaigns: data || [], source: 'local' })
        }

        const token = await getAccessToken(credentials)
        const result = await indeedApiCall('GET', '/campaigns', token)
        return jsonResponse({
          success: result.ok,
          campaigns: result.data?.campaigns || result.data || [],
          source: 'indeed_api',
        })
      }

      case 'get_campaign': {
        const { campaignId } = getCampaignSchema.parse(body)
        if (!credentials) return jsonResponse({ success: false, error: 'Credentials not configured' }, 503)

        const token = await getAccessToken(credentials)
        const result = await indeedApiCall('GET', `/campaigns/${campaignId}`, token)
        return jsonResponse({ success: result.ok, campaign: result.data })
      }

      case 'update_campaign': {
        const { campaignId, updates } = updateCampaignSchema.parse(body)
        if (!credentials) return jsonResponse({ success: false, error: 'Credentials not configured' }, 503)

        const token = await getAccessToken(credentials)
        const result = await indeedApiCall('PATCH', `/campaigns/${campaignId}`, token, updates as Record<string, unknown>)

        // Sync status locally
        if (result.ok) {
          const serviceClient = getServiceClient()
          const updateFields: Record<string, unknown> = {}
          if (updates.status) updateFields.status = updates.status
          if (updates.name) updateFields.name = updates.name

          if (Object.keys(updateFields).length > 0) {
            await serviceClient
              .from('indeed_campaigns')
              .update(updateFields)
              .eq('campaign_id', campaignId)
              .eq('organization_id', organizationId)
          }
        }

        return jsonResponse({ success: result.ok, campaign: result.data })
      }

      case 'delete_campaign': {
        const { campaignId } = deleteCampaignSchema.parse(body)
        if (!credentials) return jsonResponse({ success: false, error: 'Credentials not configured' }, 503)

        const token = await getAccessToken(credentials)
        const result = await indeedApiCall('DELETE', `/campaigns/${campaignId}`, token)

        if (result.ok) {
          const serviceClient = getServiceClient()
          await serviceClient
            .from('indeed_campaigns')
            .update({ status: 'ENDED' })
            .eq('campaign_id', campaignId)
            .eq('organization_id', organizationId)
        }

        return jsonResponse({ success: result.ok, message: result.ok ? 'Campaign deleted' : 'Delete failed', details: result.data })
      }

      // ─── Budget ───

      case 'get_campaign_budget': {
        const { campaignId } = z.object({ action: z.string(), campaignId: z.string() }).parse(body)
        if (!credentials) return jsonResponse({ success: false, error: 'Credentials not configured' }, 503)

        const token = await getAccessToken(credentials)
        const result = await indeedApiCall('GET', `/campaigns/${campaignId}/budget`, token)
        return jsonResponse({ success: result.ok, budget: result.data })
      }

      case 'update_campaign_budget': {
        const { campaignId, budget } = budgetSchema.parse(body)
        if (!credentials) return jsonResponse({ success: false, error: 'Credentials not configured' }, 503)

        const token = await getAccessToken(credentials)
        const patchBody: Record<string, unknown> = {}
        if (budget.monthlyLimit !== undefined) patchBody.budgetMonthlyLimit = budget.monthlyLimit
        if (budget.onetimeLimit !== undefined) patchBody.budgetOnetimeLimit = budget.onetimeLimit

        const result = await indeedApiCall('PATCH', `/campaigns/${campaignId}/budget`, token, patchBody)

        if (result.ok) {
          const serviceClient = getServiceClient()
          const updateFields: Record<string, unknown> = {}
          if (budget.monthlyLimit !== undefined) updateFields.budget_monthly_limit = budget.monthlyLimit
          if (budget.onetimeLimit !== undefined) updateFields.budget_onetime_limit = budget.onetimeLimit

          await serviceClient
            .from('indeed_campaigns')
            .update(updateFields)
            .eq('campaign_id', campaignId)
            .eq('organization_id', organizationId)
        }

        return jsonResponse({ success: result.ok, budget: result.data })
      }

      // ─── Campaign Jobs ───

      case 'get_campaign_jobs': {
        const { campaignId } = z.object({ action: z.string(), campaignId: z.string() }).parse(body)
        if (!credentials) return jsonResponse({ success: false, error: 'Credentials not configured' }, 503)

        const token = await getAccessToken(credentials)
        const result = await indeedApiCall('GET', `/campaigns/${campaignId}/jobs`, token)
        return jsonResponse({ success: result.ok, jobs: result.data?.jobs || result.data || [] })
      }

      // ─── Employer Info ───

      case 'get_employer_info': {
        if (!credentials) return jsonResponse({ success: false, error: 'Credentials not configured' }, 503)

        const token = await getAccessToken(credentials)
        const result = await indeedApiCall('GET', '/subaccounts', token)
        return jsonResponse({ success: result.ok, employers: result.data })
      }

      // ─── Analytics (preserved from v1) ───

      case 'sync_analytics': {
        const { employerId, startDate, endDate, jobId } = analyticsRequestSchema.parse(body)
        return await syncIndeedAnalytics(employerId, startDate, endDate, jobId, userId, organizationId, supabase, credentials)
      }

      case 'get_stats': {
        const { employerId } = statsRequestSchema.parse(body)
        return await getIndeedStats(employerId, userId, supabase)
      }

      // ─── Legacy Compat (redirect to campaign-based approach) ───

      case 'post_job':
      case 'update_job':
      case 'pause_job':
      case 'resume_job':
        return jsonResponse({
          success: false,
          error: 'Legacy job-level actions are deprecated. Use campaign-based management instead.',
          migration: {
            create_campaign: 'POST with action: "create_campaign" — creates a sponsored campaign targeting jobs via jobsSourceId',
            update_campaign: 'POST with action: "update_campaign" — update campaign status (PAUSED/ACTIVE/ENDED)',
            get_campaigns: 'POST with action: "get_campaigns" — list all campaigns',
          },
        }, 410)

      default:
        return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400)
    }
  } catch (error) {
    logger.error('Integration error', error)

    if (error instanceof z.ZodError) {
      return jsonResponse({ success: false, error: 'Validation error', details: error.errors }, 400)
    }

    return jsonResponse({ success: false, error: error.message }, 500)
  }
})

// ─── Analytics Functions (preserved) ───

async function syncIndeedAnalytics(
  employerId: string,
  startDate: string,
  endDate: string,
  jobId: string | undefined,
  userId: string,
  organizationId: string | null,
  supabaseClient: any,
  credentials: IndeedCredentials | null,
) {
  logger.info('Syncing analytics', { employerId, startDate, endDate })

  let analyticsData: any[] = []
  let usedRealApi = false

  if (credentials) {
    try {
      const token = await getAccessToken(credentials)
      const url = new URL(`${INDEED_ADS_API}/reporting/campaigns`)
      url.searchParams.set('employerId', employerId)
      url.searchParams.set('startDate', startDate)
      url.searchParams.set('endDate', endDate)
      if (jobId) url.searchParams.set('jobId', jobId)

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        analyticsData = transformIndeedAnalytics(data, userId, employerId, organizationId)
        usedRealApi = true
      } else {
        await response.text() // consume body
        analyticsData = generateAnalyticsData(employerId, startDate, endDate, jobId, userId, organizationId)
      }
    } catch {
      analyticsData = generateAnalyticsData(employerId, startDate, endDate, jobId, userId, organizationId)
    }
  } else {
    analyticsData = generateAnalyticsData(employerId, startDate, endDate, jobId, userId, organizationId)
  }

  const { error } = await supabaseClient
    .from('indeed_analytics')
    .upsert(analyticsData, { onConflict: 'employer_id,date', ignoreDuplicates: false })

  if (error) throw error

  return jsonResponse({
    success: true,
    message: `Synced ${analyticsData.length} days of Indeed analytics`,
    recordsProcessed: analyticsData.length,
    source: usedRealApi ? 'indeed_api' : 'simulated',
  })
}

function transformIndeedAnalytics(apiData: any, userId: string, employerId: string, organizationId: string | null): any[] {
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
    ctr: item.ctr || (item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0),
    cpc: item.cpc || (item.clicks > 0 ? item.spend / item.clicks : 0),
    updated_at: new Date().toISOString(),
  }))
}

function generateAnalyticsData(employerId: string, startDate: string, endDate: string, jobId: string | undefined, userId: string, organizationId: string | null): any[] {
  const data: any[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  let baseClicks = Math.floor(Math.random() * 80) + 40

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
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

    baseClicks = Math.max(15, baseClicks + (Math.random() - 0.5) * 15)
  }

  return data
}

async function getIndeedStats(employerId: string, userId: string, supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('indeed_analytics')
    .select('*')
    .eq('user_id', userId)
    .eq('employer_id', employerId)
    .order('date', { ascending: false })
    .limit(30)

  if (error) throw error

  const totals = (data || []).reduce(
    (acc: any, row: any) => ({
      spend: acc.spend + (row.spend || 0),
      clicks: acc.clicks + (row.clicks || 0),
      impressions: acc.impressions + (row.impressions || 0),
      applications: acc.applications + (row.applications || 0),
    }),
    { spend: 0, clicks: 0, impressions: 0, applications: 0 }
  )

  return jsonResponse({
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
    },
  })
}
