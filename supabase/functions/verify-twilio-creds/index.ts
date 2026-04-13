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
  const auth = btoa(`${sid}:${token}`);

  // Test 1: List incoming phone numbers
  const listUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json?PageSize=1`;
  const listRes = await fetch(listUrl, {
    headers: { 'Authorization': `Basic ${auth}` },
  });
  const listBody = await listRes.json();

  // Test 2: Look up a specific number
  const lookupUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json?PhoneNumber=%2B12133297677`;
  const lookupRes = await fetch(lookupUrl, {
    headers: { 'Authorization': `Basic ${auth}` },
  });
  const lookupBody = await lookupRes.json();

  return new Response(JSON.stringify({
    list_status: listRes.status,
    list_count: listBody.incoming_phone_numbers?.length,
    list_first: listBody.incoming_phone_numbers?.[0]?.phone_number,
    lookup_status: lookupRes.status,
    lookup_count: lookupBody.incoming_phone_numbers?.length,
    lookup_match: lookupBody.incoming_phone_numbers?.[0]?.phone_number,
    error: !listRes.ok ? listBody : undefined,
  }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
