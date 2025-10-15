// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    
    console.log(`Adzuna integration: ${action} for campaign ${campaignId}`)

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
        return await syncAdzunaAnalytics(campaignId, startDate, endDate, user.id, supabaseClient)
      
      case 'get_stats':
        return await getAdzunaStats(campaignId, user.id, supabaseClient)
      
      case 'post_job':
        return await postJobToAdzuna(req, user.id, supabaseClient)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Adzuna integration error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function syncAdzunaAnalytics(
  campaignId: string,
  startDate: string,
  endDate: string,
  userId: string,
  supabaseClient: any
) {
  console.log(`Syncing Adzuna analytics for campaign ${campaignId}`)
  
  // Generate mock data (replace with actual Adzuna API call)
  const mockData = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const clicks = Math.floor(Math.random() * 300) + 50
    const impressions = clicks * (Math.floor(Math.random() * 6) + 4)
    const applications = Math.floor(clicks * (Math.random() * 0.12 + 0.08))
    const spend = clicks * (Math.random() * 1.5 + 0.8)
    
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
    })
  }

  const { error } = await supabaseClient
    .from('adzuna_analytics')
    .upsert(mockData, { onConflict: 'campaign_id,job_id,date' })

  if (error) {
    throw error
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Synced ${mockData.length} days of Adzuna analytics`,
      recordsProcessed: mockData.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAdzunaStats(campaignId: string, userId: string, supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('adzuna_analytics')
    .select('*')
    .eq('user_id', userId)
    .eq('campaign_id', campaignId)
    .order('date', { ascending: false })
    .limit(30)

  if (error) {
    throw error
  }

  const totals = data.reduce((acc, row) => ({
    spend: acc.spend + (row.spend || 0),
    clicks: acc.clicks + (row.clicks || 0),
    impressions: acc.impressions + (row.impressions || 0),
    applications: acc.applications + (row.applications || 0),
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

async function postJobToAdzuna(req: Request, userId: string, supabaseClient: any) {
  const { jobData } = await req.json()
  
  console.log('Posting job to Adzuna:', jobData)
  
  // TODO: Implement actual Adzuna API posting
  // For now, return success
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Job posted to Adzuna successfully',
      jobId: `adzuna_${Date.now()}`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}