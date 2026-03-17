import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createLogger } from '../_shared/logger.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const logger = createLogger('meta-sync-cron');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetaCampaign {
  id: string;
  name: string;
  objective?: string;
  status?: string;
  created_time?: string;
  updated_time?: string;
}

interface MetaAdSet {
  id: string;
  name: string;
  status?: string;
  targeting?: Record<string, unknown>;
  bid_amount?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  end_time?: string;
  created_time?: string;
  updated_time?: string;
  campaign_id: string;
}

interface MetaAd {
  id: string;
  name: string;
  status?: string;
  adset_id: string;
  campaign_id: string;
  created_time?: string;
  updated_time?: string;
  creative?: { id?: string };
  preview_shareable_link?: string;
}

async function fetchAll<T>(url: string): Promise<T[]> {
  let results: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const resp = await fetch(nextUrl);
    if (!resp.ok) {
      const e = await resp.json().catch(() => ({}));
      throw new Error(`Meta API error ${resp.status}: ${e.error?.message || resp.statusText}`);
    }
    const json = await resp.json();
    results = results.concat(json.data || []);
    nextUrl = json.paging?.next || null;
  }
  return results;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN');

    if (!supabaseUrl || !serviceKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    if (!metaAccessToken) throw new Error('META_ACCESS_TOKEN is required');

    const supabase = createClient(supabaseUrl, serviceKey);

    // Optional: allow running for a single account via query param ?account_id=...
    const url = new URL(req.url);
    const filterAccountId = url.searchParams.get('account_id');

    // 1) Load all known Meta ad accounts from DB
    const { data: accounts, error: accountsErr } = await supabase
      .from('meta_ad_accounts')
      .select('user_id, account_id');

    if (accountsErr) throw accountsErr;

    const targets = (accounts || [])
      .filter((a) => (filterAccountId ? a.account_id === filterAccountId : true));

    logger.info(`Syncing ${targets.length} accounts`, { filterAccountId });

    let totalCampaigns = 0;
    let totalAdSets = 0;
    let totalAds = 0;

    for (const row of targets) {
      const userId = row.user_id as string;
      const accountId = (row.account_id as string).replace(/^act_/, '');
      const act = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

      try {
        // Resolve organization for this user
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', userId)
          .maybeSingle();
        const orgId = profile?.organization_id ?? null;

        // Refresh account meta (name/currency/timezone) from Graph and upsert
        try {
          const accResp = await fetch(
            `https://graph.facebook.com/v18.0/${act}?fields=id,name,currency,timezone_name&access_token=${metaAccessToken}`
          );
          if (accResp.ok) {
            const acc = await accResp.json();
            await supabase.from('meta_ad_accounts').upsert({
              user_id: userId,
              organization_id: orgId,
              account_id: accountId,
              account_name: acc.name,
              currency: acc.currency,
              timezone_name: acc.timezone_name,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,account_id' });
          } else {
            const e = await accResp.json().catch(() => ({}));
            logger.warn('Account refresh failed', { error: e });
          }
        } catch (e) {
          logger.warn('Account refresh error', { error: e });
        }

        // 2) Campaigns
        const campaigns = await fetchAll<MetaCampaign>(
          `https://graph.facebook.com/v18.0/${act}/campaigns?fields=id,name,objective,status,created_time,updated_time&limit=500&access_token=${metaAccessToken}`
        );
        logger.info('Campaigns fetched', { accountId, count: campaigns.length });
        for (const c of campaigns) {
          const { error } = await supabase.from('meta_campaigns').upsert({
            user_id: userId,
            organization_id: orgId,
            account_id: accountId,
            campaign_id: c.id,
            campaign_name: c.name,
            objective: c.objective || null,
            status: c.status || null,
            created_time: c.created_time || null,
            updated_time: c.updated_time || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,campaign_id' });
          if (error) logger.error('Upsert campaign error', error);
        }
        totalCampaigns += campaigns.length;

        // 3) Ad Sets
        const adsets = await fetchAll<MetaAdSet>(
          `https://graph.facebook.com/v18.0/${act}/adsets?fields=id,name,status,targeting,bid_amount,daily_budget,lifetime_budget,start_time,end_time,created_time,updated_time,campaign_id&limit=500&access_token=${metaAccessToken}`
        );
        logger.info('Ad sets fetched', { accountId, count: adsets.length });
        for (const s of adsets) {
          const { error } = await supabase.from('meta_ad_sets').upsert({
            user_id: userId,
            organization_id: orgId,
            account_id: accountId,
            campaign_id: s.campaign_id,
            adset_id: s.id,
            adset_name: s.name,
            status: s.status || null,
            targeting: s.targeting ? JSON.stringify(s.targeting) : null,
            bid_amount: s.bid_amount ? parseFloat(s.bid_amount) : null,
            daily_budget: s.daily_budget ? parseFloat(s.daily_budget) : null,
            lifetime_budget: s.lifetime_budget ? parseFloat(s.lifetime_budget) : null,
            start_time: s.start_time || null,
            end_time: s.end_time || null,
            created_time: s.created_time || null,
            updated_time: s.updated_time || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,account_id,adset_id' });
          if (error) logger.error('Upsert ad set error', error);
        }
        totalAdSets += adsets.length;

        // 4) Ads
        const ads = await fetchAll<MetaAd>(
          `https://graph.facebook.com/v18.0/${act}/ads?fields=id,name,status,adset_id,campaign_id,creative{id},preview_shareable_link,created_time,updated_time&limit=500&access_token=${metaAccessToken}`
        );
        logger.info('Ads fetched', { accountId, count: ads.length });
        for (const ad of ads) {
          const { error } = await supabase.from('meta_ads').upsert({
            user_id: userId,
            organization_id: orgId,
            account_id: accountId,
            campaign_id: ad.campaign_id,
            adset_id: ad.adset_id,
            ad_id: ad.id,
            ad_name: ad.name,
            status: ad.status || null,
            creative_id: ad.creative?.id || null,
            preview_url: ad.preview_shareable_link || null,
            created_time: ad.created_time || null,
            updated_time: ad.updated_time || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,ad_id' });
          if (error) logger.error('Upsert ad error', error);
        }
        totalAds += ads.length;
      } catch (err) {
        logger.error('Error syncing account', err, { accountId });
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Meta sync complete', totals: { campaigns: totalCampaigns, adsets: totalAdSets, ads: totalAds } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logger.error('meta-sync-cron error', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
