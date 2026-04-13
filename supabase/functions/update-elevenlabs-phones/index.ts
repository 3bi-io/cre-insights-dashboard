const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!;
const TWILIO_API_KEY_SID = Deno.env.get('TWILIO_API_KEY_SID')!;
const TWILIO_API_KEY_SECRET = Deno.env.get('TWILIO_API_KEY_SECRET')!;
const BASE = 'https://api.elevenlabs.io/v1/convai/phone-numbers';

const headers = { 'xi-api-key': ELEVENLABS_API_KEY };

// Data captured from first run - old ID -> phone number + agent assignments
const PHONES_TO_IMPORT: Record<string, { phone: string; label: string }> = {
  'phnum_7401k96e8sdrepsbdk5j370d01tc': { phone: '+12133297677', label: 'Hayes AI Recruiting - LA' },
  'phnum_5501k910q8qzfnmbmznw6zqx3p8j': { phone: '+12565002580', label: 'Hayes AI Recruiting - AL' },
  'phnum_9201kg5txrvzerf89ccch3psp9qd': { phone: '+14175242744', label: 'Hayes AI Recruiting - MA' },
  'phnum_3801k1yfpbt4f789bzj2a6cdnpwj': { phone: '+14782427759', label: 'Hayes AI Recruiting - GA' },
  'phnum_9501k96e4q7qemqssafh44f8rzsa': { phone: '+17853476952', label: 'Hayes AI Recruiting - KS' },
  'phnum_5601kg7vfxvbfe6bt08gd4hkm5wn': { phone: '+18773072776', label: 'Hayes AI Recruiting - Toll Free' },
  'phnum_6901kg7vdsf5em2sh1cc1933d8j4': { phone: '+12172122026', label: 'Hayes AI Recruiting - IL' },
  'phnum_7101k96egay9ed0bfc3tb3efftgt': { phone: '+19402517500', label: 'Hayes AI Recruiting - TX' },
  'phnum_01jz3x3nm8ex6rx09hmf3fr1ht': { phone: '+18334322480', label: 'Hayes AI Recruiting - Main' },
  'phnum_01jzpapr78e87szxf7qjkbsmgv': { phone: '+16506007849', label: 'Hayes AI Recruiting - CA' },
  'phnum_3501k9znxwbzewtsg5m2gz5cwz01': { phone: '+12148884394', label: 'Hayes AI Recruiting - Dallas' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Log which SID we're using (first 10 chars only)
  const sidPreview = TWILIO_API_KEY_SID.slice(0, 10);

  const results: Record<string, any> = { _using_sid: sidPreview };

  for (const [oldId, info] of Object.entries(PHONES_TO_IMPORT)) {
    try {
      const importBody = {
        phone_number: info.phone,
        label: info.label,
        sid: TWILIO_API_KEY_SID,
        token: TWILIO_API_KEY_SECRET,
        provider: 'twilio',
      };

      const importRes = await fetch(BASE, {
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
      results[oldId] = { success: true, phone: info.phone, newId };
    } catch (e) {
      results[oldId] = { error: String(e), phone: info.phone };
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
