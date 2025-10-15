import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScreeningRequestBody {
  applicationId: string;
  requestType: 'background_check' | 'employment_application' | 'drug_screening';
  recipientEmail?: string;
  providerName?: string;
  additionalData?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, requestType, recipientEmail, providerName, additionalData }: ScreeningRequestBody = await req.json();

    if (!applicationId || !requestType) {
      throw new Error('Application ID and request type are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*, job_listings(title, organization_id, organizations(name))')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      throw new Error('Application not found');
    }

    const applicantName = `${application.first_name || ''} ${application.last_name || ''}`.trim();
    const applicantEmail = application.applicant_email;
    const organizationName = application.job_listings?.organizations?.name || 'Organization';

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
      console.error('Error creating screening request:', requestError);
      throw new Error('Failed to create screening request');
    }

    // Prepare email content based on request type
    let subject = '';
    let emailBody = '';
    const portalLink = `${supabaseUrl}/screening/${screeningRequest.id}`;

    switch (requestType) {
      case 'background_check':
        subject = `Background Check Request - ${applicantName}`;
        emailBody = `
          <h2>Background Check Request</h2>
          <p>Dear ${providerName || 'Provider'},</p>
          <p>We are requesting a background check for the following applicant:</p>
          <ul>
            <li><strong>Name:</strong> ${applicantName}</li>
            <li><strong>Email:</strong> ${applicantEmail}</li>
            <li><strong>Organization:</strong> ${organizationName}</li>
          </ul>
          <p>Please complete the background check and upload the results using the link below:</p>
          <p><a href="${portalLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Access Portal</a></p>
          <p>This request will expire in 30 days.</p>
          <p>Thank you,<br>${organizationName}</p>
        `;
        break;

      case 'employment_application':
        subject = `Employment Application Request - ${applicantName}`;
        emailBody = `
          <h2>Employment Application Request</h2>
          <p>Dear ${applicantName},</p>
          <p>Thank you for your interest in joining ${organizationName}. To proceed with your application, please complete the full employment application form.</p>
          <p>Click the button below to access the application portal:</p>
          <p><a href="${portalLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Complete Application</a></p>
          <p>Please submit your application within 30 days.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>${organizationName}</p>
        `;
        break;

      case 'drug_screening':
        subject = `Drug Screening Request - ${applicantName}`;
        emailBody = `
          <h2>Drug Screening Request</h2>
          <p>Dear ${providerName || 'Provider'},</p>
          <p>We are requesting a pre-employment drug screening for:</p>
          <ul>
            <li><strong>Name:</strong> ${applicantName}</li>
            <li><strong>Email:</strong> ${applicantEmail}</li>
            <li><strong>Organization:</strong> ${organizationName}</li>
          </ul>
          <p>Please conduct the drug screening and upload the results using the link below:</p>
          <p><a href="${portalLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Upload Results</a></p>
          <p>This request will expire in 30 days.</p>
          <p>Thank you,<br>${organizationName}</p>
        `;
        break;
    }

    // Send email notification (placeholder - integrate with your email service)
    console.log('Screening request created:', {
      id: screeningRequest.id,
      type: requestType,
      applicant: applicantName,
      email: recipientEmail || applicantEmail
    });

    // Note: In production, you would integrate with Resend or another email service here
    // Example:
    // const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    // await resend.emails.send({
    //   from: 'noreply@yourcompany.com',
    //   to: recipientEmail || applicantEmail,
    //   subject: subject,
    //   html: emailBody
    // });

    return new Response(
      JSON.stringify({
        success: true,
        screeningRequest,
        message: 'Screening request sent successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in send-screening-request function:', error);
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
