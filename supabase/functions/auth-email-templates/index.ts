import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createHmac } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { createLogger } from "../_shared/logger.ts";
import { 
  EMAIL_CONFIG,
  getSender,
  getReviewBcc,
  getPreheaderText,
  getEmailHeader,
  getEmailFooter,
  baseEmailStyles, 
  contentStyles, 
  buttonStyles,
  PREHEADER_TEMPLATES 
} from "../_shared/email-config.ts";

const logger = createLogger('auth-email-templates');

import { getCorsHeaders } from '../_shared/cors-config.ts';

/**
 * Supabase Auth Hook payload for custom email templates
 */
interface AuthEmailHookPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, any>;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: 'signup' | 'recovery' | 'email_change' | 'magiclink' | 'invite';
    site_url?: string;
    confirmation_url?: string;
  };
}

/**
 * Verify webhook signature from Supabase Auth Hook
 */
async function verifyWebhookSignature(req: Request, body: string): Promise<boolean> {
  const secret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  if (!secret) {
    logger.warn("SEND_EMAIL_HOOK_SECRET not configured, skipping signature verification");
    return true; // Skip verification if secret not configured
  }

  const signature = req.headers.get("x-supabase-signature");
  if (!signature) {
    logger.error("Missing webhook signature");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return signature === computedSignature;
  } catch (error) {
    logger.error("Signature verification failed", error);
    return false;
  }
}

/**
 * Generate branded email based on action type
 */
function generateAuthEmail(
  actionType: string,
  confirmationUrl: string,
  userEmail: string
): { subject: string; html: string } {
  switch (actionType) {
    case 'signup':
      return {
        subject: `Confirm your ${EMAIL_CONFIG.brand.name} account`,
        html: generateSignupEmail(confirmationUrl, userEmail)
      };
    
    case 'recovery':
      return {
        subject: `Reset your ${EMAIL_CONFIG.brand.name} password`,
        html: generatePasswordResetEmail(confirmationUrl)
      };
    
    case 'magiclink':
      return {
        subject: `Your ${EMAIL_CONFIG.brand.name} sign-in link`,
        html: generateMagicLinkEmail(confirmationUrl)
      };
    
    case 'email_change':
      return {
        subject: `Confirm your new email address - ${EMAIL_CONFIG.brand.name}`,
        html: generateEmailChangeEmail(confirmationUrl, userEmail)
      };
    
    case 'invite':
      return {
        subject: `You're invited to ${EMAIL_CONFIG.brand.name}`,
        html: generateInviteEmail(confirmationUrl)
      };
    
    default:
      return {
        subject: `${EMAIL_CONFIG.brand.name} - Action Required`,
        html: generateDefaultEmail(confirmationUrl, actionType)
      };
  }
}

function generateSignupEmail(confirmationUrl: string, email: string): string {
  const preheaderText = PREHEADER_TEMPLATES.email_confirm();
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Your Email</title>
      </head>
      <body style="${baseEmailStyles} background-color: #f5f5f5;">
        ${getPreheaderText(preheaderText)}
        <div style="max-width: 600px; margin: 40px auto;">
          ${getEmailHeader("Confirm Your Email ✉️", { gradient: "#3b82f6 0%, #667eea 100%", showLogo: true, logoAlt: "Apply AI - Confirm Email" })}
          
          <div style="${contentStyles}">
            <p style="font-size: 16px; margin-bottom: 20px;">Welcome to ${EMAIL_CONFIG.brand.name}!</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for signing up. Please confirm your email address to activate your account.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" style="${buttonStyles}">
                Confirm Email Address
              </a>
            </div>
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #1e40af;">
                <strong>Email:</strong> ${email}<br>
                This link will expire in 24 hours.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
    </html>
  `;
}

function generatePasswordResetEmail(resetUrl: string): string {
  const preheaderText = PREHEADER_TEMPLATES.password_reset();
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="${baseEmailStyles} background-color: #f5f5f5;">
        ${getPreheaderText(preheaderText)}
        <div style="max-width: 600px; margin: 40px auto;">
          ${getEmailHeader("Reset Your Password 🔑", { gradient: "#f59e0b 0%, #d97706 100%", showLogo: true, logoAlt: "Apply AI - Password Reset" })}
          
          <div style="${contentStyles}">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="${buttonStyles} background-color: #f59e0b;">
                Reset Password
              </a>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                ⏰ This link will expire in 24 hours.<br>
                🔒 If you didn't request this, your account is still secure.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Or copy and paste this link:<br>
              <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
    </html>
  `;
}

function generateMagicLinkEmail(magicLink: string): string {
  const preheaderText = PREHEADER_TEMPLATES.magic_link();
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign In to ${EMAIL_CONFIG.brand.name}</title>
      </head>
      <body style="${baseEmailStyles} background-color: #f5f5f5;">
        ${getPreheaderText(preheaderText)}
        <div style="max-width: 600px; margin: 40px auto;">
          ${getEmailHeader("Sign In Link 🔐", { gradient: "#667eea 0%, #764ba2 100%", showLogo: true, logoAlt: "Apply AI - Magic Link" })}
          
          <div style="${contentStyles}">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Click the button below to sign in to your ${EMAIL_CONFIG.brand.name} account.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="${buttonStyles}">
                Sign In to ${EMAIL_CONFIG.brand.name}
              </a>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                ⏰ This link expires in 1 hour.<br>
                🔒 If you didn't request this, you can safely ignore this email.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Or copy and paste this link:<br>
              <a href="${magicLink}" style="color: #3b82f6; word-break: break-all;">${magicLink}</a>
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
    </html>
  `;
}

function generateEmailChangeEmail(confirmationUrl: string, newEmail: string): string {
  const preheaderText = PREHEADER_TEMPLATES.email_change();
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Email Change</title>
      </head>
      <body style="${baseEmailStyles} background-color: #f5f5f5;">
        ${getPreheaderText(preheaderText)}
        <div style="max-width: 600px; margin: 40px auto;">
          ${getEmailHeader("Confirm Email Change 📧", { gradient: "#10b981 0%, #059669 100%", showLogo: true, logoAlt: "Apply AI - Email Change" })}
          
          <div style="${contentStyles}">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              You've requested to change your email address to <strong>${newEmail}</strong>.
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Please confirm this change by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" style="${buttonStyles} background-color: #10b981;">
                Confirm New Email
              </a>
            </div>
            
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #166534;">
                ✅ After confirmation, you'll use this new email to sign in.<br>
                ⏰ This link expires in 24 hours.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              If you didn't request this change, please contact support immediately.
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
    </html>
  `;
}

function generateInviteEmail(inviteUrl: string): string {
  const preheaderText = `You've been invited to join ${EMAIL_CONFIG.brand.name}. Accept your invitation to get started.`;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited!</title>
      </head>
      <body style="${baseEmailStyles} background-color: #f5f5f5;">
        ${getPreheaderText(preheaderText)}
        <div style="max-width: 600px; margin: 40px auto;">
          ${getEmailHeader("You're Invited! 🎉", { gradient: "#8b5cf6 0%, #6d28d9 100%", showLogo: true, logoAlt: "Apply AI - Invitation" })}
          
          <div style="${contentStyles}">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello!</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              You've been invited to join ${EMAIL_CONFIG.brand.name}, a modern applicant tracking system that helps teams hire faster.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="${buttonStyles} background-color: #8b5cf6;">
                Accept Invitation
              </a>
            </div>
            
            <div style="background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #5b21b6;">
                🚀 Get started with AI-powered voice recruitment<br>
                📊 Track applications and manage hiring<br>
                🔗 Connect with leading ATS platforms
              </p>
            </div>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
    </html>
  `;
}

function generateDefaultEmail(actionUrl: string, actionType: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${EMAIL_CONFIG.brand.name}</title>
      </head>
      <body style="${baseEmailStyles} background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto;">
          ${getEmailHeader(EMAIL_CONFIG.brand.name, { gradient: "#3b82f6 0%, #667eea 100%", showLogo: true })}
          
          <div style="${contentStyles}">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Action required: ${actionType}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" style="${buttonStyles}">
                Complete Action
              </a>
            </div>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(req, bodyText);
    if (!isValid) {
      logger.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload: AuthEmailHookPayload = JSON.parse(bodyText);
    
    logger.info("Auth email hook received", { 
      actionType: payload.email_data.email_action_type,
      userEmail: payload.user.email 
    });

    // Check for Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      logger.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    const resend = new Resend(resendApiKey);

    // Build the confirmation URL
    const confirmationUrl = payload.email_data.confirmation_url || 
      `${payload.email_data.site_url || EMAIL_CONFIG.brand.website}/auth/confirm?token_hash=${payload.email_data.token_hash}&type=${payload.email_data.email_action_type}`;

    // Generate branded email
    const { subject, html } = generateAuthEmail(
      payload.email_data.email_action_type,
      confirmationUrl,
      payload.user.email
    );

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: getSender('default'),
      to: [payload.user.email],
      bcc: getReviewBcc(),
      replyTo: getReplyTo('support'),
      subject,
      html
    });

    if (emailResponse.error) {
      logger.error("Resend error", emailResponse.error);
      throw new Error(emailResponse.error.message || "Failed to send email");
    }

    logger.info("Auth email sent successfully", { 
      emailId: emailResponse.data?.id,
      actionType: payload.email_data.email_action_type 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    logger.error("Error in auth-email-templates function", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);
