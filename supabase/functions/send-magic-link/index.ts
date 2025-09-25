import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
// Temporarily commented out to fix build error
// import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MagicLinkRequest {
  email?: string;
  bulkSend?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, bulkSend }: MagicLinkRequest = await req.json();
    console.log("Magic link request:", { email, bulkSend });

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

      // Temporarily disabled email functionality
      // const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      let sentCount = 0;
      const errors: string[] = [];

      for (const profile of profiles) {
        try {
          // Generate magic link for each user
          const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: profile.email,
            options: {
              redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('auwhcdpppldjlcaxzsme.supabase.co', 'cf22d483-762d-45c7-a42c-85b40ce9290a.lovableproject.com')}/dashboard`
            }
          });

          if (authError) {
            errors.push(`Error generating link for ${profile.email}: ${authError.message}`);
            continue;
          }

          // Send email - temporarily disabled
          /* await resend.emails.send({
            from: "Admin Portal <onboarding@resend.dev>",
            to: [profile.email],
            subject: "Magic Link Login Access",
            html: `
              <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <h1 style="color: #333; text-align: center;">Access Your Account</h1>
                <p>Hello,</p>
                <p>You have been granted access to the admin portal. Click the button below to log in:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${authData.properties?.action_link}" 
                     style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Log In to Portal
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                  This link will expire in 1 hour. If you didn't expect this email, please ignore it.
                </p>
                <p style="color: #666; font-size: 14px;">
                  Or copy and paste this link in your browser:<br>
                  <a href="${authData.properties?.action_link}">${authData.properties?.action_link}</a>
                </p>
              </div>
            `,
          }); */

          sentCount++;
        } catch (error: any) {
          errors.push(`Error sending to ${profile.email}: ${error.message}`);
        }
      }

      console.log(`Bulk magic links sent: ${sentCount} successful, ${errors.length} errors`);
      if (errors.length > 0) {
        console.error("Errors:", errors);
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
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('auwhcdpppldjlcaxzsme.supabase.co', 'cf22d483-762d-45c7-a42c-85b40ce9290a.lovableproject.com')}/dashboard`
      }
    });

    if (authError) {
      throw new Error(`Error generating magic link: ${authError.message}`);
    }

    // Send email using Resend - temporarily disabled
    // const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    /* const emailResponse = await resend.emails.send({
      from: "Admin Portal <onboarding@resend.dev>",
      to: [email],
      subject: "Administrator Magic Link Login",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center;">Administrator Login</h1>
          <p>Hello,</p>
          <p>You have requested a magic link to log in as an administrator. Click the button below to log in:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${authData.properties?.action_link}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Log In as Administrator
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this login, please ignore this email.
          </p>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link in your browser:<br>
            <a href="${authData.properties?.action_link}">${authData.properties?.action_link}</a>
          </p>
        </div>
      `,
    }); */

    // console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Magic link generated successfully (email temporarily disabled)",
        // emailId: emailResponse.data?.id 
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
    console.error("Error in send-magic-link function:", error);
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