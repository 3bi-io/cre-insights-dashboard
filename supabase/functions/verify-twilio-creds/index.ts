const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const sid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
  const token = Deno.env.get('TWILIO_AUTH_TOKEN')!;

  const sidPreview = sid.slice(0, 10);
  const tokenPreview = token.slice(0, 10);
  const tokenLength = token.length;

  // Direct Twilio API call to verify credentials
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}.json`;
  const auth = btoa(`${sid}:${token}`);

  const res = await fetch(url, {
    headers: { 'Authorization': `Basic ${auth}` },
  });

  const body = await res.json();

  return new Response(JSON.stringify({
    sid_preview: sidPreview,
    token_preview: tokenPreview,
    token_length: tokenLength,
    twilio_status: res.status,
    twilio_response: res.ok ? { friendly_name: body.friendly_name, status: body.status } : body,
  }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
