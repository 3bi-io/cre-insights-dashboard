import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";
import { createLogger } from "../_shared/logger.ts";
import { 
  EMAIL_CONFIG,
  getSender,
  getReplyTo,
  getReviewBcc,
  getPreheaderText,
  getEmailHeader,
  baseEmailStyles, 
  contentStyles, 
  buttonStyles, 
  getEmailFooter,
  PREHEADER_TEMPLATES 
} from "../_shared/email-config.ts";

const logger = createLogger('send-magic-link');

import { getCorsHeaders } from '../_shared/cors-config.ts';

interface MagicLinkRequest {
  email?: string;
  bulkSend?: boolean;
}

/**
 * Generate magic link email HTML with preheader and shared header with logo
 */
const generateMagicLinkEmail = (actionLink: string, isAdmin: boolean = false): string => {
  const title = isAdmin ? "Administrator Login" : "Access Your Account";
  const gradient = isAdmin ? "#1e40af 0%, #3b82f6 100%" : "#667eea 0%, #764ba2 100%";
  const preheaderText = PREHEADER_TEMPLATES.magic_link();
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="${baseEmailStyles}">
        ${getPreheaderText(preheaderText)}
        ${getEmailHeader(`🔐 ${title}`, { gradient, showLogo: true, logoAlt: `Apply AI - ${title}` })}
        <div style="${contentStyles}">
          <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            ${isAdmin 
              ? "You have requested a magic link to log in as an administrator." 
              : "You have been granted access to the portal."}
          </p>
          <p style="font-size: 16px; margin-bottom: 20px;">Click the button below to log in:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionLink}" style="${buttonStyles}">
              ${isAdmin ? "Log In as Administrator" : "Log In to Portal"}
            </a>
          </div>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              ⏰ This link will expire in 1 hour. If you didn't request this login, please ignore this email.
            </p>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            Or copy and paste this link in your browser:<br>
            <a href="${actionLink}" style="color: #3b82f6; word-break: break-all;">${actionLink}</a>
          </p>
        </div>
        ${getEmailFooter()}
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      logger.error("RESEND_API_KEY is not configured");
      throw new Error("Email service is not configured");
    }
    
    const resend = new Resend(resendApiKey);

    const { email, bulkSend }: MagicLinkRequest = await req.json();
    logger.info("Magic link request received", { email, bulkSend });

    // Use production website URL for redirects
    const redirectUrl = `${EMAIL_CONFIG.brand.website}/dashboard`;

    // Handle bulk send for all users
    if (bulkSend) {
      // Get all profiles to send magic links to
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .not("email", "is", null);

      if (profileError) {
        throw new Error(`Error fetching profiles: ${profileError.message}`);
      }

      if (!profiles || profiles.length === 0) {
        throw new Error("No users found to send magic links to");
      }

      let sentCount = 0;
      const errors: string[] = [];

      for (const profile of profiles) {
        try {
          // Generate magic link for each user
          const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: profile.email,
            options: {
              redirectTo: redirectUrl
            }
          });

          if (authError) {
            errors.push(`Error generating link for ${profile.email}: ${authError.message}`);
            continue;
          }

          const actionLink = authData.properties?.action_link;
          if (!actionLink) {
            errors.push(`No action link generated for ${profile.email}`);
            continue;
          }

          const emailResponse = await resend.emails.send({
            from: getSender('admin'),
            to: [profile.email],
            bcc: getReviewBcc(),
            replyTo: getReplyTo('support'),
            subject: `Magic Link Login Access - ${EMAIL_CONFIG.brand.name}`,
            html: generateMagicLinkEmail(actionLink, false)
          });

          if (emailResponse.error) {
            errors.push(`Error sending to ${profile.email}: ${emailResponse.error.message}`);
            continue;
          }

          sentCount++;
          logger.debug("Magic link sent", { email: profile.email, emailId: emailResponse.data?.id });
        } catch (error: any) {
          errors.push(`Error sending to ${profile.email}: ${error.message}`);
        }
      }

      logger.info(`Bulk magic links completed`, { sentCount, errorCount: errors.length });
      if (errors.length > 0) {
        logger.warn("Bulk send errors", { errors });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Magic links sent to ${sentCount} users`,
          sentCount,
          errors: errors.length > 0 ? errors : undefined
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Handle single email send
    if (!email) {
      throw new Error("Email is required for single send");
    }

    // Check if user exists and is an admin
    const { data: userRoles, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "admin");

    if (roleError) {
      throw new Error(`Error checking user roles: ${roleError.message}`);
    }

    // Get user profiles to match email
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email);

    if (profileError) {
      throw new Error(`Error checking profiles: ${profileError.message}`);
    }

    const userProfile = profiles?.[0];
    if (!userProfile) {
      throw new Error("User with this email not found");
    }

    // Check if the user is an admin
    const isAdmin = userRoles?.some(role => role.user_id === userProfile.id);
    if (!isAdmin) {
      throw new Error("User is not an administrator");
    }

    // Generate magic link using Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (authError) {
      throw new Error(`Error generating magic link: ${authError.message}`);
    }

    const actionLink = authData.properties?.action_link;
    if (!actionLink) {
      throw new Error("Failed to generate action link");
    }

    // Send email using Resend with verified domain
    const emailResponse = await resend.emails.send({
      from: getSender('admin'),
      to: [email],
      bcc: getReviewBcc(),
      replyTo: getReplyTo('support'),
      subject: `Administrator Magic Link Login - ${EMAIL_CONFIG.brand.name}`,
      html: generateMagicLinkEmail(actionLink, true)
    });

    if (emailResponse.error) {
      logger.error("Resend error", emailResponse.error);
      throw new Error(emailResponse.error.message || "Failed to send email");
    }

    logger.info("Magic link email sent successfully", { email, emailId: emailResponse.data?.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Magic link sent successfully",
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    logger.error("Error in send-magic-link function", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 400,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
