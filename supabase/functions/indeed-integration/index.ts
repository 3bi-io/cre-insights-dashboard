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
    // Server-side authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    )

    // Get current user and verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role - require admin or super_admin
    const { data: roleData } = await supabaseClient.rpc('get_current_user_role');
    const userRole = roleData as string;

    if (userRole !== 'admin' && userRole !== 'super_admin') {
      // Log unauthorized access attempt
      await supabaseClient.from('audit_logs').insert({
        user_id: user.id,
        table_name: 'indeed_integration',
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        sensitive_fields: ['admin_only']
      }).catch(err => console.error('[AUDIT] Log failed:', err));

      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, employerId, startDate, endDate } = await req.json()
    
    console.log(`[INDEED] ${action} for employer ${employerId} by user ${user.id}`)

    switch (action) {
      case 'sync_analytics':
        return await syncIndeedAnalytics(employerId, startDate, endDate, user.id, supabaseClient)
      
      case 'get_stats':
        return await getIndeedStats(employerId, user.id, supabaseClient)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Indeed integration error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function syncIndeedAnalytics(
  employerId: string,
  startDate: string,
  endDate: string,
  userId: string,
  supabaseClient: any
) {
  console.log(`Syncing Indeed analytics for employer ${employerId} from ${startDate} to ${endDate}`)
  
  // TODO: Replace with actual Indeed API integration
  // For now, generate mock data
  const mockData = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const clicks = Math.floor(Math.random() * 500) + 100
    const impressions = clicks * (Math.floor(Math.random() * 5) + 3)
    const applications = Math.floor(clicks * (Math.random() * 0.1 + 0.05))
    const spend = clicks * (Math.random() * 2 + 1)
    
    mockData.push({
      user_id: userId,
      employer_id: employerId,
      date: dateStr,
      spend: Number(spend.toFixed(2)),
      clicks,
      impressions,
      applications,
      ctr: Number(((clicks / impressions) * 100).toFixed(2)),
      cpc: Number((spend / clicks).toFixed(2)),
    })
  }

  // Upsert data
  const { error } = await supabaseClient
    .from('indeed_analytics')
    .upsert(mockData, { onConflict: 'employer_id,job_id,date' })

  if (error) {
    throw error
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Synced ${mockData.length} days of Indeed analytics`,
      recordsProcessed: mockData.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getIndeedStats(employerId: string, userId: string, supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('indeed_analytics')
    .select('*')
    .eq('user_id', userId)
    .eq('employer_id', employerId)
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