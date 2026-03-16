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

const logger = createLogger('send-invite-email');
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

import { getCorsHeaders } from '../_shared/cors-config.ts';

interface InviteEmailRequest {
  email: string;
  organizationName?: string;
  organizationSlug?: string;
  inviterName?: string;
  role: 'admin' | 'user' | 'moderator' | 'super_admin';
}

const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    'admin': 'Administrator',
    'user': 'Team Member',
    'moderator': 'Moderator',
    'super_admin': 'Super Administrator',
  };
  return roleMap[role] || 'Team Member';
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, organizationName, organizationSlug, inviterName, role }: InviteEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const roleDisplay = getRoleDisplayName(role);
    const signupUrl = organizationSlug 
      ? `${EMAIL_CONFIG.brand.website}/auth?org=${organizationSlug}`
      : `${EMAIL_CONFIG.brand.website}/auth`;

    const inviterText = inviterName 
      ? `<strong>${inviterName}</strong> has invited you to join`
      : "You've been invited to join";

    const orgText = organizationName 
      ? `<strong>${organizationName}</strong> on ${EMAIL_CONFIG.brand.name}`
      : EMAIL_CONFIG.brand.name;

    // Generate preheader text
    const preheaderText = PREHEADER_TEMPLATES.invite(inviterName, organizationName || EMAIL_CONFIG.brand.name, roleDisplay);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to ${EMAIL_CONFIG.brand.name}</title>
      </head>
      <body style="${baseEmailStyles} background-color: #f3f4f6;">
        ${getPreheaderText(preheaderText)}
        <div style="max-width: 600px; margin: 40px auto;">
          ${getEmailHeader("You're Invited! 🎉", { gradient: "#3b82f6 0%, #8b5cf6 100%", showLogo: true, logoAlt: "Apply AI - Team Invitation" })}
          
          <div style="${contentStyles}">
            <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
              ${inviterText} ${orgText} as a <strong>${roleDisplay}</strong>.
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">
              ${EMAIL_CONFIG.brand.name} is a modern applicant tracking system that helps teams hire faster with AI-powered voice recruitment and smart automation.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${signupUrl}" style="${buttonStyles}">
                Accept Invitation & Sign Up
              </a>
            </div>
            
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="font-size: 13px; color: #6b7280; margin: 0;">
                <strong>Your role:</strong> ${roleDisplay}<br>
                ${organizationName ? `<strong>Organization:</strong> ${organizationName}` : ''}
              </p>
            </div>
            
            <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: getSender('invites'),
      to: [email],
      bcc: getReviewBcc(),
      replyTo: getReplyTo('admin'),
      subject: organizationName 
        ? `You're invited to join ${organizationName} on ${EMAIL_CONFIG.brand.name}`
        : `You're invited to join ${EMAIL_CONFIG.brand.name}`,
      html: emailHtml,
    });

    logger.info('Invitation email sent successfully', { email, emailId: emailResponse.data?.id });

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    logger.error('Error sending invitation email', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
