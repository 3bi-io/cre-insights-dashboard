/**
 * Contact Form Edge Function
 * Handles contact form submissions, stores in database, and sends admin notification
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { Resend } from "npm:resend@2.0.0";
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse } from '../_shared/response.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { createLogger } from '../_shared/logger.ts';
import { getSender, baseEmailStyles, contentStyles, getEmailFooter } from '../_shared/email-config.ts';

const logger = createLogger('contact-form');

// Zod validation schema
const ContactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Valid email is required"),
  company: z.string().min(1, "Company is required").max(200),
  jobTitle: z.string().max(100).optional(),
  companySize: z.string().max(50).optional(),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(5000),
});

/**
 * Generate admin notification email HTML
 */
const generateAdminNotificationEmail = (data: z.infer<typeof ContactFormSchema>): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
      </head>
      <body style="${baseEmailStyles}">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📬 New Contact Form Submission</h1>
        </div>
        <div style="${contentStyles}">
          <p style="font-size: 16px; margin-bottom: 20px;">A new contact form submission has been received:</p>
          
          <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #3b82f6;">${data.email}</a></p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Company:</strong> ${data.company}</p>
            ${data.jobTitle ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Job Title:</strong> ${data.jobTitle}</p>` : ''}
            ${data.companySize ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Company Size:</strong> ${data.companySize}</p>` : ''}
          </div>
          
          <div style="margin-top: 25px;">
            <p style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">Subject: ${data.subject}</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; white-space: pre-wrap;">${data.message}</p>
            </div>
          </div>
          
          <div style="margin-top: 25px; text-align: center;">
            <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" 
               style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Reply to ${data.firstName}
            </a>
          </div>
        </div>
        ${getEmailFooter()}
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

  // Parse and validate input
  const rawBody = await req.json();
  const validationResult = ContactFormSchema.safeParse(rawBody);
  
  if (!validationResult.success) {
    logger.warn('Contact form validation failed', { issues: validationResult.error.issues });
    throw new ValidationError('Validation failed', validationResult.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    })));
  }

  const body = validationResult.data;
  const supabase = getServiceClient();

  // Store in database
  const { error: dbError } = await supabase
    .from("contact_submissions")
    .insert({
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      company: body.company,
      job_title: body.jobTitle || null,
      company_size: body.companySize || null,
      subject: body.subject,
      message: body.message,
      status: "new",
    });

  if (dbError) {
    logger.warn("Database error", { error: dbError });
    // Don't fail if table doesn't exist - just log and continue
    if (dbError.code !== "42P01") {
      logger.debug("Contact form data (table may not exist)", { data: body });
    }
  }

  logger.info("Contact form submission received", {
    name: `${body.firstName} ${body.lastName}`,
    email: body.email,
    company: body.company,
    subject: body.subject,
  });

  // Send admin notification email
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      
      const emailResponse = await resend.emails.send({
        from: getSender('notifications'),
        to: ['admin@3bi.io'], // Admin notification recipient
        subject: `New Contact Form: ${body.subject}`,
        html: generateAdminNotificationEmail(body),
        replyTo: body.email
      });

      if (emailResponse.error) {
        logger.warn('Failed to send admin notification', { error: emailResponse.error });
      } else {
        logger.info('Admin notification sent', { emailId: emailResponse.data?.id });
      }
    } catch (emailError: any) {
      logger.warn('Error sending admin notification', { error: emailError.message });
      // Don't fail the request if email fails
    }
  } else {
    logger.warn('RESEND_API_KEY not configured, skipping admin notification');
  }

  return successResponse({ 
    message: "Thank you for contacting us. We'll get back to you within 24 hours." 
  });
}, { context: 'ContactForm', logRequests: true });

serve(handler);
