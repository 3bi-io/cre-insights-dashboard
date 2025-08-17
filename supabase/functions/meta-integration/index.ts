
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Phone number normalization utility
function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Handle empty or invalid inputs
  if (!digitsOnly || digitsOnly.length < 10) {
    return null;
  }

  // Handle US numbers
  if (digitsOnly.length === 10) {
    // 10 digits - add +1 country code
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // 11 digits starting with 1 - already has country code
    return `+${digitsOnly}`;
  } else if (digitsOnly.length === 11 && !digitsOnly.startsWith('1')) {
    // 11 digits not starting with 1 - assume it's a 10-digit number with extra digit
    return `+1${digitsOnly.slice(-10)}`;
  } else if (digitsOnly.length > 11) {
    // More than 11 digits - take last 10 and add +1
    return `+1${digitsOnly.slice(-10)}`;
  }

  // Fallback for edge cases
  return null;
}

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accountId, campaignId, datePreset = 'last_30d', sinceDays } = await req.json();
    
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
      
      case 'sync_adsets':
        if (!accountId) {
          throw new Error('Account ID is required for syncing ad sets');
        }
        return await syncAdSets(user.id, accountId, campaignId, metaAccessToken, supabase);
      
      case 'sync_ads':
        if (!accountId) {
          throw new Error('Account ID is required for syncing ads');
        }
        return await syncAds(user.id, accountId, campaignId, metaAccessToken, supabase);
      
      case 'sync_insights':
        if (!accountId) {
          throw new Error('Account ID is required for syncing insights');
        }
        return await syncInsights(user.id, accountId, campaignId, datePreset, metaAccessToken, supabase);
      
      case 'sync_leads':
        if (!accountId) {
          throw new Error('Account ID is required for syncing leads');
        }
        return await syncLeads(user.id, accountId, sinceDays ?? 30, metaAccessToken, supabase);
      
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
  console.log(`Syncing insights for account: ${accountId}, campaign: ${campaignId || 'all'}, date preset: ${datePreset}`);
  
  // Ensure proper formatting
  const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  const cleanAccountId = accountId.replace(/^act_/, '');
  
  const fields = 'date_start,date_stop,spend,impressions,clicks,ctr,cpm,cpc,reach,frequency,campaign_id,adset_id,ad_id';
  let endpoint: string;
  let level: string;
  
  if (campaignId) {
    // Campaign-level insights
    endpoint = `https://graph.facebook.com/v18.0/${campaignId}/insights`;
    level = 'campaign';
  } else {
    // Account-level insights with campaign breakdown
    endpoint = `https://graph.facebook.com/v18.0/${formattedAccountId}/insights`;
    level = 'campaign';
  }
  
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
    // Create a unique identifier for this record to handle conflicts
    const recordId = `${cleanAccountId}_${insight.campaign_id || 'account'}_${insight.adset_id || 'none'}_${insight.ad_id || 'none'}_${insight.date_start}`;
    
    const { error } = await supabase
      .from('meta_daily_spend')
      .upsert({
        user_id: userId,
        account_id: cleanAccountId,
        campaign_id: insight.campaign_id || campaignId || null,
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
        onConflict: 'user_id,account_id,date_start,campaign_id,adset_id,ad_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Error syncing insight for ${insight.date_start}:`, error);
      // Continue with other records even if one fails
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

async function syncAdSets(userId: string, accountId: string, campaignId: string | undefined, accessToken: string, supabase: any) {
  console.log(`Syncing ad sets with metrics for account: ${accountId}, campaign: ${campaignId || 'all'}`);
  
  const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  const cleanAccountId = accountId.replace(/^act_/, '');
  
  let endpoint: string;
  if (campaignId) {
    endpoint = `https://graph.facebook.com/v18.0/${campaignId}/adsets`;
  } else {
    endpoint = `https://graph.facebook.com/v18.0/${formattedAccountId}/adsets`;
  }
  
  const fields = 'id,name,status,targeting,bid_amount,daily_budget,lifetime_budget,start_time,end_time,created_time,updated_time,campaign_id';
  const response = await fetch(`${endpoint}?fields=${fields}&access_token=${accessToken}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Meta API error: ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const { data: adsets }: { data: MetaAdSet[] } = await response.json();
  console.log(`Found ${adsets.length} ad sets`);

  const syncResults = [];
  for (const adset of adsets) {
    // Get insights for this ad set
    try {
      const insightsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${adset.id}/insights?fields=spend,impressions,clicks,ctr,cpm,cpc,reach,frequency&date_preset=last_30d&access_token=${accessToken}`
      );
      
      let insights = {};
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        insights = insightsData.data?.[0] || {};
      }

      const { error } = await supabase
        .from('meta_ad_sets')
        .upsert({
          user_id: userId,
          account_id: cleanAccountId,
          campaign_id: adset.campaign_id,
          adset_id: adset.id,
          adset_name: adset.name,
          status: adset.status,
          targeting: JSON.stringify(adset.targeting),
          bid_amount: adset.bid_amount ? parseFloat(adset.bid_amount) : null,
          daily_budget: adset.daily_budget ? parseFloat(adset.daily_budget) : null,
          lifetime_budget: adset.lifetime_budget ? parseFloat(adset.lifetime_budget) : null,
          start_time: adset.start_time,
          end_time: adset.end_time,
          created_time: adset.created_time,
          updated_time: adset.updated_time,
          spend: insights.spend ? parseFloat(insights.spend) : 0,
          impressions: insights.impressions ? parseInt(insights.impressions) : 0,
          clicks: insights.clicks ? parseInt(insights.clicks) : 0,
          ctr: insights.ctr ? parseFloat(insights.ctr) : 0,
          cpm: insights.cpm ? parseFloat(insights.cpm) : 0,
          cpc: insights.cpc ? parseFloat(insights.cpc) : 0,
          reach: insights.reach ? parseInt(insights.reach) : 0,
          frequency: insights.frequency ? parseFloat(insights.frequency) : 0,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,account_id,adset_id'
        });

      if (error) {
        console.error(`Error syncing ad set ${adset.id}:`, error);
      } else {
        syncResults.push({ adset_id: adset.id, status: 'synced' });
      }
    } catch (insightError) {
      console.error(`Error fetching insights for ad set ${adset.id}:`, insightError);
      // Still sync the ad set without metrics
      const { error } = await supabase
        .from('meta_ad_sets')
        .upsert({
          user_id: userId,
          account_id: cleanAccountId,
          campaign_id: adset.campaign_id,
          adset_id: adset.id,
          adset_name: adset.name,
          status: adset.status,
          targeting: JSON.stringify(adset.targeting),
          bid_amount: adset.bid_amount ? parseFloat(adset.bid_amount) : null,
          daily_budget: adset.daily_budget ? parseFloat(adset.daily_budget) : null,
          lifetime_budget: adset.lifetime_budget ? parseFloat(adset.lifetime_budget) : null,
          start_time: adset.start_time,
          end_time: adset.end_time,
          created_time: adset.created_time,
          updated_time: adset.updated_time,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,account_id,adset_id'
        });

      if (!error) {
        syncResults.push({ adset_id: adset.id, status: 'synced_without_metrics' });
      }
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Synced ${syncResults.length} ad sets with metrics`,
      adsets: syncResults 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function syncAds(userId: string, accountId: string, campaignId: string | undefined, accessToken: string, supabase: any) {
  console.log(`Syncing ads for account: ${accountId}, campaign: ${campaignId || 'all'}`);
  
  const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  const cleanAccountId = accountId.replace(/^act_/, '');
  
  let endpoint: string;
  if (campaignId) {
    endpoint = `https://graph.facebook.com/v18.0/${campaignId}/ads`;
  } else {
    endpoint = `https://graph.facebook.com/v18.0/${formattedAccountId}/ads`;
  }
  
  const fields = 'id,name,status,creative{id},preview_shareable_link,created_time,updated_time,adset_id,campaign_id';
  const response = await fetch(`${endpoint}?fields=${fields}&access_token=${accessToken}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Meta API error: ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const { data: ads }: { data: MetaAd[] } = await response.json();
  console.log(`Found ${ads.length} ads`);

  const syncResults = [];
  for (const ad of ads) {
    const { error } = await supabase
      .from('meta_ads')
      .upsert({
        user_id: userId,
        account_id: cleanAccountId,
        campaign_id: ad.campaign_id,
        adset_id: ad.adset_id,
        ad_id: ad.id,
        ad_name: ad.name,
        status: ad.status,
        creative_id: ad.creative?.id || null,
        preview_url: ad.preview_shareable_link || null,
        created_time: ad.created_time,
        updated_time: ad.updated_time,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,ad_id'
      });

    if (error) {
      console.error(`Error syncing ad ${ad.id}:`, error);
    } else {
      syncResults.push({ ad_id: ad.id, status: 'synced' });
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Synced ${syncResults.length} ads`,
      ads: syncResults 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function syncLeads(userId: string, accountId: string, sinceDays: number, accessToken: string, supabase: any) {
  console.log(`Syncing Meta leads for account: ${accountId}, since last ${sinceDays} days`);
  const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  const cleanAccountId = accountId.replace(/^act_/, '');
  const sinceDate = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  
  // First, try to get leads directly from campaigns with lead generation
  const campaignsUrl = `https://graph.facebook.com/v18.0/${formattedAccountId}/campaigns?fields=id,name&effective_status=["ACTIVE","PAUSED"]&limit=50&access_token=${accessToken}`;
  
  let campaigns: Array<{id: string; name?: string}> = [];
  try {
    const resp = await fetch(campaignsUrl);
    if (!resp.ok) {
      const e = await resp.json();
      throw new Error(`Meta API campaigns error: ${e.error?.message || 'Unknown error'}`);
    }
    const json = await resp.json();
    campaigns = json.data || [];
  } catch (e: any) {
    console.error('Failed to fetch campaigns, trying leadgen_forms approach:', e);
    
    // Fallback: try leadgen_forms approach
    const formsUrl = `https://graph.facebook.com/v18.0/${formattedAccountId}/leadgen_forms?fields=id,name,created_time&limit=50&access_token=${accessToken}`;
    try {
      const resp = await fetch(formsUrl);
      if (!resp.ok) {
        const e = await resp.json();
        throw new Error(`Meta API leadgen_forms error: ${e.error?.message || 'Unknown error'}`);
      }
      const json = await resp.json();
      const forms = json.data || [];
      console.log(`Found ${forms.length} leadgen forms for account ${cleanAccountId}`);
      return await processLeadgenForms(forms, accessToken, supabase, sinceDate, cleanAccountId);
    } catch (e2: any) {
      console.error('Both campaigns and leadgen_forms approaches failed:', e2);
      return new Response(JSON.stringify({ success: false, message: `No lead generation data available: ${e2.message}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  console.log(`Found ${campaigns.length} campaigns for account ${cleanAccountId}`);

  // Now process campaigns to find leads
  return await processCampaignLeads(campaigns, accessToken, supabase, sinceDate, cleanAccountId);
}

async function processLeadgenForms(forms: Array<{id: string; name?: string; created_time?: string}>, accessToken: string, supabase: any, sinceDate: Date, cleanAccountId: string) {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const form of forms) {
    let nextUrl: string | null = `https://graph.facebook.com/v18.0/${form.id}/leads?fields=created_time,ad_id,adset_id,campaign_id,field_data,platform&limit=100&access_token=${accessToken}`;
    while (nextUrl) {
      const leadsResp = await fetch(nextUrl);
      if (!leadsResp.ok) {
        const e = await leadsResp.json();
        console.error('Leads fetch error:', e);
        errors++;
        break;
      }
      const leadsJson = await leadsResp.json();
      const leads = leadsJson.data || [];
      const result = await processLeads(leads, supabase, sinceDate);
      inserted += result.inserted;
      skipped += result.skipped;
      errors += result.errors;

      nextUrl = leadsJson?.paging?.next || null;
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Leads sync complete: inserted=${inserted}, skipped=${skipped}, errors=${errors}`,
      inserted,
      skipped,
      errors,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processCampaignLeads(campaigns: Array<{id: string; name?: string}>, accessToken: string, supabase: any, sinceDate: Date, cleanAccountId: string) {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const campaign of campaigns) {
    // Try to get leads from campaign level
    const leadsUrl = `https://graph.facebook.com/v18.0/${campaign.id}/leads?fields=created_time,ad_id,adset_id,campaign_id,field_data,platform&limit=100&access_token=${accessToken}`;
    
    try {
      const leadsResp = await fetch(leadsUrl);
      if (!leadsResp.ok) {
        console.log(`No leads found for campaign ${campaign.id} (${campaign.name})`);
        continue;
      }
      
      const leadsJson = await leadsResp.json();
      const leads = leadsJson.data || [];
      
      if (leads.length > 0) {
        console.log(`Found ${leads.length} leads for campaign ${campaign.id}`);
        const result = await processLeads(leads, supabase, sinceDate);
        inserted += result.inserted;
        skipped += result.skipped;
        errors += result.errors;
      }
    } catch (e: any) {
      console.error(`Error fetching leads for campaign ${campaign.id}:`, e);
      errors++;
    }

    await new Promise((r) => setTimeout(r, 50));
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Campaign leads sync complete: inserted=${inserted}, skipped=${skipped}, errors=${errors}`,
      inserted,
      skipped,
      errors,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processLeads(leads: any[], supabase: any, sinceDate: Date) {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const lead of leads) {
    const createdAt = new Date(lead.created_time);
    if (createdAt < sinceDate) {
      skipped++;
      continue;
    }
    const fieldsObj: Record<string, string> = {};
    for (const f of lead.field_data || []) {
      const key = (f.name || '').toLowerCase();
      const val = Array.isArray(f.values) && f.values.length > 0 ? String(f.values[0]) : '';
      if (key) fieldsObj[key] = val;
    }

    let firstName = fieldsObj['first_name'] || '';
    let lastName = fieldsObj['last_name'] || '';
    const email = fieldsObj['email'] || fieldsObj['email_address'] || null;
    const phone = fieldsObj['phone_number'] || fieldsObj['phone'] || null;

    // Extract names from full_name if needed
    if (!firstName && !lastName) {
      const fullName = fieldsObj['full_name'] || '';
      if (fullName) {
        const parts = fullName.split(' ');
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ');
      }
    }

    let exists = false;
    if (email) {
      const { data: existing } = await supabase
        .from('applications')
        .select('id')
        .eq('applicant_email', email)
        .gte('created_at', sinceDate.toISOString())
        .limit(1)
        .maybeSingle();
      exists = !!existing;
    }
    if (exists) {
      skipped++;
      continue;
    }

    // Lookup city/state from zip code for consistency
    const lookupCityState = async (zipCode: string) => {
      if (!zipCode || zipCode.length < 5) {
        return { city: fieldsObj.city || '', state: fieldsObj.state || '' };
      }

      const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
      
      if (cleanZip.length !== 5) {
        return { city: fieldsObj.city || '', state: fieldsObj.state || '' };
      }

      try {
        const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
        
        if (!response.ok) {
          console.warn(`Zip code lookup failed for ${cleanZip}: ${response.status}`);
          return { city: fieldsObj.city || '', state: fieldsObj.state || '' };
        }

        const data = await response.json();
        
        if (data.places && data.places.length > 0) {
          const place = data.places[0];
          return {
            city: place['place name'],
            state: place['state abbreviation']
          };
        }
        
        return { city: fieldsObj.city || '', state: fieldsObj.state || '' };
      } catch (error) {
        console.error(`Error looking up zip code ${cleanZip}:`, error);
        return { city: fieldsObj.city || '', state: fieldsObj.state || '' };
      }
    };

    const { city, state } = await lookupCityState(fieldsObj.zip);

    const insertPayload: any = {
      first_name: firstName || null,
      last_name: lastName || null,
      applicant_email: email,
      phone: normalizePhoneNumber(phone),
      city: city,
      state: state,
      zip: fieldsObj.zip,
      source: 'fb', // Facebook/Meta leads
      status: 'pending',
      created_at: createdAt.toISOString(),
      applied_at: createdAt.toISOString(),
      notes: `Meta Lead • campaign ${lead.campaign_id || ''}`,
      display_fields: fieldsObj,
    };

    const { error } = await supabase.from('applications').insert(insertPayload);
    if (error) {
      console.error('Insert application error:', error);
      errors++;
    } else {
      inserted++;
    }
  }

  return { inserted, skipped, errors };
}
