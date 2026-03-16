import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimitWithGeo, getRateLimitIdentifier } from "../_shared/rate-limiter.ts";
import { createLogger } from "../_shared/logger.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { 
  getSender,
  getReplyTo,
  getReviewBcc,
  getPreheaderText,
  getEmailHeader,
  getEmailFooter,
  baseEmailStyles,
  contentStyles,
  buttonStyles,
  PREHEADER_TEMPLATES 
} from "../_shared/email-config.ts";

const logger = createLogger('send-screening-request');

interface ScreeningRequestBody {
  applicationId: string;
  requestType: 'background_check' | 'employment_application' | 'drug_screening';
  recipientEmail?: string;
  providerName?: string;
  additionalData?: Record<string, any>;
}

// Validate email address format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Get preheader text based on request type
function getPreheader(requestType: string, applicantName: string, organizationName: string): string {
  switch (requestType) {
    case 'background_check':
      return PREHEADER_TEMPLATES.background_check(applicantName);
    case 'employment_application':
      return PREHEADER_TEMPLATES.employment_application(organizationName);
    case 'drug_screening':
      return PREHEADER_TEMPLATES.drug_screening(applicantName);
    default:
      return `Screening request for ${applicantName}`;
  }
}

// Generate screening email HTML template using shared header with logo
function generateScreeningEmail(
  requestType: string,
  applicantName: string,
  applicantEmail: string,
  organizationName: string,
  portalLink: string,
  providerName?: string
): { subject: string; html: string } {
  const safeName = sanitizeInput(applicantName);
  const safeEmail = sanitizeInput(applicantEmail);
  const safeOrg = sanitizeInput(organizationName);
  const safeProvider = providerName ? sanitizeInput(providerName) : 'Provider';

  // Get preheader text
  const preheaderText = getPreheader(requestType, safeName, safeOrg);

  switch (requestType) {
    case 'background_check':
      return {
        subject: `Background Check Request - ${safeName}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Background Check Request</title>
            </head>
            <body style="${baseEmailStyles}">
              ${getPreheaderText(preheaderText)}
              ${getEmailHeader("🔍 Background Check Request", { gradient: "#3b82f6 0%, #1d4ed8 100%", showLogo: true, logoAlt: "Apply AI - Background Check" })}
              <div style="${contentStyles}">
                <p style="font-size: 16px; margin-bottom: 20px;">Dear ${safeProvider},</p>
                <p style="font-size: 16px; margin-bottom: 20px;">We are requesting a background check for the following applicant:</p>
                <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${safeName}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${safeEmail}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Organization:</strong> ${safeOrg}</p>
                </div>
                <p style="font-size: 16px; margin-bottom: 10px;">Please complete the background check and upload the results using the secure portal:</p>
                <div style="text-align: center;">
                  <a href="${portalLink}" style="${buttonStyles}">Access Screening Portal</a>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">⏰ This request will expire in 30 days.</p>
                <p style="font-size: 16px; margin-top: 25px; margin-bottom: 5px;">Thank you,</p>
                <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${safeOrg}</p>
              </div>
              ${getEmailFooter({ companyName: safeOrg })}
            </body>
          </html>
        `
      };

    case 'employment_application':
      return {
        subject: `Complete Your Employment Application - ${safeOrg}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Employment Application Request</title>
            </head>
            <body style="${baseEmailStyles}">
              ${getPreheaderText(preheaderText)}
              ${getEmailHeader("📋 Complete Your Application", { gradient: "#10b981 0%, #059669 100%", showLogo: true, logoAlt: "Apply AI - Employment Application" })}
              <div style="${contentStyles}">
                <p style="font-size: 16px; margin-bottom: 20px;">Dear ${safeName},</p>
                <p style="font-size: 16px; margin-bottom: 20px;">Thank you for your interest in joining <strong>${safeOrg}</strong>!</p>
                <p style="font-size: 16px; margin-bottom: 20px;">To proceed with your application, please complete the full employment application form by clicking the button below:</p>
                <div style="text-align: center;">
                  <a href="${portalLink}" style="${buttonStyles}">Complete Application</a>
                </div>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0;">
                  <p style="margin: 0; font-size: 14px; color: #166534;">
                    <strong>What to expect:</strong><br>
                    • The application takes approximately 15-20 minutes<br>
                    • Have your employment history ready<br>
                    • You'll receive a confirmation once submitted
                  </p>
                </div>
                <p style="font-size: 14px; color: #6b7280;">⏰ Please complete within 30 days.</p>
                <p style="font-size: 16px; margin-top: 25px; margin-bottom: 5px;">Best regards,</p>
                <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${safeOrg} Recruitment Team</p>
              </div>
              ${getEmailFooter({ companyName: safeOrg })}
            </body>
          </html>
        `
      };

    case 'drug_screening':
      return {
        subject: `Drug Screening Request - ${safeName}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Drug Screening Request</title>
            </head>
            <body style="${baseEmailStyles}">
              ${getPreheaderText(preheaderText)}
              ${getEmailHeader("🏥 Drug Screening Request", { gradient: "#8b5cf6 0%, #6d28d9 100%", showLogo: true, logoAlt: "Apply AI - Drug Screening" })}
              <div style="${contentStyles}">
                <p style="font-size: 16px; margin-bottom: 20px;">Dear ${safeProvider},</p>
                <p style="font-size: 16px; margin-bottom: 20px;">We are requesting a pre-employment drug screening for:</p>
                <div style="background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0;">
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${safeName}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${safeEmail}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Organization:</strong> ${safeOrg}</p>
                </div>
                <p style="font-size: 16px; margin-bottom: 10px;">Please conduct the screening and upload results via our secure portal:</p>
                <div style="text-align: center;">
                  <a href="${portalLink}" style="${buttonStyles}">Upload Results</a>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">⏰ This request will expire in 30 days.</p>
                <p style="font-size: 16px; margin-top: 25px; margin-bottom: 5px;">Thank you,</p>
                <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${safeOrg}</p>
              </div>
              ${getEmailFooter({ companyName: safeOrg })}
            </body>
          </html>
        `
      };

    default:
      return {
        subject: `Screening Request - ${safeName}`,
        html: `
          ${getPreheaderText(`Screening request for ${safeName}`)}
          <p>Dear ${safeProvider || safeName},</p>
          <p>A screening request has been initiated.</p>
          <p><a href="${portalLink}">Access Portal</a></p>
          <p>Thank you,<br>${safeOrg}</p>
        `
      };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting - 10 requests per minute per IP (50/min for DFW/Alabama devs)
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithGeo(req, identifier, { 
    maxRequests: 10, 
    windowMs: 60000,
    keyPrefix: 'screening'
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
        retryAfter: rateLimitResult.retryAfter,
        success: false
      }),
      {
        status: 429,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders,
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "Retry-After": (rateLimitResult.retryAfter || 60).toString()
        },
      }
    );
  }

  try {
    // Check for required environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      logger.error("RESEND_API_KEY is not configured");
      throw new Error("Email service is not configured");
    }

    const resend = new Resend(resendApiKey);

    const { applicationId, requestType, recipientEmail, providerName, additionalData }: ScreeningRequestBody = await req.json();

    if (!applicationId || !requestType) {
      throw new Error('Application ID and request type are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get application details (include client for applicant-facing email branding)
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*, job_listings(title, organization_id, client_id, organizations(name), clients(name))')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      logger.error('Application lookup error', appError, { applicationId });
      throw new Error('Application not found');
    }

    const applicantName = `${application.first_name || ''} ${application.last_name || ''}`.trim() || 'Applicant';
    const applicantEmail = application.applicant_email;
    // Use client name for applicant-facing emails (privacy), fallback to org name
    const clientName = application.job_listings?.clients?.name || 
                       application.job_listings?.organizations?.name || 
                       'Company';

    // Create screening request record
    const { data: screeningRequest, error: requestError } = await supabase
      .from('screening_requests')
      .insert({
        application_id: applicationId,
        request_type: requestType,
        status: 'sent',
        provider_name: providerName,
        request_data: additionalData || {},
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })
      .select()
      .single();

    if (requestError) {
      logger.error('Error creating screening request', requestError, { applicationId });
      throw new Error('Failed to create screening request');
    }

    // Generate portal link
    const portalLink = `${supabaseUrl.replace('.supabase.co', '')}/screening/${screeningRequest.id}`;

    // Determine recipient
    const emailTo = recipientEmail || applicantEmail;
    
    if (!emailTo || !isValidEmail(emailTo)) {
      throw new Error('Valid recipient email is required');
    }

    // Generate email content (uses clientName for applicant-facing branding)
    const emailContent = generateScreeningEmail(
      requestType,
      applicantName,
      applicantEmail || '',
      clientName,
      portalLink,
      providerName
    );

    logger.info('Sending screening request email', {
      id: screeningRequest.id,
      type: requestType,
      to: emailTo
    });

    // Send email using Resend with verified domain
    const emailResponse = await resend.emails.send({
      from: getSender('screening'),
      to: [emailTo],
      bcc: getReviewBcc(),
      replyTo: getReplyTo('support'),
      subject: emailContent.subject,
      html: emailContent.html
    });

    if (emailResponse.error) {
      logger.error('Resend error', emailResponse.error);
      
      // Update screening request with error
      await supabase
        .from('screening_requests')
        .update({ 
          status: 'failed',
          request_data: { 
            ...additionalData,
            email_error: emailResponse.error.message 
          }
        })
        .eq('id', screeningRequest.id);
      
      throw new Error(emailResponse.error.message || 'Failed to send email');
    }

    logger.info('Email sent successfully', { emailId: emailResponse.data?.id });

    // Update screening request with email ID
    await supabase
      .from('screening_requests')
      .update({ 
        request_data: { 
          ...additionalData,
          email_id: emailResponse.data?.id 
        }
      })
      .eq('id', screeningRequest.id);

    return new Response(
      JSON.stringify({
        success: true,
        screeningRequest,
        emailId: emailResponse.data?.id,
        message: 'Screening request sent successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString()
        },
      }
    );

  } catch (error: any) {
    logger.error('Error in send-screening-request function', error);
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
