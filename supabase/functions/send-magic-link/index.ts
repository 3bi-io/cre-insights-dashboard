import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MagicLinkRequest {
  email: string;
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

    const { email }: MagicLinkRequest = await req.json();
    console.log("Sending magic link to:", email);

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
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('auwhcdpppldjlcaxzsme.supabase.co', window.location?.origin || 'localhost:8080')}/dashboard`
      }
    });

    if (authError) {
      throw new Error(`Error generating magic link: ${authError.message}`);
    }

    // Send email using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const emailResponse = await resend.emails.send({
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
    });

    console.log("Email sent successfully:", emailResponse);

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