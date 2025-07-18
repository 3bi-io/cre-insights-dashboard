
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
  const level = campaignId ? 'campaign' : 'account';
  const endpoint = campaignId 
    ? `https://graph.facebook.com/v18.0/${campaignId}/insights`
    : `https://graph.facebook.com/v18.0/${formattedAccountId}/insights`;
  
  const response = await fetch(
    `${endpoint}?fields=${fields}&level=${level}&date_preset=${datePreset}&access_token=${accessToken}`
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Meta API error: ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const { data: insights }: { data: MetaInsight[] } = await response.json();
  console.log(`Found ${insights.length} insight records`);

  const syncResults = [];
  for (const insight of insights) {
    const { error } = await supabase
      .from('meta_daily_spend')
      .upsert({
        user_id: userId,
        account_id: cleanAccountId,
        campaign_id: campaignId || null,
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

    if (error) {
      console.error(`Error syncing insight for ${insight.date_start}:`, error);
    } else {
      syncResults.push({ date: insight.date_start, status: 'synced' });
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Synced ${syncResults.length} insight records`,
      insights: syncResults 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
