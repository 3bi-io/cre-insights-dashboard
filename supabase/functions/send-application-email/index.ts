import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  candidateName: string;
  jobTitle: string;
  companyName?: string;
  type: 'application_received' | 'status_update' | 'interview_invitation' | 'offer' | 'rejection';
  additionalData?: {
    status?: string;
    interviewDate?: string;
    interviewTime?: string;
    interviewType?: string;
    interviewLink?: string;
    rejectionReason?: string;
  };
}

const getEmailTemplate = (request: EmailRequest): string => {
  const { type, candidateName, jobTitle, companyName = "ATS.me", additionalData } = request;

  switch (type) {
    case 'application_received':
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Received</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Application Received</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e1e8ed; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Dear ${candidateName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">Thank you for applying for the <strong>${jobTitle}</strong> position at ${companyName}!</p>
              <p style="font-size: 16px; margin-bottom: 20px;">We have received your application and our team is currently reviewing it. We appreciate your interest in joining our team.</p>
              <div style="background: #f7f9fc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  <strong>What's Next?</strong><br>
                  • Our team will review your application within 2-3 business days<br>
                  • You'll receive an email update on your application status<br>
                  • If selected, we'll reach out to schedule an interview
                </p>
              </div>
              <p style="font-size: 16px; margin-bottom: 20px;">If you have any questions, feel free to reply to this email.</p>
              <p style="font-size: 16px; margin-bottom: 5px;">Best regards,</p>
              <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${companyName} Recruitment Team</p>
            </div>
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>© 2025 ${companyName}. All rights reserved.</p>
            </div>
          </body>
        </html>
      `;

    case 'status_update':
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Status Update</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Application Update</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e1e8ed; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Dear ${candidateName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">We have an update regarding your application for the <strong>${jobTitle}</strong> position.</p>
              <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 16px; color: #1e40af;">
                  <strong>Status:</strong> ${additionalData?.status || 'Under Review'}
                </p>
              </div>
              <p style="font-size: 16px; margin-bottom: 20px;">We appreciate your patience throughout this process. We'll keep you updated on any further developments.</p>
              <p style="font-size: 16px; margin-bottom: 5px;">Best regards,</p>
              <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${companyName} Recruitment Team</p>
            </div>
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>© 2025 ${companyName}. All rights reserved.</p>
            </div>
          </body>
        </html>
      `;

    case 'interview_invitation':
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Interview Invitation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Interview Invitation</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e1e8ed; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Dear ${candidateName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">Great news! We'd like to invite you for an interview for the <strong>${jobTitle}</strong> position at ${companyName}.</p>
              <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Interview Details:</strong></p>
                <p style="margin: 5px 0; font-size: 14px;">📅 Date: ${additionalData?.interviewDate || 'TBD'}</p>
                <p style="margin: 5px 0; font-size: 14px;">🕐 Time: ${additionalData?.interviewTime || 'TBD'}</p>
                <p style="margin: 5px 0; font-size: 14px;">📝 Type: ${additionalData?.interviewType || 'Video Interview'}</p>
                ${additionalData?.interviewLink ? `<p style="margin: 15px 0 5px 0; font-size: 14px;"><a href="${additionalData.interviewLink}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Join Interview</a></p>` : ''}
              </div>
              <p style="font-size: 16px; margin-bottom: 20px;">Please confirm your availability by replying to this email. We look forward to speaking with you!</p>
              <p style="font-size: 16px; margin-bottom: 5px;">Best regards,</p>
              <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${companyName} Recruitment Team</p>
            </div>
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>© 2025 ${companyName}. All rights reserved.</p>
            </div>
          </body>
        </html>
      `;

    case 'offer':
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Job Offer</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e1e8ed; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Dear ${candidateName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">We are thrilled to offer you the position of <strong>${jobTitle}</strong> at ${companyName}!</p>
              <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #92400e;">Your talent and experience impressed us, and we believe you'll be a great addition to our team!</p>
              </div>
              <p style="font-size: 16px; margin-bottom: 20px;">We'll send you a formal offer letter with all the details shortly. Please review it carefully and let us know if you have any questions.</p>
              <p style="font-size: 16px; margin-bottom: 20px;">We're excited about the possibility of you joining our team!</p>
              <p style="font-size: 16px; margin-bottom: 5px;">Best regards,</p>
              <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${companyName} Recruitment Team</p>
            </div>
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>© 2025 ${companyName}. All rights reserved.</p>
            </div>
          </body>
        </html>
      `;

    case 'rejection':
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Update</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Application Update</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e1e8ed; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Dear ${candidateName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">Thank you for your interest in the <strong>${jobTitle}</strong> position at ${companyName} and for taking the time to interview with our team.</p>
              <p style="font-size: 16px; margin-bottom: 20px;">After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  We were impressed by your background and encourage you to apply for future opportunities that match your skills and experience. We'll keep your application on file for consideration for other positions.
                </p>
              </div>
              <p style="font-size: 16px; margin-bottom: 20px;">We wish you the best in your job search and future career endeavors.</p>
              <p style="font-size: 16px; margin-bottom: 5px;">Best regards,</p>
              <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${companyName} Recruitment Team</p>
            </div>
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>© 2025 ${companyName}. All rights reserved.</p>
            </div>
          </body>
        </html>
      `;

    default:
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Update</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Dear ${candidateName},</p>
            <p>This is an update regarding your application for ${jobTitle}.</p>
            <p>Best regards,<br>${companyName}</p>
          </body>
        </html>
      `;
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailRequest: EmailRequest = await req.json();
    console.log("Email request received:", {
      to: emailRequest.to,
      type: emailRequest.type,
      subject: emailRequest.subject
    });

    // Note: In a real implementation, you would use Resend or another email service
    // For this example, we're just logging and returning success
    // To implement real email sending, you need to:
    // 1. Add RESEND_API_KEY secret
    // 2. Import and use Resend: import { Resend } from "npm:resend@2.0.0";
    // 3. Initialize: const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    // 4. Send email: await resend.emails.send({ ... });

    const htmlContent = getEmailTemplate(emailRequest);

    // Simulated email sending (replace with real implementation)
    console.log("Email would be sent with template:", emailRequest.type);
    console.log("To:", emailRequest.to);
    console.log("Subject:", emailRequest.subject);

    // TODO: Implement real email sending with Resend
    // const emailResponse = await resend.emails.send({
    //   from: "ATS.me <noreply@yourdomain.com>",
    //   to: [emailRequest.to],
    //   subject: emailRequest.subject,
    //   html: htmlContent,
    // });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        // In real implementation, include: id: emailResponse.id 
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
    console.error("Error in send-application-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
