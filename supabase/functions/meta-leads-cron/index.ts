import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded CR England Meta Ad Account ID used elsewhere in the app
const CR_ENGLAND_ACCOUNT_ID = '435031743763874';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN');

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    if (!metaAccessToken) {
      throw new Error('META_ACCESS_TOKEN is required');
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Default to last 6 hours; allow override via querystring ?sinceHours=12
    const url = new URL(req.url);
    const sinceHoursParam = url.searchParams.get('sinceHours');
    const sinceHours = Math.max(1, Number(sinceHoursParam ?? '6'));
    const sinceDate = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

    const formattedAccountId = CR_ENGLAND_ACCOUNT_ID.startsWith('act_')
      ? CR_ENGLAND_ACCOUNT_ID
      : `act_${CR_ENGLAND_ACCOUNT_ID}`;

    // 1) Fetch leadgen forms for account
    const formsResp = await fetch(
      `https://graph.facebook.com/v18.0/${formattedAccountId}/leadgen_forms?fields=id,name,created_time&limit=50&access_token=${metaAccessToken}`
    );
    if (!formsResp.ok) {
      const e = await formsResp.json();
      throw new Error(`Meta API leadgen_forms error: ${e.error?.message || 'Unknown error'}`);
    }
    const formsJson = await formsResp.json();
    const forms: Array<{ id: string; name?: string; created_time?: string }> = formsJson.data || [];
    console.log(`meta-leads-cron: found ${forms.length} forms`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    // 2) For each form, page through leads
    for (const form of forms) {
      let nextUrl: string | null = `https://graph.facebook.com/v18.0/${form.id}/leads?fields=created_time,ad_id,adset_id,campaign_id,field_data,platform&limit=100&access_token=${metaAccessToken}`;
      while (nextUrl) {
        const leadsResp = await fetch(nextUrl);
        if (!leadsResp.ok) {
          const e = await leadsResp.json();
          console.error('meta-leads-cron: leads fetch error', e);
          errors++;
          break;
        }
        const leadsJson = await leadsResp.json();
        const leads = leadsJson.data || [];

        for (const lead of leads) {
          const createdAt = new Date(lead.created_time);
          if (createdAt < sinceDate) {
            skipped++;
            continue;
          }

          // Map field_data array -> object
          const fieldsObj: Record<string, string> = {};
          for (const f of lead.field_data || []) {
            const key = (f.name || '').toLowerCase();
            const val = Array.isArray(f.values) && f.values.length > 0 ? String(f.values[0]) : '';
            if (key) fieldsObj[key] = val;
          }

          let firstName = fieldsObj['first_name'] || '';
          let lastName = fieldsObj['last_name'] || '';
          let fullName = fieldsObj['full_name'] || '';
          const email = fieldsObj['email'] || fieldsObj['email_address'] || null;
          const phone = fieldsObj['phone_number'] || fieldsObj['phone'] || null;

          if (!fullName && (firstName || lastName)) {
            fullName = [firstName, lastName].filter(Boolean).join(' ');
          }
          if (!firstName && fullName) {
            const parts = fullName.split(' ');
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ');
          }

          // Basic dedupe by recent email window
          let exists = false;
          if (email) {
            const { data: existing } = await supabase
              .from('applications')
              .select('id')
              .eq('applicant_email', email)
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
              .limit(1)
              .maybeSingle();
            exists = !!existing;
          }
          if (exists) {
            skipped++;
            continue;
          }

          const insertPayload: any = {
            first_name: firstName || null,
            last_name: lastName || null,
            full_name: fullName || null,
            applicant_email: email,
            phone: phone,
            source: 'meta',
            status: 'pending',
            created_at: createdAt.toISOString(),
            applied_at: createdAt.toISOString(),
            notes: `Meta Lead • form ${form.name || form.id} • campaign ${lead.campaign_id || ''}`,
            display_fields: fieldsObj,
          };

          const { error } = await supabase.from('applications').insert(insertPayload);
          if (error) {
            console.error('meta-leads-cron: insert error', error);
            errors++;
          } else {
            inserted++;
          }
        }

        nextUrl = leadsJson?.paging?.next || null;
        // Small delay to be gentle to the API
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    return new Response(
      JSON.stringify({ success: true, inserted, skipped, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('meta-leads-cron error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
