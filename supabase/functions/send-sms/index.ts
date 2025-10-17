import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://auwhcdpppldjlcaxzsme.supabase.co',
  'http://localhost:5173',
  'http://localhost:3000'
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function validatePhoneNumber(phone: string): { valid: boolean; error?: string; normalized?: string } {
  const digitsOnly = phone.replace(/[^\d]/g, '');
  
  if (digitsOnly.length < 10 || digitsOnly.length > 11) {
    return { valid: false, error: 'Phone number must be 10 or 11 digits' };
  }
  
  if (digitsOnly.length === 11 && !digitsOnly.startsWith('1')) {
    return { valid: false, error: 'Invalid phone number format' };
  }
  
  const normalized = digitsOnly.length === 10 
    ? `+1${digitsOnly}` 
    : `+${digitsOnly}`;
  
  return { valid: true, normalized };
}

interface SendSmsRequest {
  to: string;
  message: string;
  conversationId: string;
  messageId: string;
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, conversationId, messageId }: SendSmsRequest = await req.json();

    if (!to || !message) {
      throw new Error('Phone number and message are required');
    }
    
    // Validate phone number
    const validation = validatePhoneNumber(to);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid phone number');
    }
    
    const normalizedPhone = validation.normalized!;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Twilio credentials not configured');
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', normalizedPhone);
    formData.append('From', twilioPhoneNumber);
    formData.append('Body', message);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioResult);
      
      // Update message status to failed
      await supabase
        .from('sms_messages')
        .update({ 
          status: 'failed',
          twilio_sid: twilioResult.error_code || null
        })
        .eq('id', messageId);

      throw new Error(twilioResult.message || 'Failed to send SMS');
    }

    // Update message with Twilio SID and delivered status
    const { error: updateError } = await supabase
      .from('sms_messages')
      .update({ 
        status: 'delivered',
        twilio_sid: twilioResult.sid
      })
      .eq('id', messageId);

    if (updateError) {
      console.error('Failed to update message status:', updateError);
    }

    console.log('SMS sent successfully:', twilioResult.sid);

    return new Response(JSON.stringify({ 
      success: true, 
      twilioSid: twilioResult.sid,
      messageId 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-sms function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);