import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getServiceClient } from '../_shared/supabase-client.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse, validationErrorResponse, rateLimitResponse } from '../_shared/response.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimitWithGeo } from '../_shared/rate-limiter.ts';
import { sendSms } from '../_shared/twilio-client.ts';
import { verifyUser } from '../_shared/auth.ts';

const logger = createLogger('send-sms');

const smsRequestSchema = z.object({
  to: z.string().min(10, 'Phone number must be at least 10 digits'),
  message: z.string().min(1, 'Message is required').max(1600, 'Message too long'),
  conversationId: z.string().uuid('Invalid conversation ID').optional(),
  messageId: z.string().uuid('Invalid message ID').optional(),
});

type SMSRequest = z.infer<typeof smsRequestSchema>;

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
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

    // Rate limiting
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

    const supabase = getServiceClient();

    logger.info('Sending SMS', { 
      conversation_id: conversationId || 'system',
      user_id: user.id,
    });

    const startTime = Date.now();
    const twilioResult = await sendSms(to, message);
    const duration = Date.now() - startTime;

    // Log to sms_logs audit table
    try {
      await supabase.from('sms_logs').insert({
        direction: 'outbound',
        from_number: Deno.env.get('TWILIO_PHONE_NUMBER') || '',
        to_number: to,
        body: message.slice(0, 1600),
        twilio_sid: twilioResult.sid || null,
        status: twilioResult.success ? 'sent' : 'failed',
        error_message: twilioResult.error || null,
        error_code: twilioResult.errorCode || null,
        conversation_id: conversationId || null,
        message_id: messageId || null,
        duration_ms: duration,
        metadata: { user_id: user.id, organization_id: user.organization_id },
      });
    } catch (logErr) {
      logger.warn('Failed to write sms_logs', { error: (logErr as Error).message });
    }

    if (!twilioResult.success) {
      logger.error('Twilio error', undefined, { 
        error: twilioResult.error,
        error_code: twilioResult.errorCode,
        duration_ms: duration 
      });
      
      if (messageId) {
        await supabase
          .from('sms_messages')
          .update({ 
            status: 'failed',
            twilio_sid: String(twilioResult.errorCode || '')
          })
          .eq('id', messageId);
      }

      return errorResponse(twilioResult.error || 'Failed to send SMS', 500, undefined, origin || undefined);
    }

    // Update message with Twilio SID and delivered status
    if (messageId) {
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
