/**
 * Contact Form Edge Function
 * Handles contact form submissions and stores them in database
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple validation
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.firstName || data.firstName.length < 1) errors.push("First name is required");
  if (!data.lastName || data.lastName.length < 1) errors.push("Last name is required");
  if (!data.email || !validateEmail(data.email)) errors.push("Valid email is required");
  if (!data.company || data.company.length < 1) errors.push("Company is required");
  if (!data.subject || data.subject.length < 1) errors.push("Subject is required");
  if (!data.message || data.message.length < 1) errors.push("Message is required");
  
  return { valid: errors.length === 0, errors };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = validateForm(body);
    if (!validation.valid) {
      console.error("Validation error:", validation.errors);
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          details: validation.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store in database
    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert({
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        company: body.company,
        job_title: body.jobTitle || null,
        company_size: body.companySize || null,
        subject: body.subject,
        message: body.message,
        status: "new",
      });

    if (dbError) {
      console.error("Database error:", dbError);
      // Don't fail if table doesn't exist - just log and continue
      if (dbError.code !== "42P01") {
        console.log("Contact form data (table may not exist):", body);
      }
    }

    console.log("Contact form submission received:", {
      name: `${body.firstName} ${body.lastName}`,
      email: body.email,
      company: body.company,
      subject: body.subject,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Thank you for contacting us. We'll get back to you within 24 hours." 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Contact form error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process contact form submission" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
