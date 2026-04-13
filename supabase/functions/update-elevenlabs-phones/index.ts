const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!;
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const BASE = 'https://api.elevenlabs.io/v1/convai/phone-numbers';

const PHONE_IDS = [
  'phnum_7401k96e8sdrepsbdk5j370d01tc',
  'phnum_5501k910q8qzfnmbmznw6zqx3p8j',
  'phnum_9201kg5txrvzerf89ccch3psp9qd',
  'phnum_3801k1yfpbt4f789bzj2a6cdnpwj',
  'phnum_9501k96e4q7qemqssafh44f8rzsa',
  'phnum_5601kg7vfxvbfe6bt08gd4hkm5wn',
  'phnum_6901kg7vdsf5em2sh1cc1933d8j4',
  'phnum_7101k96egay9ed0bfc3tb3efftgt',
  'phnum_01jz3x3nm8ex6rx09hmf3fr1ht',
  'phnum_01jzpapr78e87szxf7qjkbsmgv',
  'phnum_3501k9znxwbzewtsg5m2gz5cwz01',
];

const headers = { 'xi-api-key': ELEVENLABS_API_KEY };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const results: Record<string, any> = {};

  for (const oldId of PHONE_IDS) {
    try {
      // 1. GET current phone record
      const getRes = await fetch(`${BASE}/${oldId}`, { headers });
      if (!getRes.ok) {
        const errText = await getRes.text();
        results[oldId] = { error: `GET failed ${getRes.status}: ${errText}` };
        continue;
      }
      const record = await getRes.json();
      const phoneNumber = record.phone_number;
      const label = record.label || record.phone_number;
      const agentId = record.agent_id || null;

      // 2. DELETE old record
      const delRes = await fetch(`${BASE}/${oldId}`, { method: 'DELETE', headers });
      if (!delRes.ok) {
        const errText = await delRes.text();
        results[oldId] = { error: `DELETE failed ${delRes.status}: ${errText}`, phoneNumber };
        continue;
      }
      await delRes.text(); // consume body

      // 3. Re-import with new credentials
      const importBody: Record<string, any> = {
        phone_number: phoneNumber,
        label: label,
        twilio_account_sid: TWILIO_ACCOUNT_SID,
        twilio_auth_token: TWILIO_AUTH_TOKEN,
        telephony_provider: 'twilio',
      };
      // Reassign to original agent if one was set
      if (agentId) {
        importBody.agent_id = agentId;
      }

      const importRes = await fetch(`${BASE}/create`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(importBody),
      });
      const importData = await importRes.json();

      if (!importRes.ok) {
        results[oldId] = { error: `IMPORT failed ${importRes.status}`, detail: importData, phoneNumber };
        continue;
      }

      results[oldId] = {
        success: true,
        phoneNumber,
        label,
        agentId,
        newId: importData.phone_number_id || importData.id,
        importResponse: importData,
      };
    } catch (e) {
      results[oldId] = { error: String(e) };
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
