/**
 * Test Email Sender - Sends sample copies of all email types for review
 * This is a temporary utility function for testing email templates
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createLogger } from "../_shared/logger.ts";
import { 
  EMAIL_CONFIG, 
  getSender,
  getReplyTo,
  getReviewBcc,
  getEmailFooter, 
  getEmailHeader, 
  getPreheaderText,
  baseEmailStyles, 
  contentStyles, 
  buttonStyles,
  PREHEADER_TEMPLATES
} from "../_shared/email-config.ts";

const logger = createLogger('send-test-emails');
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

import { getCorsHeaders } from '../_shared/cors-config.ts';

// Email templates
const emails = {
  welcome: (to: string) => ({
    subject: `[TEST] Welcome to ${EMAIL_CONFIG.brand.name}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="${baseEmailStyles} background-color: #f5f5f5;">
        ${getPreheaderText(PREHEADER_TEMPLATES.welcome("3BI Solutions"))}
        <div style="max-width: 600px; margin: 0 auto;">
          ${getEmailHeader(`Welcome to ${EMAIL_CONFIG.brand.name}! 🎉`, { gradient: "#3b82f6 0%, #667eea 100%", showLogo: true, logoAlt: "Apply AI - Welcome" })}
          <div style="${contentStyles}">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>Chris</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Welcome to <strong>3BI Solutions</strong> on ${EMAIL_CONFIG.brand.name}! Your account is ready.</p>
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1e40af;">🚀 Quick Start Guide</h3>
              <ol style="margin: 0; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 8px;"><strong>Log in</strong> to your dashboard</li>
                <li style="margin-bottom: 8px;"><strong>Complete your profile</strong> in Settings</li>
                <li style="margin-bottom: 8px;"><strong>Explore the dashboard</strong> to manage applications</li>
              </ol>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${EMAIL_CONFIG.brand.website}/auth" style="${buttonStyles}">Log In to Your Account</a>
            </div>
          </div>
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `
  }),

  invite: (to: string) => ({
    subject: `[TEST] You're invited to join 3BI Solutions on ${EMAIL_CONFIG.brand.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="${baseEmailStyles} background-color: #f3f4f6;">
        ${getPreheaderText(PREHEADER_TEMPLATES.invite("Apply AI Team", "3BI Solutions", "Administrator"))}
        <div style="max-width: 600px; margin: 40px auto;">
          ${getEmailHeader("You're Invited! 🎉", { gradient: "#3b82f6 0%, #8b5cf6 100%", showLogo: true, logoAlt: "Apply AI - Team Invitation" })}
          <div style="${contentStyles}">
            <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
              <strong>Apply AI Team</strong> has invited you to join <strong>3BI Solutions</strong> on ${EMAIL_CONFIG.brand.name} as an <strong>Administrator</strong>.
            </p>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">
              ${EMAIL_CONFIG.brand.name} is a modern applicant tracking system that helps teams hire faster with AI-powered voice recruitment and smart automation.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${EMAIL_CONFIG.brand.website}/auth?org=3bi" style="${buttonStyles}">Accept Invitation & Sign Up</a>
            </div>
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="font-size: 13px; color: #6b7280; margin: 0;">
                <strong>Your role:</strong> Administrator<br>
                <strong>Organization:</strong> 3BI Solutions
              </p>
            </div>
          </div>
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `
  }),

  application_received: (to: string) => ({
    subject: "[TEST] Application Received - CDL Class A Driver",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="${baseEmailStyles} background-color: #f5f5f5;">
        ${getPreheaderText(PREHEADER_TEMPLATES.application_received("CDL Class A Driver"))}
        <div style="max-width: 600px; margin: 0 auto;">
          ${getEmailHeader("Application Received ✓", { gradient: "#10b981 0%, #059669 100%", showLogo: true, logoAlt: "Apply AI - Application Confirmation" })}
          <div style="${contentStyles}">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>John Smith</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Thank you for applying for the <strong>CDL Class A Driver</strong> position at <strong>3BI Solutions</strong>.</p>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">We have received your application and our team will review it shortly. You will be notified of any updates to your application status.</p>
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #166534;"><strong>What happens next?</strong></p>
              <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #166534;">
                <li>Our recruiting team will review your qualifications</li>
                <li>If selected, you'll receive an interview invitation</li>
                <li>Check your email regularly for updates</li>
              </ul>
            </div>
          </div>
          ${getEmailFooter({ companyName: "3BI Solutions" })}
        </div>
      </body>
      </html>
    `
  }),

  interview_invitation: (to: string) => ({
    subject: "[TEST] Interview Invitation - CDL Class A Driver",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="${baseEmailStyles} background-color: #f5f5f5;">
        ${getPreheaderText(PREHEADER_TEMPLATES.interview_invitation("CDL Class A Driver"))}
        <div style="max-width: 600px; margin: 0 auto;">
          ${getEmailHeader("Interview Invitation 📅", { gradient: "#8b5cf6 0%, #6366f1 100%", showLogo: true, logoAlt: "Apply AI - Interview Invitation" })}
          <div style="${contentStyles}">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>John Smith</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Great news! We were impressed with your application and would like to invite you to interview for the <strong>CDL Class A Driver</strong> position.</p>
            <div style="background: #faf5ff; border: 1px solid #e9d5ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #6b21a8;">📋 Interview Details</h3>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Date:</strong> January 28, 2026</p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Time:</strong> 2:00 PM EST</p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Location:</strong> Virtual - Zoom</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="${buttonStyles}">Confirm Interview</a>
            </div>
          </div>
          ${getEmailFooter({ companyName: "3BI Solutions" })}
        </div>
      </body>
      </html>
    `
  }),

  offer: (to: string) => ({
    subject: "[TEST] Job Offer - CDL Class A Driver",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="${baseEmailStyles} background-color: #f5f5f5;">
        ${getPreheaderText(PREHEADER_TEMPLATES.offer("CDL Class A Driver"))}
        <div style="max-width: 600px; margin: 0 auto;">
          ${getEmailHeader("Congratulations! 🎉", { gradient: "#f59e0b 0%, #d97706 100%", showLogo: true, logoAlt: "Apply AI - Job Offer" })}
          <div style="${contentStyles}">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>John Smith</strong>,</p>
            <p style="font-size: 18px; margin-bottom: 20px; color: #d97706;"><strong>We are pleased to offer you the position of CDL Class A Driver at 3BI Solutions!</strong></p>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">After careful consideration, we believe you would be a valuable addition to our team. Please review the attached offer letter for details on compensation, benefits, and start date.</p>
            <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h3 style="margin: 0 0 12px 0; color: #92400e;">📄 Next Steps</h3>
              <ol style="margin: 0; padding-left: 20px; color: #92400e;">
                <li style="margin-bottom: 8px;">Review the offer details carefully</li>
                <li style="margin-bottom: 8px;">Sign and return the offer letter</li>
                <li style="margin-bottom: 8px;">Complete onboarding paperwork</li>
              </ol>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="${buttonStyles} background-color: #f59e0b;">Accept Offer</a>
            </div>
          </div>
          ${getEmailFooter({ companyName: "3BI Solutions" })}
        </div>
      </body>
      </html>
    `
  }),

  magic_link: (to: string) => ({
    subject: `[TEST] Your ${EMAIL_CONFIG.brand.name} Sign-in Link`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="${baseEmailStyles} background-color: #f5f5f5;">
        ${getPreheaderText(PREHEADER_TEMPLATES.magic_link())}
        <div style="max-width: 600px; margin: 0 auto;">
          ${getEmailHeader(`Sign In to ${EMAIL_CONFIG.brand.name} 🔐`, { gradient: "#3b82f6 0%, #1d4ed8 100%", showLogo: true, logoAlt: "Apply AI - Secure Sign In" })}
          <div style="${contentStyles}">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Click the button below to securely sign in to your ${EMAIL_CONFIG.brand.name} account. This link will expire in 1 hour.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${EMAIL_CONFIG.brand.website}/auth" style="${buttonStyles}">Sign In to ${EMAIL_CONFIG.brand.name}</a>
            </div>
            <div style="background: #fef2f2; border: 1px solid #fee2e2; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; font-size: 13px; color: #991b1b;">
                <strong>🔒 Security Notice:</strong> If you didn't request this link, please ignore this email. Your account is safe.
              </p>
            </div>
          </div>
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `
  }),

  screening_request: (to: string) => ({
    subject: "[TEST] Background Check Request - 3BI Solutions",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="${baseEmailStyles} background-color: #f5f5f5;">
        ${getPreheaderText(PREHEADER_TEMPLATES.background_check("John Smith"))}
        <div style="max-width: 600px; margin: 0 auto;">
          ${getEmailHeader("Background Check Request 🔍", { gradient: "#6366f1 0%, #4f46e5 100%", showLogo: true, logoAlt: "Apply AI - Screening Request" })}
          <div style="${contentStyles}">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>John Smith</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">As part of the hiring process at <strong>3BI Solutions</strong>, we need to conduct a background verification.</p>
            <div style="background: #eef2ff; border-left: 4px solid #6366f1; padding: 16px; margin: 24px 0;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #3730a3;"><strong>What you need to do:</strong></p>
              <ol style="margin: 0; padding-left: 20px; color: #3730a3;">
                <li style="margin-bottom: 8px;">Click the button below to start the process</li>
                <li style="margin-bottom: 8px;">Complete the authorization form</li>
                <li style="margin-bottom: 8px;">Submit required documents</li>
              </ol>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="${buttonStyles} background-color: #6366f1;">Start Background Check</a>
            </div>
          </div>
          ${getEmailFooter({ companyName: "3BI Solutions" })}
        </div>
      </body>
      </html>
    `
  })
};

serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to } = await req.json();
    
    if (!to) {
      return new Response(
        JSON.stringify({ error: "Recipient email 'to' is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results: Record<string, { success: boolean; id?: string; error?: string }> = {};

    // Send all test emails
    for (const [name, generator] of Object.entries(emails)) {
      try {
        const email = generator(to);
        const response = await resend.emails.send({
          from: getSender('default'),
          to: [to],
          bcc: getReviewBcc(),
          replyTo: getReplyTo('support'),
          subject: email.subject,
          html: email.html
        });

        if (response.error) {
          results[name] = { success: false, error: response.error.message };
        } else {
          results[name] = { success: true, id: response.data?.id };
        }
        
        // Small delay between sends to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err: any) {
        results[name] = { success: false, error: err.message };
      }
    }

    logger.info('Test emails sent', { to, results });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${Object.keys(emails).length} test emails to ${to}`,
        results 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    logger.error('Error sending test emails', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
