import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  email?: string;
  new_password?: string;
  user_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

   try {
     console.log('admin-update-password: start');
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");

    // Client bound to the caller to verify their role
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    // Admin client for privileged operations
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Verify JWT from Authorization header and extract caller user id
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let callerUserId = "";
    try {
      const jwt = authHeader.split(" ")[1]!;
      const payload = JSON.parse(atob(jwt.split(".")[1] || ""));
      callerUserId = payload.sub || "";
    } catch (_e) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!callerUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check role (allow admin or super_admin) via user_roles table using admin client
    const { data: roleRow, error: roleQueryError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId)
      .maybeSingle();

    if (roleQueryError) {
      return new Response(JSON.stringify({ error: roleQueryError.message }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const role = (roleRow as any)?.role as string | undefined;
    if (!role || (role !== "admin" && role !== "super_admin")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: Payload = await req.json();
    const email = (body.email || "").toLowerCase().trim();
    const newPassword = (body.new_password || "").trim();
    const targetUserId = (body.user_id || "").trim();

    if (!newPassword || newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    let userId = targetUserId;

    if (!userId) {
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Provide either user_id or email" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      // Try to resolve user_id via Auth (admin) by email
      try {
        const { data: usersList, error: listError } = await admin.auth.admin.listUsers();
        if (!listError && usersList?.users?.length) {
          const match = usersList.users.find((u: any) => (u.email || "").toLowerCase() === email);
          if (match?.id) {
            userId = match.id as string;
          }
        }
      } catch (e) {
        console.warn('admin-update-password: listUsers failed', e);
      }

      // Fallback: Look up user id via profiles table
      if (!userId) {
        const { data: profile, error: profileError } = await admin
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (profileError || !profile?.id) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        userId = profile.id as string;
      }
    }

    // Update password using Admin API
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
