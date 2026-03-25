import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { sendSms } from '../_shared/twilio-client.ts';

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message } = await req.json();
    if (!to || !message) {
      return new Response(JSON.stringify({ error: 'Missing to or message' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await sendSms(to, message);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
