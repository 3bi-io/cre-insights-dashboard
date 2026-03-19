import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getServiceClient } from '../_shared/supabase-client.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse, validationErrorResponse, rateLimitResponse } from '../_shared/response.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimitWithGeo } from '../_shared/rate-limiter.ts';
import { verifyUser } from '../_shared/auth.ts';

const logger = createLogger('send-sms');

// Zod schema for SMS request validation
const smsRequestSchema = z.object({
  to: z.string().min(10, 'Phone number must be at least 10 digits'),
  message: z.string().min(1, 'Message is required').max(1600, 'Message too long'),
  conversationId: z.string().uuid('Invalid conversation ID').optional(),
  messageId: z.string().uuid('Invalid message ID').optional(),
});

type SMSRequest = z.infer<typeof smsRequestSchema>;

function normalizePhoneNumber(phone: string): { valid: boolean; error?: string; normalized?: string } {
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

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    let user;
    try {
      user = await verifyUser(req);
      logger.info('User authenticated', { user_id: user.id });
    } catch (authError) {
      logger.warn('Authentication failed', { error: (authError as Error).message });
      return errorResponse('Authentication required', 401, undefined, origin || undefined);
    }

    // Rate limiting - 30 SMS per minute per user (150/min for DFW/Alabama devs)
    const rateLimitResult = await checkRateLimitWithGeo(req, `sms:${user.id}`, {
      maxRequests: 30,
      windowMs: 60000,
    });

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { 
        user_id: user.id,
        geo_applied: rateLimitResult.geoApplied,
        effective_limit: rateLimitResult.effectiveMaxRequests
      });
      return rateLimitResponse(rateLimitResult.retryAfter, origin || undefined);
    }

    // Parse and validate request body
    const rawBody = await req.json();
    const validationResult = smsRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors, origin || undefined);
    }

    const { to, message, conversationId, messageId } = validationResult.data;

    // Validate and normalize phone number
    const phoneValidation = normalizePhoneNumber(to);
    if (!phoneValidation.valid) {
      return validationErrorResponse(phoneValidation.error || 'Invalid phone number', origin || undefined);
    }
    
    const normalizedPhone = phoneValidation.normalized!;

    // Initialize Supabase client
    const supabase = getServiceClient();

    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      logger.error('Twilio credentials not configured');
      return errorResponse('SMS service not configured', 500, undefined, origin || undefined);
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', normalizedPhone);
    formData.append('From', twilioPhoneNumber);
    formData.append('Body', message);

    logger.info('Sending SMS', { 
      to: normalizedPhone.slice(0, -4) + '****', // Mask phone for logging
      conversation_id: conversationId || 'system',
    });

    const startTime = Date.now();
    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    const duration = Date.now() - startTime;

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      logger.error('Twilio error', undefined, { 
        status: twilioResponse.status, 
        error_code: twilioResult.code,
        duration_ms: duration 
      });
      
      // Update message status to failed
      await supabase
        .from('sms_messages')
        .update({ 
          status: 'failed',
          twilio_sid: twilioResult.error_code || null
        })
        .eq('id', messageId);

      return errorResponse(twilioResult.message || 'Failed to send SMS', 500, undefined, origin || undefined);
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
      logger.warn('Failed to update message status', { error: updateError.message });
    }

    logger.info('SMS sent successfully', { 
      twilio_sid: twilioResult.sid, 
      duration_ms: duration 
    });

    return successResponse(
      { 
        twilioSid: twilioResult.sid,
        messageId 
      },
      'SMS sent successfully',
      { duration_ms: duration },
      origin || undefined
    );

  } catch (error) {
    const err = error as Error;
    logger.error('Error in send-sms function', err);
    return errorResponse(err.message || 'Internal server error', 500, undefined, origin || undefined);
  }
};

serve(handler);
