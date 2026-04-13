import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
  const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

  if (!ELEVENLABS_API_KEY || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return new Response(JSON.stringify({ error: 'Missing secrets' }), { status: 500 });
  }

  const phoneNumbers = [
    { id: 'phnum_0001k48rgfw7fbfbr0p6njkt54n5', number: '+12149721334', label: 'Pemberton' },
    { id: 'phnum_4301k2678yq4e5va2pee8e11wdjz', number: '+12512775924', label: 'Danny Herman' },
    { id: 'phnum_5301khcb0877fkpt3t3e57qd0gba', number: '+15864745525', label: 'James Burg' },
  ];

  const results = [];

  for (const pn of phoneNumbers) {
    // PATCH to update credentials
    const patchRes = await fetch(`https://api.elevenlabs.io/v1/convai/phone-numbers/${pn.id}`, {
      method: 'PATCH',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telephony_provider: 'twilio',
        twilio_account_sid: TWILIO_ACCOUNT_SID,
        twilio_auth_token: TWILIO_AUTH_TOKEN,
        phone_number: pn.number,
      }),
    });
    const patchBody = await patchRes.text();

    // GET to verify
    const getRes = await fetch(`https://api.elevenlabs.io/v1/convai/phone-numbers/${pn.id}`, {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    });
    const getBody = await getRes.text();

    results.push({
      label: pn.label,
      patch_status: patchRes.status,
      patch_response: patchBody.substring(0, 500),
      get_status: getRes.status,
      get_response: getBody.substring(0, 500),
    });
  }

  return new Response(JSON.stringify({ results, twilio_sid_prefix: TWILIO_ACCOUNT_SID.substring(0, 8) }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
