import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createLogger } from "../_shared/logger.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { 
  EMAIL_CONFIG, 
  getSender, 
  getReplyTo,
  getReviewBcc,
  getEmailHeader,
  getEmailFooter,
  getPreheaderText,
  baseEmailStyles,
  contentStyles,
  buttonStyles,
  PREHEADER_TEMPLATES
} from "../_shared/email-config.ts";

const logger = createLogger('send-welcome-email');
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface WelcomeEmailRequest {
  to: string;
  userName: string;
  organizationName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    const { to, userName, organizationName }: WelcomeEmailRequest = await req.json();

    if (!to) {
      throw new Error("Email address is required");
    }

    const displayName = userName || to.split('@')[0];
    const orgName = organizationName || "Apply AI";

    // Generate preheader text
    const preheaderText = PREHEADER_TEMPLATES.welcome(orgName);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${orgName}!</title>
      </head>
      <body style="${baseEmailStyles} background-color: #f5f5f5;">
        ${getPreheaderText(preheaderText)}
        <div style="max-width: 600px; margin: 0 auto;">
          ${getEmailHeader("Welcome to Apply AI! 🎉", { gradient: "#3b82f6 0%, #667eea 100%", showLogo: true, logoAlt: "Apply AI - Welcome" })}
          
          <div style="${contentStyles}">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi <strong>${displayName}</strong>,
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Welcome to <strong>${orgName}</strong> on Apply AI! Your account is ready and you can start using the platform right away.
            </p>
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1e40af;">🚀 Quick Start Guide</h3>
              <ol style="margin: 0; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 8px;"><strong>Log in</strong> to your dashboard at <a href="${EMAIL_CONFIG.brand.website}/auth" style="color: #3b82f6;">applyai.jobs/auth</a></li>
                <li style="margin-bottom: 8px;"><strong>Complete your profile</strong> in Settings</li>
                <li style="margin-bottom: 8px;"><strong>Explore the dashboard</strong> to manage applications</li>
                <li style="margin-bottom: 8px;"><strong>Set up integrations</strong> for ATS connections</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${EMAIL_CONFIG.brand.website}/auth" style="${buttonStyles}">
                Log In to Your Account
              </a>
            </div>
            
            <div style="background: #fefce8; border: 1px solid #fef08a; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <h4 style="margin: 0 0 8px 0; color: #854d0e;">📧 Your Login Details</h4>
              <p style="margin: 0; color: #713f12;">
                <strong>Email:</strong> ${to}<br>
                <strong>Password:</strong> Use the password you created during signup, or click "Forgot Password" to reset it.
              </p>
            </div>
            
            <h3 style="color: #1f2937; margin-top: 30px;">Key Features Available to You:</h3>
            <ul style="color: #4b5563; padding-left: 20px;">
              <li style="margin-bottom: 8px;">📋 <strong>Application Management</strong> - Track and manage all applications</li>
              <li style="margin-bottom: 8px;">🎯 <strong>Job Listings</strong> - Create and publish job postings</li>
              <li style="margin-bottom: 8px;">🤖 <strong>AI Voice Agents</strong> - Automated candidate outreach</li>
              <li style="margin-bottom: 8px;">🔗 <strong>ATS Integrations</strong> - Connect Tenstreet, DriverReach & more</li>
              <li style="margin-bottom: 8px;">📊 <strong>Analytics</strong> - Insights and reporting</li>
            </ul>
            
            <p style="font-size: 16px; margin-top: 30px; color: #6b7280;">
              Need help? Reply to this email or contact our support team at <a href="mailto:support@3bi.io" style="color: #3b82f6;">support@3bi.io</a>
            </p>
            
            <p style="font-size: 16px; margin-top: 20px;">
              Best regards,<br>
              <strong>The Apply AI Team</strong>
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: getSender('default'),
      to: [to],
      bcc: getReviewBcc(),
      replyTo: getReplyTo('support'),
      subject: `Welcome to ${orgName} on Apply AI! 🎉`,
      html: htmlContent,
    });

    logger.info('Welcome email sent successfully', { to, emailId: emailResponse.data?.id });

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
      }
    );
  } catch (error: any) {
    logger.error('Error sending welcome email', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
      }
    );
  }
};

serve(handler);
