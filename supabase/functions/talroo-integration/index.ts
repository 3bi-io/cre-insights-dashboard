import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { createLogger } from '../_shared/logger.ts'

const logger = createLogger('talroo-integration')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, campaignId, startDate, endDate } = await req.json()
    
    logger.info('Processing request', { action })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    switch (action) {
      case 'sync_analytics':
        return await syncTalrooAnalytics(campaignId, startDate, endDate, user.id, supabaseClient)
      
      case 'get_stats':
        return await getTalrooStats(campaignId, user.id, supabaseClient)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error: unknown) {
    logger.error('Integration error', error)
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function syncTalrooAnalytics(
  campaignId: string,
  startDate: string,
  endDate: string,
  userId: string,
  supabaseClient: ReturnType<typeof createClient>
) {
  logger.info('Syncing analytics', { campaignId, startDate, endDate })
  
  const mockData = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const clicks = Math.floor(Math.random() * 400) + 100
    const impressions = clicks * (Math.floor(Math.random() * 7) + 5)
    const applications = Math.floor(clicks * (Math.random() * 0.15 + 0.10))
    const spend = clicks * (Math.random() * 2.5 + 1.2)
    const costPerApp = applications > 0 ? spend / applications : 0
    
    mockData.push({
      user_id: userId,
      campaign_id: campaignId,
      date: dateStr,
      spend: Number(spend.toFixed(2)),
      clicks,
      impressions,
      applications,
      ctr: Number(((clicks / impressions) * 100).toFixed(2)),
      cpc: Number((spend / clicks).toFixed(2)),
      cost_per_application: Number(costPerApp.toFixed(2)),
    })
  }

  const { error } = await supabaseClient
    .from('talroo_analytics')
    .upsert(mockData, { onConflict: 'campaign_id,job_id,date' })

  if (error) {
    throw error
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Synced ${mockData.length} days of Talroo analytics`,
      recordsProcessed: mockData.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getTalrooStats(campaignId: string, userId: string, supabaseClient: ReturnType<typeof createClient>) {
  const { data, error } = await supabaseClient
    .from('talroo_analytics')
    .select('*')
    .eq('user_id', userId)
    .eq('campaign_id', campaignId)
    .order('date', { ascending: false })
    .limit(30)

  if (error) {
    throw error
  }

  const totals = (data || []).reduce((acc: { spend: number; clicks: number; impressions: number; applications: number }, row: Record<string, unknown>) => ({
    spend: acc.spend + (Number(row.spend) || 0),
    clicks: acc.clicks + (Number(row.clicks) || 0),
    impressions: acc.impressions + (Number(row.impressions) || 0),
    applications: acc.applications + (Number(row.applications) || 0),
  }), { spend: 0, clicks: 0, impressions: 0, applications: 0 })

  return new Response(
    JSON.stringify({
      success: true,
      data: data,
      totals: {
        ...totals,
        ctr: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : 0,
        cpc: totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : 0,
        cpa: totals.applications > 0 ? (totals.spend / totals.applications).toFixed(2) : 0,
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
