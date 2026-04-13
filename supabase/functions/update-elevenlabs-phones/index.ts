const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!;
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const BASE = 'https://api.elevenlabs.io/v1/convai/phone-numbers';

const headers = { 'xi-api-key': ELEVENLABS_API_KEY };

// Data captured from first run - old ID -> phone number + agent assignments
const PHONES_TO_IMPORT: Record<string, { phone: string; label: string; agentIds: string[] }> = {
  'phnum_7401k96e8sdrepsbdk5j370d01tc': { phone: '+12133297677', label: 'Hayes AI Recruiting - LA', agentIds: ['agent_9601k9fejg06ep2rmefp4phjwnmj'] },
  'phnum_5501k910q8qzfnmbmznw6zqx3p8j': { phone: '+12565002580', label: 'Hayes AI Recruiting - AL', agentIds: ['agent_9701kg3s9dz1e0esh03ac4wv1pve', 'agent_0101kfp6waxpezy8r56ewhx8eqya'] },
  'phnum_9201kg5txrvzerf89ccch3psp9qd': { phone: '+14175242744', label: 'Hayes AI Recruiting - MA', agentIds: ['agent_9801kg5hpwm8ebps7hbnk615abxh'] },
  'phnum_3801k1yfpbt4f789bzj2a6cdnpwj': { phone: '+14782427759', label: 'Hayes AI Recruiting - GA', agentIds: ['agent_9201kegcfrw8fctvawnqa8v80wx0'] },
  'phnum_9501k96e4q7qemqssafh44f8rzsa': { phone: '+17853476952', label: 'Hayes AI Recruiting - KS', agentIds: ['agent_6501k96k96rdfaxsxdm4r2626yb9'] },
  'phnum_5601kg7vfxvbfe6bt08gd4hkm5wn': { phone: '+18773072776', label: 'Hayes AI Recruiting - Toll Free', agentIds: ['agent_7001kk37nfd8f5jv8zcpv5a96q8z'] },
  'phnum_6901kg7vdsf5em2sh1cc1933d8j4': { phone: '+12172122026', label: 'Hayes AI Recruiting - IL', agentIds: ['agent_3201kfp75kshfgwr1kfs310715z3', 'agent_1501kfp6wq37e0vrcear1vebcbdg'] },
  'phnum_7101k96egay9ed0bfc3tb3efftgt': { phone: '+19402517500', label: 'Hayes AI Recruiting - TX', agentIds: ['agent_0901k95ezb2kejwvc02pvycfj53v'] },
  'phnum_01jz3x3nm8ex6rx09hmf3fr1ht': { phone: '+18334322480', label: 'Hayes AI Recruiting - Main', agentIds: ['agent_0901kkajxs22f42rfzhewmgh5jb8', 'agent_2601k9d75z14f508v87nx8mmwv78'] },
  'phnum_01jzpapr78e87szxf7qjkbsmgv': { phone: '+16506007849', label: 'Hayes AI Recruiting - CA', agentIds: ['agent_1001khcae0z0fsx8r9r9gttr300x', 'agent_7801kg3g60wjecwvdpv0jydx5fe1'] },
  'phnum_3501k9znxwbzewtsg5m2gz5cwz01': { phone: '+12148884394', label: 'Hayes AI Recruiting - Dallas', agentIds: ['agent_2101k9wpz4n9fv78tkr5r5hs9c5c'] },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const results: Record<string, any> = {};

  for (const [oldId, info] of Object.entries(PHONES_TO_IMPORT)) {
    try {
      const importBody: Record<string, any> = {
        phone_number: info.phone,
        label: info.label,
        twilio_account_sid: TWILIO_ACCOUNT_SID,
        twilio_auth_token: TWILIO_AUTH_TOKEN,
        telephony_provider: 'twilio',
      };

      const importRes = await fetch(`${BASE}/create`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(importBody),
      });
      const importData = await importRes.json();

      if (!importRes.ok) {
        results[oldId] = { error: `IMPORT failed ${importRes.status}`, detail: importData, phone: info.phone };
        continue;
      }

      const newId = importData.phone_number_id || importData.id;
      results[oldId] = {
        success: true,
        phone: info.phone,
        newId,
        agentIds: info.agentIds,
      };
    } catch (e) {
      results[oldId] = { error: String(e), phone: info.phone };
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
