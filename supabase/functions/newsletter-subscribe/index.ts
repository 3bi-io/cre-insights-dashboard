/**
 * Newsletter Subscribe Edge Function
 * Handles newsletter signups, stores in database, and sends welcome email
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { Resend } from "npm:resend@2.0.0";
import { wrapHandler } from '../_shared/error-handler.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse } from '../_shared/response.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { createLogger } from '../_shared/logger.ts';
import { 
  getSender, getReviewBcc, getReplyTo,
  baseEmailStyles, contentStyles, buttonStyles,
  getEmailHeader, getEmailFooter, getPreheaderText
} from '../_shared/email-config.ts';
import { enforceRateLimit, getRateLimitIdentifier } from '../_shared/rate-limiter.ts';

const logger = createLogger('newsletter-subscribe');

const SubscribeSchema = z.object({
  email: z.string().email("Valid email is required").max(255),
  source: z.string().max(50).optional().default('footer'),
});

const generateWelcomeEmail = (): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Apply AI Newsletter</title>
      </head>
      <body style="${baseEmailStyles}">
        ${getPreheaderText("You're subscribed! Get the latest AI recruitment insights delivered to your inbox.")}
        ${getEmailHeader("Welcome to the Newsletter! 📬", { showLogo: true, logoAlt: "Apply AI - Newsletter" })}
        <div style="${contentStyles}">
          <p style="font-size: 16px; margin-bottom: 20px;">Thanks for subscribing to the Apply AI newsletter!</p>
          <p style="font-size: 14px; color: #374151; margin-bottom: 20px;">
            You'll receive the latest insights on AI-powered recruitment, hiring strategies, and product updates directly in your inbox.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://applyai.jobs/blog" style="${buttonStyles}">
              Read Our Latest Posts
            </a>
          </div>
        </div>
        ${getEmailFooter({ showUnsubscribe: true, emailType: 'marketing' })}
      </body>
    </html>
  `;
};

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit: 5 per minute per IP
  const identifier = getRateLimitIdentifier(req);
  await enforceRateLimit(identifier, { maxRequests: 5, windowMs: 60000, keyPrefix: 'newsletter' });

  const rawBody = await req.json();
  const validationResult = SubscribeSchema.safeParse(rawBody);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid email address' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { email, source } = validationResult.data;
  const supabase = getServiceClient();

  // Upsert: re-subscribe if previously unsubscribed
  const { error: dbError } = await supabase
    .from("newsletter_subscribers")
    .upsert(
      { email, source, subscribed_at: new Date().toISOString(), unsubscribed_at: null },
      { onConflict: 'email' }
    );

  if (dbError) {
    logger.warn("Database error", { error: dbError });
  }

  logger.info("Newsletter subscription", { email, source });

  // Send welcome email
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: getSender('notifications'),
        to: [email],
        bcc: getReviewBcc(),
        replyTo: getReplyTo('support'),
        subject: 'Welcome to the Apply AI Newsletter! 📬',
        html: generateWelcomeEmail(),
      });
      logger.info('Welcome email sent', { email });
    } catch (emailError: any) {
      logger.warn('Error sending welcome email', { error: emailError.message });
    }
  }

  return successResponse({ message: "You're subscribed! Check your inbox for a welcome email." });
}, { context: 'NewsletterSubscribe', logRequests: true });

serve(handler);
