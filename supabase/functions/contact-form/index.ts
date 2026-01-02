/**
 * Contact Form Edge Function
 * Handles contact form submissions and stores them in database
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse } from '../_shared/response.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

// Zod validation schema
const ContactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Valid email is required"),
  company: z.string().min(1, "Company is required").max(200),
  jobTitle: z.string().max(100).optional(),
  companySize: z.string().max(50).optional(),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(5000),
});

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Parse and validate input
  const rawBody = await req.json();
  const validationResult = ContactFormSchema.safeParse(rawBody);
  
  if (!validationResult.success) {
    console.error('Contact form validation failed:', validationResult.error.issues);
    throw new ValidationError('Validation failed', validationResult.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    })));
  }

  const body = validationResult.data;
  const supabase = getServiceClient();

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

  return successResponse({ 
    message: "Thank you for contacting us. We'll get back to you within 24 hours." 
  });
}, { context: 'ContactForm', logRequests: true });

serve(handler);
