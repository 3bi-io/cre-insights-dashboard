
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  campaign_id: string;
  status: string;
  created_time: string;
  updated_time: string;
}

interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  status: string;
  created_time: string;
  updated_time: string;
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accountId, campaignId, datePreset = 'last_30d' } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN')!;
    
    if (!metaAccessToken) {
      throw new Error('META_ACCESS_TOKEN is required');
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

    console.log(`Processing Meta action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'sync_accounts':
        return await syncAdAccounts(user.id, metaAccessToken, supabase);
      
      case 'sync_campaigns':
        if (!accountId) {
          throw new Error('Account ID is required for syncing campaigns');
        }
        return await syncCampaigns(user.id, accountId, metaAccessToken, supabase);
      
      case 'sync_insights':
        if (!accountId) {
          throw new Error('Account ID is required for syncing insights');
        }
        return await syncInsights(user.id, accountId, campaignId, datePreset, metaAccessToken, supabase);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in Meta integration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function syncAdAccounts(userId: string, accessToken: string, supabase: any) {
  console.log('Syncing Meta ad accounts...');
  
  // Fetch ad accounts from Meta API
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,currency,timezone_name&access_token=${accessToken}`
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Meta API error: ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const { data: accounts }: { data: MetaAdAccount[] } = await response.json();
  console.log(`Found ${accounts.length} Meta ad accounts`);

  // Sync accounts to database
  const syncResults = [];
  for (const account of accounts) {
    // Extract the actual account ID (remove 'act_' prefix if present)
    const cleanAccountId = account.id.replace(/^act_/, '');
    
    const { data, error } = await supabase
      .from('meta_ad_accounts')
      .upsert({
        user_id: userId,
        account_id: cleanAccountId,
        account_name: account.name,
        currency: account.currency,
        timezone_name: account.timezone_name,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,account_id'
      });

    if (error) {
      console.error(`Error syncing account ${cleanAccountId}:`, error);
    } else {
      syncResults.push({ account_id: cleanAccountId, status: 'synced' });
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Synced ${syncResults.length} ad accounts`,
      accounts: syncResults 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function syncCampaigns(userId: string, accountId: string, accessToken: string, supabase: any) {
  console.log(`Syncing campaigns for account: ${accountId}`);
  
  // Ensure the account ID is properly formatted for Meta API (with act_ prefix)
  const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  // But store the clean version in database
  const cleanAccountId = accountId.replace(/^act_/, '');
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${formattedAccountId}/campaigns?fields=id,name,objective,status,created_time,updated_time&access_token=${accessToken}`
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Meta API error: ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const { data: campaigns }: { data: MetaCampaign[] } = await response.json();
  console.log(`Found ${campaigns.length} campaigns`);

  const syncResults = [];
  for (const campaign of campaigns) {
    const { error } = await supabase
      .from('meta_campaigns')
      .upsert({
        user_id: userId,
        account_id: cleanAccountId,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        objective: campaign.objective,
        status: campaign.status,
        created_time: campaign.created_time,
        updated_time: campaign.updated_time,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,campaign_id'
      });

    if (error) {
      console.error(`Error syncing campaign ${campaign.id}:`, error);
    } else {
      syncResults.push({ campaign_id: campaign.id, status: 'synced' });
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Synced ${syncResults.length} campaigns`,
      campaigns: syncResults 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function syncInsights(userId: string, accountId: string, campaignId: string | undefined, datePreset: string, accessToken: string, supabase: any) {
  console.log(`Syncing insights for account: ${accountId}, campaign: ${campaignId || 'all'}`);
  
  // Ensure proper formatting
  const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  const cleanAccountId = accountId.replace(/^act_/, '');
  
  const fields = 'date_start,date_stop,spend,impressions,clicks,ctr,cpm,cpc,reach,frequency';
  let allInsights: MetaInsight[] = [];
  let totalSynced = 0;

  try {
    // 1. Sync account-level insights
    console.log('Syncing account-level insights...');
    const accountInsights = await fetchInsights(
      `https://graph.facebook.com/v18.0/${formattedAccountId}/insights`,
      fields,
      'account',
      datePreset,
      accessToken
    );
    
    for (const insight of accountInsights) {
      const { error } = await supabase
        .from('meta_daily_spend')
        .upsert({
          user_id: userId,
          account_id: cleanAccountId,
          campaign_id: null,
          adset_id: null,
          ad_id: null,
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
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,account_id,campaign_id,date_start'
        });

      if (!error) totalSynced++;
    }

    // 2. Sync campaign-level insights
    console.log('Syncing campaign-level insights...');
    const campaignInsights = await fetchInsights(
      `https://graph.facebook.com/v18.0/${formattedAccountId}/insights`,
      fields,
      'campaign',
      datePreset,
      accessToken
    );
    
    for (const insight of campaignInsights) {
      const { error } = await supabase
        .from('meta_daily_spend')
        .upsert({
          user_id: userId,
          account_id: cleanAccountId,
          campaign_id: insight.campaign_id || null,
          adset_id: null,
          ad_id: null,
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
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,account_id,campaign_id,date_start'
        });

      if (!error) totalSynced++;
    }

    // 3. Sync adset-level insights
    console.log('Syncing adset-level insights...');
    const adsetInsights = await fetchInsights(
      `https://graph.facebook.com/v18.0/${formattedAccountId}/insights`,
      fields,
      'adset',
      datePreset,
      accessToken
    );
    
    for (const insight of adsetInsights) {
      const { error } = await supabase
        .from('meta_daily_spend')
        .upsert({
          user_id: userId,
          account_id: cleanAccountId,
          campaign_id: insight.campaign_id || null,
          adset_id: insight.adset_id || null,
          ad_id: null,
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
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,account_id,campaign_id,date_start'
        });

      if (!error) totalSynced++;
    }

    // 4. Sync ad-level insights
    console.log('Syncing ad-level insights...');
    const adInsights = await fetchInsights(
      `https://graph.facebook.com/v18.0/${formattedAccountId}/insights`,
      fields,
      'ad',
      datePreset,
      accessToken
    );
    
    for (const insight of adInsights) {
      const { error } = await supabase
        .from('meta_daily_spend')
        .upsert({
          user_id: userId,
          account_id: cleanAccountId,
          campaign_id: insight.campaign_id || null,
          adset_id: insight.adset_id || null,
          ad_id: insight.ad_id || null,
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
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,account_id,campaign_id,date_start'
        });

      if (!error) totalSynced++;
    }

    console.log(`Synced ${totalSynced} total insight records across all levels`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${totalSynced} insight records across account, campaign, adset, and ad levels`,
        insights: { 
          account: accountInsights.length,
          campaign: campaignInsights.length,
          adset: adsetInsights.length,
          ad: adInsights.length,
          total: totalSynced
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing insights:', error);
    throw error;
  }
}

async function fetchInsights(endpoint: string, fields: string, level: string, datePreset: string, accessToken: string): Promise<MetaInsight[]> {
  const response = await fetch(
    `${endpoint}?fields=${fields}&level=${level}&date_preset=${datePreset}&access_token=${accessToken}`
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Meta API error for ${level} level: ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const { data }: { data: MetaInsight[] } = await response.json();
  console.log(`Found ${data.length} ${level}-level insight records`);
  
  return data;
}
