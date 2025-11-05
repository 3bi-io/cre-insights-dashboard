// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { getCorsHeaders } from '../_shared/cors-config.ts'

function escapeXML(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function validatePhoneNumber(phone: string): { valid: boolean; error?: string; normalized?: string } {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/[^\d]/g, '');
  
  // Must be 10 or 11 digits
  if (digitsOnly.length < 10 || digitsOnly.length > 11) {
    return { valid: false, error: 'Phone number must be 10 or 11 digits' };
  }
  
  // If 11 digits, must start with 1
  if (digitsOnly.length === 11 && !digitsOnly.startsWith('1')) {
    return { valid: false, error: 'Invalid phone number format' };
  }
  
  // Normalize to E.164 format
  const normalized = digitsOnly.length === 10 
    ? `+1${digitsOnly}` 
    : `+${digitsOnly}`;
  
  return { valid: true, normalized };
}

interface SmsAuthRequest {
  action: 'send_magic_link' | 'verify_token' | 'make_call';
  phoneNumber: string;
  token?: string;
  message?: string;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
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
  // Validate phone number
  const validation = validatePhoneNumber(phoneNumber);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid phone number');
  }
  
  const normalizedPhone = validation.normalized!;
  
  // Generate a 6-digit token
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  // Store the token in the database
  const { error: dbError } = await supabase
    .from('sms_magic_links')
    .insert({
      phone_number: normalizedPhone,
      token: token,
      expires_at: expiresAt.toISOString(),
      used: false,
      user_id: null // Will be associated when verified or during application process
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
      To: normalizedPhone,
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
  // Validate phone number
  const validation = validatePhoneNumber(phoneNumber);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid phone number');
  }
  
  const normalizedPhone = validation.normalized!;
  
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    throw new Error('Twilio credentials not configured');
  }

  // Escape message to prevent TwiML injection
  const safeMessage = escapeXML(message);
  
  // Create TwiML for the call
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="alice">${safeMessage}</Say>
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
      To: normalizedPhone,
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