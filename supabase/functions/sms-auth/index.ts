import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmsAuthRequest {
  action: 'send_magic_link' | 'verify_token' | 'make_call';
  phoneNumber: string;
  token?: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, phoneNumber, token, message }: SmsAuthRequest = await req.json();

    switch (action) {
      case 'send_magic_link':
        return await sendMagicLink(phoneNumber, supabase);
      
      case 'verify_token':
        return await verifyToken(phoneNumber, token!, supabase);
      
      case 'make_call':
        return await makeCall(phoneNumber, message || 'Hello from IntelliApp!');
      
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in sms-auth function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

async function sendMagicLink(phoneNumber: string, supabase: any) {
  // Generate a 6-digit token
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  // Store the token in the database
  const { error: dbError } = await supabase
    .from('sms_magic_links')
    .insert({
      phone_number: phoneNumber,
      token: token,
      expires_at: expiresAt.toISOString(),
      used: false
    });

  if (dbError) {
    throw new Error(`Database error: ${dbError.message}`);
  }

  // Send SMS using Twilio
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const message = `Your IntelliApp verification code is: ${token}. This code expires in 15 minutes.`;

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  const twilioCredentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

  const twilioResponse = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${twilioCredentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: twilioPhoneNumber,
      To: phoneNumber,
      Body: message,
    }),
  });

  if (!twilioResponse.ok) {
    const errorText = await twilioResponse.text();
    throw new Error(`Twilio error: ${errorText}`);
  }

  const twilioResult = await twilioResponse.json();
  console.log('SMS sent successfully:', twilioResult.sid);

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Verification code sent successfully',
      messageSid: twilioResult.sid 
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  );
}

async function verifyToken(phoneNumber: string, token: string, supabase: any) {
  // Find valid token
  const { data: linkData, error: findError } = await supabase
    .from('sms_magic_links')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (findError || !linkData) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired verification code' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // Mark token as used
  const { error: updateError } = await supabase
    .from('sms_magic_links')
    .update({ used: true })
    .eq('id', linkData.id);

  if (updateError) {
    throw new Error(`Database update error: ${updateError.message}`);
  }

  // Create a temporary session token for the application process
  const sessionToken = crypto.randomUUID();
  const sessionExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return new Response(
    JSON.stringify({ 
      success: true, 
      sessionToken,
      expiresAt: sessionExpiry.toISOString(),
      phoneNumber: linkData.phone_number
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  );
}

async function makeCall(phoneNumber: string, message: string) {
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    throw new Error('Twilio credentials not configured');
  }

  // Create TwiML for the call
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="alice">${message}</Say>
    </Response>`;

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`;
  const twilioCredentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

  const twilioResponse = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${twilioCredentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: twilioPhoneNumber,
      To: phoneNumber,
      Twiml: twiml,
    }),
  });

  if (!twilioResponse.ok) {
    const errorText = await twilioResponse.text();
    throw new Error(`Twilio call error: ${errorText}`);
  }

  const twilioResult = await twilioResponse.json();
  console.log('Call initiated successfully:', twilioResult.sid);

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Call initiated successfully',
      callSid: twilioResult.sid 
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  );
}