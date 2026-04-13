/**
 * Temporary edge function to update ElevenLabs phone numbers with Twilio credentials.
 * This should be deleted after use.
 */
import { getCorsHeaders } from "../_shared/cors-config.ts";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger('update-elevenlabs-twilio');

const PHONE_NUMBERS = [
  { id: 'phnum_0001k48rgfw7fbfbr0p6njkt54n5', number: '+12149721334', client: 'Pemberton Truck Lines' },
  { id: 'phnum_4301k2678yq4e5va2pee8e11wdjz', number: '+12512775924', client: 'Danny Herman Trucking' },
  { id: 'phnum_5301khcb0877fkpt3t3e57qd0gba', number: '+15864745525', client: 'James Burg Trucking' },
];

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
  const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

  if (!ELEVENLABS_API_KEY || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return new Response(JSON.stringify({ error: 'Missing required secrets' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action || 'update';

  const results: any[] = [];

  for (const phone of PHONE_NUMBERS) {
    try {
      if (action === 'update') {
        // Update the phone number with Twilio credentials
        const updateRes = await fetch(`https://api.elevenlabs.io/v1/convai/phone-numbers/${phone.id}`, {
          method: 'PATCH',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone_number: phone.number,
            provider: {
              type: 'twilio',
              twilio_account_sid: TWILIO_ACCOUNT_SID,
              twilio_auth_token: TWILIO_AUTH_TOKEN,
            },
          }),
        });

        const updateData = await updateRes.text();
        logger.info(`Update ${phone.client}`, { status: updateRes.status, body: updateData });
        results.push({ client: phone.client, id: phone.id, action: 'update', status: updateRes.status, response: updateData });
      }

      // Always verify
      const verifyRes = await fetch(`https://api.elevenlabs.io/v1/convai/phone-numbers/${phone.id}`, {
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      });
      const verifyData = await verifyRes.text();
      logger.info(`Verify ${phone.client}`, { status: verifyRes.status, body: verifyData });
      results.push({ client: phone.client, id: phone.id, action: 'verify', status: verifyRes.status, response: verifyData });

    } catch (err) {
      logger.error(`Error for ${phone.client}`, err as Error);
      results.push({ client: phone.client, id: phone.id, action: 'error', error: (err as Error).message });
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
