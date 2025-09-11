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
      // Include rows where organization_id matches OR is null (backfill compatibility)
      adSetsQuery = adSetsQuery.or(`organization_id.eq.${organizationId},organization_id.is.null`);
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

    // Process data and create report using direct fields from meta_ad_sets
    const adSetReport: AdSetReportData[] = [];

    for (const adSet of adSets || []) {
      // Use direct fields from the ad set data (Meta's native fields)
      const totalSpend = Number(adSet.spend ?? 0);
      // results can be text/number; normalize to a number
      let totalLeads = 0;
      if (typeof adSet.results === 'number') {
        totalLeads = adSet.results;
      } else if (adSet.results != null) {
        const cleaned = String(adSet.results).replace(/[^0-9.]/g, '');
        const parsed = cleaned ? parseFloat(cleaned) : 0;
        totalLeads = Number.isFinite(parsed) ? parsed : 0;
      }
      const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;

      const reportItem: AdSetReportData = {
        adSetName: adSet.adset_name || `Ad Set ${adSet.adset_id}`,
        adSetId: adSet.adset_id,
        campaignName: (campaignsMap.get(adSet.campaign_id)?.campaign_name) || 'Unknown Campaign',
        campaignId: adSet.campaign_id,
        totalSpend,
        totalLeads,
        costPerLead,
        impressions: Number(adSet.impressions || 0),
        clicks: Number(adSet.clicks || 0),
        ctr: Number(adSet.ctr || 0),
        cpm: Number(adSet.cpm || 0),
        cpc: Number(adSet.cpc || 0),
        reach: Number(adSet.reach || 0),
        frequency: Number(adSet.frequency || 0),
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
    console.log('Final report summary:', JSON.stringify(summary, null, 2));
    console.log('Final adSetReport length:', adSetReport.length);
    console.log('Sample adSet:', adSetReport.length > 0 ? JSON.stringify(adSetReport[0], null, 2) : 'No ad sets');

    const response = {
      success: true,
      summary,
      adSets: adSetReport,
      generatedAt: new Date().toISOString()
    };

    console.log('Returning response with adSets count:', response.adSets.length);

    return new Response(
      JSON.stringify(response),
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