import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdSetReportData {
  adSetName: string;
  adSetId: string;
  campaignName: string;
  campaignId: string;
  totalSpend: number;
  totalLeads: number;
  costPerLead: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  reach: number;
  frequency: number;
  status: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  createdTime?: string;
  updatedTime?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dateRange = 'last_30d', organizationId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log('Meta Ad Set Report function called for user:', user.id);

    // Calculate date range
    const today = new Date();
    let startDate: string;
    
    switch (dateRange) {
      case 'last_7d':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last_14d':
        startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last_60d':
        startDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last_90d':
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    console.log('Generating report for date range:', startDate, 'to', today.toISOString().split('T')[0]);

    // Fetch all ad sets for the user/organization
    let adSetsQuery = supabase
      .from('meta_ad_sets')
      .select('*')
      .eq('user_id', user.id);

    if (organizationId) {
      adSetsQuery = adSetsQuery.eq('organization_id', organizationId);
    }

    const { data: adSets, error: adSetsError } = await adSetsQuery;

    if (adSetsError) {
      console.error('Error fetching ad sets:', adSetsError);
      throw adSetsError;
    }

    console.log(`Found ${adSets?.length || 0} ad sets`);

    // Fetch campaigns to map campaign_name by campaign_id
    let campaignsQuery = supabase
      .from('meta_campaigns')
      .select('campaign_id, campaign_name, organization_id, user_id')
      .eq('user_id', user.id);
    if (organizationId) {
      campaignsQuery = campaignsQuery.eq('organization_id', organizationId);
    }
    const { data: campaigns, error: campaignsError } = await campaignsQuery;
    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      throw campaignsError;
    }
    const campaignsMap = new Map((campaigns || []).map((c: any) => [c.campaign_id, c]));

    // Fetch spend data for the date range
    const { data: spendData, error: spendError } = await supabase
      .from('meta_daily_spend')
      .select('*')
      .eq('user_id', user.id)
      .gte('date_start', startDate)
      .not('adset_id', 'is', null);

    if (spendError) {
      console.error('Error fetching spend data:', spendError);
      throw spendError;
    }

    console.log(`Found ${spendData?.length || 0} spend records for ad sets`);

    // Fetch leads for the date range (Meta sources)
    const { data: leadsData, error: leadsError } = await supabase
      .from('applications')
      .select('id, source, applied_at, notes, display_fields, adset_id, campaign_id')
      .or('source.eq.fb,source.eq.ig,source.eq.meta,source.eq.facebook,source.eq.instagram')
      .gte('applied_at', startDate);

    if (leadsError) {
      console.error('Error fetching leads data:', leadsError);
      throw leadsError;
    }

    console.log(`Found ${leadsData?.length || 0} Meta leads`);

    // Process data and create report
    const adSetReport: AdSetReportData[] = [];

    for (const adSet of adSets || []) {
      // Aggregate spend data for this ad set
      const adSetSpendData = spendData?.filter(spend => spend.adset_id === adSet.adset_id) || [];
      
      const totalSpend = adSetSpendData.reduce((sum, record) => sum + (Number(record.spend) || 0), 0);
      const totalImpressions = adSetSpendData.reduce((sum, record) => sum + (Number(record.impressions) || 0), 0);
      const totalClicks = adSetSpendData.reduce((sum, record) => sum + (Number(record.clicks) || 0), 0);
      const totalReach = adSetSpendData.reduce((sum, record) => sum + (Number(record.reach) || 0), 0);
      
      // Calculate averages for CTR, CPM, CPC, Frequency
      const avgCtr = adSetSpendData.length > 0 
        ? adSetSpendData.reduce((sum, record) => sum + (Number(record.ctr) || 0), 0) / adSetSpendData.length
        : Number(adSet.ctr) || 0;
      
      const avgCpm = adSetSpendData.length > 0 
        ? adSetSpendData.reduce((sum, record) => sum + (Number(record.cpm) || 0), 0) / adSetSpendData.length
        : Number(adSet.cpm) || 0;
        
      const avgCpc = adSetSpendData.length > 0 
        ? adSetSpendData.reduce((sum, record) => sum + (Number(record.cpc) || 0), 0) / adSetSpendData.length
        : Number(adSet.cpc) || 0;
        
      const avgFrequency = adSetSpendData.length > 0 
        ? adSetSpendData.reduce((sum, record) => sum + (Number(record.frequency) || 0), 0) / adSetSpendData.length
        : Number(adSet.frequency) || 0;

      // Try to correlate leads with this ad set
      // Method 1: Direct correlation using new attribution fields (most accurate)
      let directLeads = leadsData?.filter(lead => {
        return lead.adset_id === adSet.adset_id || 
               lead.campaign_id === adSet.campaign_id;
      }) || [];

      // Method 2: Correlation via notes if direct attribution not available
      if (directLeads.length === 0) {
        directLeads = leadsData?.filter(lead => {
          const notes = lead.notes || '';
          return notes.includes(adSet.campaign_id) || notes.includes(adSet.adset_id);
        }) || [];
      }

      // Method 3: Time-based correlation for leads without direct attribution
      // Find leads that occurred while this ad set was active and spending
      if (directLeads.length === 0 && adSetSpendData.length > 0) {
        // Get leads in time windows where this ad set had spend
        const spendDates = adSetSpendData.map(spend => spend.date_start);
        
        const timeBasedLeads = leadsData?.filter(lead => {
          const leadDate = new Date(lead.applied_at).toISOString().split('T')[0];
          return spendDates.includes(leadDate) && 
                 (!lead.adset_id && !lead.campaign_id); // Only unattributed leads
        }) || [];

        // Proportionally attribute leads based on spend share
        if (timeBasedLeads.length > 0 && totalSpend > 0) {
          const totalSpendAllAdSets = spendData?.reduce((sum, record) => sum + (Number(record.spend) || 0), 0) || 1;
          const spendShare = totalSpend / totalSpendAllAdSets;
          directLeads = timeBasedLeads.slice(0, Math.round(timeBasedLeads.length * spendShare));
        }
      }

      const totalLeads = directLeads.length;
      const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;

      const reportItem: AdSetReportData = {
        adSetName: adSet.adset_name || `Ad Set ${adSet.adset_id}`,
        adSetId: adSet.adset_id,
        campaignName: (campaignsMap.get(adSet.campaign_id)?.campaign_name) || 'Unknown Campaign',
        campaignId: adSet.campaign_id,
        totalSpend,
        totalLeads,
        costPerLead,
        impressions: totalImpressions || Number(adSet.impressions) || 0,
        clicks: totalClicks || Number(adSet.clicks) || 0,
        ctr: avgCtr,
        cpm: avgCpm,
        cpc: avgCpc,
        reach: totalReach || Number(adSet.reach) || 0,
        frequency: avgFrequency,
        status: adSet.status || 'UNKNOWN',
        dailyBudget: adSet.daily_budget ? Number(adSet.daily_budget) : undefined,
        lifetimeBudget: adSet.lifetime_budget ? Number(adSet.lifetime_budget) : undefined,
        createdTime: adSet.created_time,
        updatedTime: adSet.updated_time,
      };

      adSetReport.push(reportItem);
    }

    // Sort by total spend descending
    adSetReport.sort((a, b) => b.totalSpend - a.totalSpend);

    const summary = {
      totalAdSets: adSetReport.length,
      totalSpend: adSetReport.reduce((sum, item) => sum + item.totalSpend, 0),
      totalLeads: adSetReport.reduce((sum, item) => sum + item.totalLeads, 0),
      totalImpressions: adSetReport.reduce((sum, item) => sum + item.impressions, 0),
      totalClicks: adSetReport.reduce((sum, item) => sum + item.clicks, 0),
      averageCostPerLead: (() => {
        const withLeads = adSetReport.filter(item => item.totalLeads > 0);
        if (withLeads.length === 0) return 0;
        const sum = withLeads.reduce((acc, item) => acc + (item.costPerLead || 0), 0);
        return sum / withLeads.length;
      })(),
      dateRange: {
        start: startDate,
        end: today.toISOString().split('T')[0]
      }
    };

    console.log('Meta Ad Set Report generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        adSets: adSetReport,
        generatedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in meta-adset-report function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        adSets: [],
        summary: null
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});