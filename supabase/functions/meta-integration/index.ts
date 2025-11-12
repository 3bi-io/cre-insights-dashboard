/**
 * Meta Integration Edge Function
 * REFACTORED: Uses modern shared utilities for consistency and reliability
 * 
 * Handles Meta/Facebook Ads API integration for:
 * - Ad account syncing
 * - Campaign, AdSet, and Ad syncing
 * - Performance insights
 * - Lead form data
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { getCorsHeaders } from '../_shared/cors-config.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts'
import { getServiceClient } from '../_shared/supabase-client.ts'
import { createLogger, measureTime } from '../_shared/logger.ts'
import { createHttpClient } from '../_shared/http-client.ts'
import { normalizePhone } from '../_shared/application-processor.ts'
import { enforceAuth } from '../_shared/serverAuth.ts'

const logger = createLogger('meta-integration')

// Validation schema
const actionSchema = z.object({
  action: z.enum(['sync_accounts', 'sync_campaigns', 'sync_adsets', 'sync_ads', 'sync_insights', 'sync_leads']),
  accountId: z.string().optional(),
  campaignId: z.string().optional(),
  datePreset: z.string().default('last_30d'),
  sinceDays: z.number().optional()
})

// Type definitions
interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone_name: string;
}

interface MetaCampaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  created_time: string;
  updated_time: string;
}

interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  targeting?: any;
  bid_amount?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  end_time?: string;
  created_time: string;
  updated_time: string;
  campaign_id: string;
}

interface MetaAd {
  id: string;
  name: string;
  status: string;
  creative?: {
    id: string;
  };
  preview_shareable_link?: string;
  created_time: string;
  updated_time: string;
  adset_id: string;
  campaign_id: string;
}

interface MetaInsight {
  date_start: string;
  date_stop: string;
  spend: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpm: string;
  cpc: string;
  reach: string;
  frequency: string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
}

// Meta API client with retry logic
function createMetaApiClient(accessToken: string) {
  return createHttpClient({
    timeout: 30000,
    retries: 3,
    retryDelay: 2000,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  })
}

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) })
  }

  // SECURITY: Only admins and super admins can access Meta API integration
  const authContext = await enforceAuth(req, ['admin', 'super_admin'])
  if (authContext instanceof Response) {
    return authContext
  }
  
  const contextLogger = logger.child({ userId: authContext.userId })

  // Parse and validate request
  const body = await req.json()
  const { action, accountId, campaignId, datePreset, sinceDays } = actionSchema.parse(body)
  
  contextLogger.info('Processing Meta action', { action, accountId })

  // Get Meta access token
  const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN')
  if (!metaAccessToken) {
    throw new Error('META_ACCESS_TOKEN is not configured')
  }

  const supabase = getServiceClient()
  const metaApi = createMetaApiClient(metaAccessToken)

  // Route to appropriate handler
  switch (action) {
    case 'sync_accounts':
      return await syncAdAccounts(authContext.userId, metaApi, supabase, contextLogger, origin)
    
    case 'sync_campaigns':
      if (!accountId) throw new ValidationError('Account ID is required for syncing campaigns')
      return await syncCampaigns(authContext.userId, accountId, metaApi, supabase, contextLogger, origin)
    
    case 'sync_adsets':
      if (!accountId) throw new ValidationError('Account ID is required for syncing ad sets')
      return await syncAdSets(authContext.userId, accountId, campaignId, metaApi, supabase, contextLogger, origin)
    
    case 'sync_ads':
      if (!accountId) throw new ValidationError('Account ID is required for syncing ads')
      return await syncAds(authContext.userId, accountId, campaignId, metaApi, supabase, contextLogger, origin)
    
    case 'sync_insights':
      if (!accountId) throw new ValidationError('Account ID is required for syncing insights')
      return await syncInsights(authContext.userId, accountId, campaignId, datePreset, metaApi, supabase, contextLogger, origin)
    
    case 'sync_leads':
      if (!accountId) throw new ValidationError('Account ID is required for syncing leads')
      return await syncLeads(authContext.userId, accountId, sinceDays ?? 30, metaApi, supabase, contextLogger, origin)
    
    default:
      throw new ValidationError(`Unknown action: ${action}`)
  }
}, { context: 'MetaIntegration', logRequests: true })

/**
 * Sync Meta ad accounts
 */
async function syncAdAccounts(
  userId: string, 
  metaApi: any, 
  supabase: any, 
  logger: any,
  origin: string | null
) {
  return await measureTime(logger, 'sync-ad-accounts', async () => {
    logger.info('Syncing Meta ad accounts')
    
    // Fetch ad accounts from Meta API
    logger.apiRequest('GET', 'Meta Graph API: /me/adaccounts')
    const response = await metaApi.get(
      'https://graph.facebook.com/v18.0/me/adaccounts',
      {
        params: {
          fields: 'id,name,currency,timezone_name'
        }
      }
    )
    logger.apiResponse('GET', 'Meta Graph API: /me/adaccounts', response.status)

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.data?.error?.message || 'Unknown error'}`)
    }

    const { data: accounts }: { data: MetaAdAccount[] } = response.data
    logger.info('Fetched Meta ad accounts', { count: accounts.length })

    // Sync accounts to database
    const syncResults = []
    for (const account of accounts) {
      const cleanAccountId = account.id.replace(/^act_/, '')
      
      logger.dbQuery('UPSERT', 'meta_ad_accounts')
      const { data: synced, error } = await supabase
        .from('meta_ad_accounts')
        .upsert({
          account_id: cleanAccountId,
          name: account.name,
          currency: account.currency,
          timezone: account.timezone_name,
          user_id: userId,
          last_synced: new Date().toISOString()
        }, {
          onConflict: 'account_id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to sync account', error, { accountId: cleanAccountId })
      } else {
        syncResults.push(synced)
      }
    }

    logger.info('Ad accounts synced', { synced: syncResults.length })
    return successResponse(
      { accounts: syncResults, count: syncResults.length },
      `Synced ${syncResults.length} ad accounts`,
      undefined,
      origin
    )
  })
}

/**
 * Sync campaigns for an ad account
 */
async function syncCampaigns(
  userId: string,
  accountId: string,
  metaApi: any,
  supabase: any,
  logger: any,
  origin: string | null
) {
  return await measureTime(logger, 'sync-campaigns', async () => {
    logger.info('Syncing campaigns', { accountId })

    // Fetch campaigns from Meta API
    const apiUrl = `https://graph.facebook.com/v18.0/act_${accountId}/campaigns`
    logger.apiRequest('GET', apiUrl)
    
    const response = await metaApi.get(apiUrl, {
      params: {
        fields: 'id,name,objective,status,created_time,updated_time',
        limit: 500
      }
    })
    logger.apiResponse('GET', apiUrl, response.status)

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.data?.error?.message || 'Unknown error'}`)
    }

    const { data: campaigns }: { data: MetaCampaign[] } = response.data
    logger.info('Fetched campaigns', { count: campaigns.length })

    // Sync campaigns to database
    const syncResults = []
    for (const campaign of campaigns) {
      logger.dbQuery('UPSERT', 'meta_campaigns')
      const { data: synced, error } = await supabase
        .from('meta_campaigns')
        .upsert({
          campaign_id: campaign.id,
          account_id: accountId,
          name: campaign.name,
          objective: campaign.objective,
          status: campaign.status,
          created_time: campaign.created_time,
          updated_time: campaign.updated_time,
          user_id: userId,
          last_synced: new Date().toISOString()
        }, {
          onConflict: 'campaign_id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to sync campaign', error, { campaignId: campaign.id })
      } else {
        syncResults.push(synced)
      }
    }

    logger.info('Campaigns synced', { synced: syncResults.length })
    return successResponse(
      { campaigns: syncResults, count: syncResults.length },
      `Synced ${syncResults.length} campaigns`,
      undefined,
      origin
    )
  })
}

/**
 * Sync ad sets for an account/campaign
 */
async function syncAdSets(
  userId: string,
  accountId: string,
  campaignId: string | undefined,
  metaApi: any,
  supabase: any,
  logger: any,
  origin: string | null
) {
  return await measureTime(logger, 'sync-adsets', async () => {
    logger.info('Syncing ad sets', { accountId, campaignId })

    // Build API endpoint
    const endpoint = campaignId 
      ? `https://graph.facebook.com/v18.0/${campaignId}/adsets`
      : `https://graph.facebook.com/v18.0/act_${accountId}/adsets`

    logger.apiRequest('GET', endpoint)
    const response = await metaApi.get(endpoint, {
      params: {
        fields: 'id,name,status,targeting,bid_amount,daily_budget,lifetime_budget,start_time,end_time,created_time,updated_time,campaign_id',
        limit: 500
      }
    })
    logger.apiResponse('GET', endpoint, response.status)

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.data?.error?.message || 'Unknown error'}`)
    }

    const { data: adsets }: { data: MetaAdSet[] } = response.data
    logger.info('Fetched ad sets', { count: adsets.length })

    // Sync ad sets to database
    const syncResults = []
    for (const adset of adsets) {
      logger.dbQuery('UPSERT', 'meta_adsets')
      const { data: synced, error } = await supabase
        .from('meta_adsets')
        .upsert({
          adset_id: adset.id,
          campaign_id: adset.campaign_id,
          account_id: accountId,
          name: adset.name,
          status: adset.status,
          targeting: adset.targeting || {},
          bid_amount: adset.bid_amount,
          daily_budget: adset.daily_budget,
          lifetime_budget: adset.lifetime_budget,
          start_time: adset.start_time,
          end_time: adset.end_time,
          created_time: adset.created_time,
          updated_time: adset.updated_time,
          user_id: userId,
          last_synced: new Date().toISOString()
        }, {
          onConflict: 'adset_id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to sync ad set', error, { adsetId: adset.id })
      } else {
        syncResults.push(synced)
      }
    }

    logger.info('Ad sets synced', { synced: syncResults.length })
    return successResponse(
      { adsets: syncResults, count: syncResults.length },
      `Synced ${syncResults.length} ad sets`,
      undefined,
      origin
    )
  })
}

/**
 * Sync ads for an account/campaign
 */
async function syncAds(
  userId: string,
  accountId: string,
  campaignId: string | undefined,
  metaApi: any,
  supabase: any,
  logger: any,
  origin: string | null
) {
  return await measureTime(logger, 'sync-ads', async () => {
    logger.info('Syncing ads', { accountId, campaignId })

    const endpoint = campaignId
      ? `https://graph.facebook.com/v18.0/${campaignId}/ads`
      : `https://graph.facebook.com/v18.0/act_${accountId}/ads`

    logger.apiRequest('GET', endpoint)
    const response = await metaApi.get(endpoint, {
      params: {
        fields: 'id,name,status,creative,preview_shareable_link,created_time,updated_time,adset_id,campaign_id',
        limit: 500
      }
    })
    logger.apiResponse('GET', endpoint, response.status)

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.data?.error?.message || 'Unknown error'}`)
    }

    const { data: ads }: { data: MetaAd[] } = response.data
    logger.info('Fetched ads', { count: ads.length })

    // Sync ads to database
    const syncResults = []
    for (const ad of ads) {
      logger.dbQuery('UPSERT', 'meta_ads')
      const { data: synced, error } = await supabase
        .from('meta_ads')
        .upsert({
          ad_id: ad.id,
          adset_id: ad.adset_id,
          campaign_id: ad.campaign_id,
          account_id: accountId,
          name: ad.name,
          status: ad.status,
          creative_id: ad.creative?.id,
          preview_url: ad.preview_shareable_link,
          created_time: ad.created_time,
          updated_time: ad.updated_time,
          user_id: userId,
          last_synced: new Date().toISOString()
        }, {
          onConflict: 'ad_id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to sync ad', error, { adId: ad.id })
      } else {
        syncResults.push(synced)
      }
    }

    logger.info('Ads synced', { synced: syncResults.length })
    return successResponse(
      { ads: syncResults, count: syncResults.length },
      `Synced ${syncResults.length} ads`,
      undefined,
      origin
    )
  })
}

/**
 * Sync performance insights
 */
async function syncInsights(
  userId: string,
  accountId: string,
  campaignId: string | undefined,
  datePreset: string,
  metaApi: any,
  supabase: any,
  logger: any,
  origin: string | null
) {
  return await measureTime(logger, 'sync-insights', async () => {
    logger.info('Syncing insights', { accountId, campaignId, datePreset })

    const endpoint = campaignId
      ? `https://graph.facebook.com/v18.0/${campaignId}/insights`
      : `https://graph.facebook.com/v18.0/act_${accountId}/insights`

    logger.apiRequest('GET', endpoint)
    const response = await metaApi.get(endpoint, {
      params: {
        fields: 'date_start,date_stop,spend,impressions,clicks,ctr,cpm,cpc,reach,frequency,campaign_id,adset_id,ad_id',
        date_preset: datePreset,
        time_increment: 1,
        limit: 500
      }
    })
    logger.apiResponse('GET', endpoint, response.status)

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.data?.error?.message || 'Unknown error'}`)
    }

    const { data: insights }: { data: MetaInsight[] } = response.data
    logger.info('Fetched insights', { count: insights.length })

    // Sync insights to database
    const syncResults = []
    for (const insight of insights) {
      logger.dbQuery('UPSERT', 'meta_daily_spend')
      const { data: synced, error } = await supabase
        .from('meta_daily_spend')
        .upsert({
          account_id: accountId,
          campaign_id: insight.campaign_id || campaignId,
          adset_id: insight.adset_id,
          ad_id: insight.ad_id,
          date_start: insight.date_start,
          date_stop: insight.date_stop,
          spend: parseFloat(insight.spend) || 0,
          impressions: parseInt(insight.impressions) || 0,
          clicks: parseInt(insight.clicks) || 0,
          ctr: parseFloat(insight.ctr) || 0,
          cpm: parseFloat(insight.cpm) || 0,
          cpc: parseFloat(insight.cpc) || 0,
          reach: parseInt(insight.reach) || 0,
          frequency: parseFloat(insight.frequency) || 0,
          user_id: userId,
        }, {
          onConflict: 'account_id,date_start',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to sync insight', error, { date: insight.date_start })
      } else {
        syncResults.push(synced)
      }
    }

    logger.info('Insights synced', { synced: syncResults.length })
    return successResponse(
      { insights: syncResults, count: syncResults.length },
      `Synced ${syncResults.length} insights`,
      undefined,
      origin
    )
  })
}

/**
 * Sync lead form submissions
 */
async function syncLeads(
  userId: string,
  accountId: string,
  sinceDays: number,
  metaApi: any,
  supabase: any,
  logger: any,
  origin: string | null
) {
  return await measureTime(logger, 'sync-leads', async () => {
    logger.info('Syncing leads', { accountId, sinceDays })

    // Calculate date range
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - sinceDays)
    const sinceTimestamp = Math.floor(sinceDate.getTime() / 1000)

    // First, get all lead forms for the account
    const formsEndpoint = `https://graph.facebook.com/v18.0/act_${accountId}/leadgen_forms`
    logger.apiRequest('GET', formsEndpoint)
    
    const formsResponse = await metaApi.get(formsEndpoint, {
      params: {
        fields: 'id,name',
        limit: 100
      }
    })
    logger.apiResponse('GET', formsEndpoint, formsResponse.status)

    if (!formsResponse.ok) {
      throw new Error(`Meta API error: ${formsResponse.data?.error?.message || 'Unknown error'}`)
    }

    const { data: forms } = formsResponse.data
    logger.info('Fetched lead forms', { count: forms.length })

    let totalLeads = 0

    // Fetch leads for each form
    for (const form of forms) {
      const leadsEndpoint = `https://graph.facebook.com/v18.0/${form.id}/leads`
      logger.apiRequest('GET', leadsEndpoint)
      
      const leadsResponse = await metaApi.get(leadsEndpoint, {
        params: {
          fields: 'id,created_time,field_data',
          filtering: JSON.stringify([{
            field: 'time_created',
            operator: 'GREATER_THAN',
            value: sinceTimestamp
          }]),
          limit: 500
        }
      })
      logger.apiResponse('GET', leadsEndpoint, leadsResponse.status)

      if (leadsResponse.ok) {
        const { data: leads } = leadsResponse.data
        
        // Process and store leads
        for (const lead of leads) {
          const leadData: Record<string, any> = {}
          
          // Parse field data
          lead.field_data?.forEach((field: any) => {
            leadData[field.name] = field.values?.[0] || ''
          })

          logger.dbQuery('UPSERT', 'meta_leads')
          const { error } = await supabase
            .from('meta_leads')
            .upsert({
              lead_id: lead.id,
              form_id: form.id,
              form_name: form.name,
              account_id: accountId,
              created_time: lead.created_time,
              field_data: leadData,
              full_name: leadData.full_name || '',
              email: leadData.email || '',
              phone_number: normalizePhone(leadData.phone_number || ''),
              user_id: userId,
            }, {
              onConflict: 'lead_id',
              ignoreDuplicates: true
            })

          if (!error) {
            totalLeads++
          }
        }
      }
    }

    logger.info('Leads synced', { totalLeads })
    return successResponse(
      { count: totalLeads },
      `Synced ${totalLeads} new leads`,
      undefined,
      origin
    )
  })
}

serve(handler)
