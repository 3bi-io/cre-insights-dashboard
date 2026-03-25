import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { checkRateLimitWithGeo, getRateLimitIdentifier } from "../_shared/rate-limiter.ts";
import { createLogger } from "../_shared/logger.ts";
import { 
  getSender,
  getReplyTo,
  getReviewBcc,
  getEmailFooter, 
  getPreheaderText,
  getEmailHeader,
  baseEmailStyles, 
  contentStyles,
  PREHEADER_TEMPLATES 
} from "../_shared/email-config.ts";

const logger = createLogger('send-application-email');

import { getCorsHeaders } from '../_shared/cors-config.ts';

interface EmailRequest {
  to: string;
  subject: string;
  candidateName: string;
  jobTitle: string;
  companyName?: string;
  clientLogoUrl?: string;
  applicationId?: string;
  jobListingId?: string;
  type: 'application_received' | 'status_update' | 'interview_invitation' | 'offer' | 'rejection';
  additionalData?: {
    status?: string;
    interviewDate?: string;
    interviewTime?: string;
    interviewType?: string;
    interviewLink?: string;
    rejectionReason?: string;
  };
}

// Validate email address format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize input to prevent injection
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Get preheader text based on email type
function getPreheader(type: string, jobTitle: string, status?: string): string {
  switch (type) {
    case 'application_received':
      return PREHEADER_TEMPLATES.application_received(jobTitle);
    case 'status_update':
      return PREHEADER_TEMPLATES.status_update(status || 'Updated');
    case 'interview_invitation':
      return PREHEADER_TEMPLATES.interview_invitation(jobTitle);
    case 'offer':
      return PREHEADER_TEMPLATES.offer(jobTitle);
    case 'rejection':
      return PREHEADER_TEMPLATES.rejection();
    default:
      return `Update regarding your application for ${jobTitle}`;
  }
}

const getEmailTemplate = (request: EmailRequest): string => {
  const { type, candidateName, jobTitle, companyName = "Company", clientLogoUrl, applicationId, jobListingId, additionalData } = request;
  
  // Sanitize all inputs
  const safeName = sanitizeInput(candidateName);
  const safeJobTitle = sanitizeInput(jobTitle);
  const safeCompany = sanitizeInput(companyName);
  const safeStatus = additionalData?.status ? sanitizeInput(additionalData.status) : undefined;

  // Get preheader text for email preview
  const preheaderText = getPreheader(type, safeJobTitle, safeStatus);

  switch (type) {
    case 'application_received':
      return `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Received</title>
          </head>
          <body style="${baseEmailStyles}">
            ${getPreheaderText(preheaderText)}
            ${getEmailHeader("Application Received", { gradient: "#667eea 0%, #764ba2 100%", showLogo: true, logoAlt: `${safeCompany} - Application Received`, clientLogoUrl })}
            <div style="${contentStyles}">
              <p style="font-size: 16px; margin-bottom: 20px;">Dear ${safeName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">Thank you for applying for the <strong>${safeJobTitle}</strong> position at ${safeCompany}!</p>
              <p style="font-size: 16px; margin-bottom: 20px;">We have received your application and our team is currently reviewing it. We appreciate your interest in joining our team.</p>
              <div style="background: #f7f9fc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  <strong>What's Next?</strong><br>
                  • Our team will review your application within 2-3 business days<br>
                  • You'll receive an email update on your application status<br>
                  • If selected, we'll reach out to schedule an interview
                </p>
              </div>
              ${applicationId ? `
              <div style="background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #1e40af;">⚡ Speed Up Your Hiring Process</p>
                <p style="margin: 0 0 15px 0; font-size: 14px; color: #475569;">Complete your full application with work history and additional details. Your information has been pre-filled to save you time.</p>
                <a href="https://applyai.jobs/apply/detailed?${jobListingId ? `job_id=${jobListingId}&` : ''}app_id=${applicationId}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 15px;">Complete Your Full Application</a>
              </div>
              ` : ''}
              <p style="font-size: 16px; margin-bottom: 20px;">If you have any questions, feel free to reply to this email.</p>
              <p style="font-size: 16px; margin-bottom: 5px;">Best regards,</p>
              <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${safeCompany} Recruitment Team</p>
            </div>
            ${getEmailFooter({ companyName: safeCompany })}
          </body>
        </html>
      `;

    case 'status_update':
      return `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Status Update</title>
          </head>
          <body style="${baseEmailStyles}">
            ${getPreheaderText(preheaderText)}
            ${getEmailHeader("Application Update", { gradient: "#667eea 0%, #764ba2 100%", showLogo: true, logoAlt: `${safeCompany} - Status Update`, clientLogoUrl })}
            <div style="${contentStyles}">
              <p style="font-size: 16px; margin-bottom: 20px;">Dear ${safeName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">We have an update regarding your application for the <strong>${safeJobTitle}</strong> position.</p>
              <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 16px; color: #1e40af;">
                  <strong>Status:</strong> ${safeStatus || 'Under Review'}
                </p>
              </div>
              <p style="font-size: 16px; margin-bottom: 20px;">We appreciate your patience throughout this process. We'll keep you updated on any further developments.</p>
              <p style="font-size: 16px; margin-bottom: 5px;">Best regards,</p>
              <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${safeCompany} Recruitment Team</p>
            </div>
            ${getEmailFooter({ companyName: safeCompany })}
          </body>
        </html>
      `;

    case 'interview_invitation':
      const safeDate = additionalData?.interviewDate ? sanitizeInput(additionalData.interviewDate) : 'TBD';
      const safeTime = additionalData?.interviewTime ? sanitizeInput(additionalData.interviewTime) : 'TBD';
      const safeType = additionalData?.interviewType ? sanitizeInput(additionalData.interviewType) : 'Video Interview';
      const safeLink = additionalData?.interviewLink || '';
      
      return `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Interview Invitation</title>
          </head>
          <body style="${baseEmailStyles}">
            ${getPreheaderText(preheaderText)}
            ${getEmailHeader("Interview Invitation", { gradient: "#10b981 0%, #059669 100%", showLogo: true, logoAlt: `${safeCompany} - Interview Invitation`, clientLogoUrl })}
            <div style="${contentStyles}">
              <p style="font-size: 16px; margin-bottom: 20px;">Dear ${safeName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">Great news! We'd like to invite you for an interview for the <strong>${safeJobTitle}</strong> position at ${safeCompany}.</p>
              <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Interview Details:</strong></p>
                <p style="margin: 5px 0; font-size: 14px;">📅 Date: ${safeDate}</p>
                <p style="margin: 5px 0; font-size: 14px;">🕐 Time: ${safeTime}</p>
                <p style="margin: 5px 0; font-size: 14px;">📝 Type: ${safeType}</p>
                ${safeLink ? `<p style="margin: 15px 0 5px 0; font-size: 14px;"><a href="${safeLink}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Join Interview</a></p>` : ''}
              </div>
              <p style="font-size: 16px; margin-bottom: 20px;">Please confirm your availability by replying to this email. We look forward to speaking with you!</p>
              <p style="font-size: 16px; margin-bottom: 5px;">Best regards,</p>
              <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${safeCompany} Recruitment Team</p>
            </div>
            ${getEmailFooter({ companyName: safeCompany })}
          </body>
        </html>
      `;

    case 'offer':
      return `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Job Offer</title>
          </head>
          <body style="${baseEmailStyles}">
            ${getPreheaderText(preheaderText)}
            ${getEmailHeader("🎉 Congratulations!", { gradient: "#f59e0b 0%, #d97706 100%", showLogo: true, logoAlt: `${safeCompany} - Job Offer`, clientLogoUrl })}
            <div style="${contentStyles}">
              <p style="font-size: 16px; margin-bottom: 20px;">Dear ${safeName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">We are thrilled to offer you the position of <strong>${safeJobTitle}</strong> at ${safeCompany}!</p>
              <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #92400e;">Your talent and experience impressed us, and we believe you'll be a great addition to our team!</p>
              </div>
              <p style="font-size: 16px; margin-bottom: 20px;">We'll send you a formal offer letter with all the details shortly. Please review it carefully and let us know if you have any questions.</p>
              <p style="font-size: 16px; margin-bottom: 20px;">We're excited about the possibility of you joining our team!</p>
              <p style="font-size: 16px; margin-bottom: 5px;">Best regards,</p>
              <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${safeCompany} Recruitment Team</p>
            </div>
            ${getEmailFooter({ companyName: safeCompany })}
          </body>
        </html>
      `;

    case 'rejection':
      return `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Update</title>
          </head>
          <body style="${baseEmailStyles}">
            ${getPreheaderText(preheaderText)}
            ${getEmailHeader("Application Update", { gradient: "#6b7280 0%, #4b5563 100%", showLogo: true, logoAlt: `${safeCompany} - Application Update`, clientLogoUrl })}
            <div style="${contentStyles}">
              <p style="font-size: 16px; margin-bottom: 20px;">Dear ${safeName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">Thank you for your interest in the <strong>${safeJobTitle}</strong> position at ${safeCompany} and for taking the time to interview with our team.</p>
              <p style="font-size: 16px; margin-bottom: 20px;">After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  We were impressed by your background and encourage you to apply for future opportunities that match your skills and experience. We'll keep your application on file for consideration for other positions.
                </p>
              </div>
              <p style="font-size: 16px; margin-bottom: 20px;">We wish you the best in your job search and future career endeavors.</p>
              <p style="font-size: 16px; margin-bottom: 5px;">Best regards,</p>
              <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${safeCompany} Recruitment Team</p>
            </div>
            ${getEmailFooter({ companyName: safeCompany })}
          </body>
        </html>
      `;

    default:
      return `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Update</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            ${getPreheaderText(`Update regarding your application for ${safeJobTitle}`)}
            <p>Dear ${safeName},</p>
            <p>This is an update regarding your application for ${safeJobTitle}.</p>
            <p>Best regards,<br>${safeCompany}</p>
          </body>
        </html>
      `;
  }
};

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting - 10 requests per minute per IP (50/min for DFW/Alabama devs)
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithGeo(req, identifier, { 
    maxRequests: 10, 
    windowMs: 60000,
    keyPrefix: 'email'
  });
  
  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded', {
      identifier,
      geoApplied: rateLimitResult.geoApplied,
      effectiveLimit: rateLimitResult.effectiveMaxRequests
    });
    return new Response(
      JSON.stringify({ 
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: rateLimitResult.retryAfter 
      }),
      {
        status: 429,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders,
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "Retry-After": (rateLimitResult.retryAfter || 60).toString()
        },
      }
    );
  }

  try {
    // Check if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      logger.error("RESEND_API_KEY is not configured");
      throw new Error("Email service is not configured. Please add RESEND_API_KEY.");
    }
    
    const resend = new Resend(resendApiKey);

    const emailRequest: EmailRequest = await req.json();
    
    // Validate required fields
    if (!emailRequest.to || !emailRequest.candidateName || !emailRequest.jobTitle || !emailRequest.type) {
      throw new Error("Missing required fields: to, candidateName, jobTitle, type");
    }

    // Validate email format
    if (!isValidEmail(emailRequest.to)) {
      throw new Error("Invalid email address format");
    }

    logger.info("Email request received", {
      to: emailRequest.to,
      type: emailRequest.type,
      subject: emailRequest.subject
    });

    const htmlContent = getEmailTemplate(emailRequest);

    // Send email using Resend with verified domain
    const emailResponse = await resend.emails.send({
      from: getSender('default'),
      to: [emailRequest.to],
      bcc: getReviewBcc(),
      replyTo: getReplyTo('support'),
      subject: emailRequest.subject,
      html: htmlContent,
    });

    if (emailResponse.error) {
      logger.error("Resend error", emailResponse.error);
      throw new Error(emailResponse.error.message || "Failed to send email");
    }

    logger.info("Email sent successfully", { emailId: emailResponse.data?.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        id: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString()
        },
      }
    );
  } catch (error: any) {
    logger.error("Error in send-application-email function", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
