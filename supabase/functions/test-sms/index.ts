import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendSms } from '../_shared/twilio-client.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const { to, message } = await req.json();
    if (!to || !message) {
      return new Response(JSON.stringify({ error: 'Missing to or message' }), { status: 400 });
    }

    const result = await sendSms(to, message);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
});
