// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('meta-leads-cron');

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

// Hardcoded CR England Meta Ad Account ID used elsewhere in the app
const CR_ENGLAND_ACCOUNT_ID = '1594827328159714';

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
    logger.info('Found leadgen forms', { formCount: forms.length });

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
          logger.error('Leads fetch error', e, { formId: form.id });
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
            notes: `Meta Lead • form ${form.name || form.id} • campaign ${lead.campaign_id || ''}`,
            display_fields: fieldsObj,
          };

          const { error } = await supabase.from('applications').insert(insertPayload);
          if (error) {
            logger.error('Application insert error', error, { email });
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

    logger.info('Meta leads sync complete', { inserted, skipped, errors });
    return new Response(
      JSON.stringify({ success: true, inserted, skipped, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    logger.error('Meta leads cron error', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
