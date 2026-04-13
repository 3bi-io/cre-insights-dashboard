import { getCorsHeaders } from "../_shared/cors-config.ts";

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

const PHONE_NUMBERS = [
  { id: 'phnum_0001k48rgfw7fbfbr0p6njkt54n5', number: '+12149721334', client: 'Pemberton' },
  { id: 'phnum_4301k2678yq4e5va2pee8e11wdjz', number: '+12512775924', client: 'Danny Herman' },
  { id: 'phnum_5301khcb0877fkpt3t3e57qd0gba', number: '+15864745525', client: 'James Burg' },
];

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
  const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

  if (!ELEVENLABS_API_KEY || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return new Response(JSON.stringify({ error: 'Missing secrets' }), { status: 500, headers: corsHeaders });
  }

  const results = [];

  for (const phone of PHONE_NUMBERS) {
    // PATCH the phone number with updated Twilio credentials
    const patchRes = await fetch(`${ELEVENLABS_API_BASE}/convai/phone-numbers/${phone.id}`, {
      method: 'PATCH',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telephony_provider: 'twilio',
        twilio_config: {
          account_sid: TWILIO_ACCOUNT_SID,
          auth_token: TWILIO_AUTH_TOKEN,
          phone_number: phone.number,
        },
      }),
    });
    const patchBody = await patchRes.text();

    // GET to verify
    const getRes = await fetch(`${ELEVENLABS_API_BASE}/convai/phone-numbers/${phone.id}`, {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    });
    const getBody = await getRes.text();

    results.push({
      client: phone.client,
      phone_id: phone.id,
      patch_status: patchRes.status,
      patch_response: patchBody.slice(0, 500),
      get_status: getRes.status,
      get_response: getBody.slice(0, 500),
    });
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
