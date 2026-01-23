/**
 * Email Unsubscribe Edge Function
 * Handles email unsubscribe requests for CAN-SPAM compliance
 * 
 * Endpoints:
 * - GET /email-unsubscribe?token=xxx - Show unsubscribe confirmation page
 * - POST /email-unsubscribe - Process unsubscribe request
 * - GET /email-unsubscribe/preferences?token=xxx - Get current preferences
 * - PUT /email-unsubscribe/preferences - Update preferences
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createLogger } from "../_shared/logger.ts";
import { getServiceClient } from "../_shared/supabase-client.ts";
import { EMAIL_CONFIG, baseEmailStyles } from "../_shared/email-config.ts";

const logger = createLogger('email-unsubscribe');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Generate unsubscribe confirmation page HTML
 */
const generateUnsubscribePage = (email: string, success: boolean, message: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${success ? 'Unsubscribed' : 'Unsubscribe'} - ${EMAIL_CONFIG.brand.name}</title>
      <style>
        body { ${baseEmailStyles} background-color: #f5f5f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { max-width: 500px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; text-align: center; }
        .icon { font-size: 48px; margin-bottom: 16px; }
        .message { color: #374151; font-size: 16px; margin-bottom: 24px; }
        .email { color: #6b7280; font-size: 14px; background: #f3f4f6; padding: 8px 16px; border-radius: 6px; display: inline-block; }
        .btn { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; border: none; cursor: pointer; font-size: 14px; }
        .btn:hover { background: #2563eb; }
        .btn-secondary { background: #6b7280; }
        .footer { padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .preferences { text-align: left; margin: 20px 0; }
        .preference-item { display: flex; align-items: center; padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 8px; }
        .preference-item input { margin-right: 12px; width: 18px; height: 18px; }
        .preference-item label { color: #374151; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${success ? '✓ Unsubscribed' : '📧 Email Preferences'}</h1>
        </div>
        <div class="content">
          <div class="icon">${success ? '👋' : '📬'}</div>
          <p class="message">${message}</p>
          ${email ? `<p class="email">${email}</p>` : ''}
          ${success ? `
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Changed your mind? You can always update your preferences from your account settings.
            </p>
            <a href="${EMAIL_CONFIG.brand.website}" class="btn btn-secondary">Return to ${EMAIL_CONFIG.brand.name}</a>
          ` : ''}
        </div>
        <div class="footer">
          © ${EMAIL_CONFIG.brand.year} ${EMAIL_CONFIG.brand.name}. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate email preferences page HTML
 */
const generatePreferencesPage = (email: string, preferences: any, token: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Preferences - ${EMAIL_CONFIG.brand.name}</title>
      <style>
        body { ${baseEmailStyles} background-color: #f5f5f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { max-width: 500px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .email { color: #6b7280; font-size: 14px; background: #f3f4f6; padding: 8px 16px; border-radius: 6px; display: inline-block; margin-bottom: 24px; }
        .preferences { margin: 20px 0; }
        .preference-item { display: flex; align-items: center; padding: 16px; background: #f9fafb; border-radius: 8px; margin-bottom: 12px; cursor: pointer; transition: background 0.2s; }
        .preference-item:hover { background: #f3f4f6; }
        .preference-item input { margin-right: 16px; width: 20px; height: 20px; cursor: pointer; }
        .preference-item label { color: #374151; font-size: 14px; cursor: pointer; flex: 1; }
        .preference-item .desc { color: #6b7280; font-size: 12px; margin-top: 4px; }
        .btn { display: block; width: 100%; padding: 14px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; border: none; cursor: pointer; font-size: 14px; text-align: center; }
        .btn:hover { background: #2563eb; }
        .btn-danger { background: #ef4444; margin-top: 12px; }
        .btn-danger:hover { background: #dc2626; }
        .footer { padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .success-message { background: #d1fae5; color: #065f46; padding: 12px; border-radius: 8px; margin-bottom: 20px; display: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 Email Preferences</h1>
        </div>
        <div class="content">
          <div class="success-message" id="successMessage">Your preferences have been saved!</div>
          <p class="email">${email}</p>
          
          <form id="preferencesForm">
            <div class="preferences">
              <div class="preference-item">
                <input type="checkbox" id="marketing" name="marketing_emails" ${preferences.marketing_emails ? 'checked' : ''}>
                <label for="marketing">
                  <strong>Marketing & Promotions</strong>
                  <div class="desc">New features, tips, and special offers</div>
                </label>
              </div>
              
              <div class="preference-item">
                <input type="checkbox" id="applications" name="application_updates" ${preferences.application_updates ? 'checked' : ''}>
                <label for="applications">
                  <strong>Application Updates</strong>
                  <div class="desc">Status changes, interview invitations, and offers</div>
                </label>
              </div>
              
              <div class="preference-item">
                <input type="checkbox" id="system" name="system_notifications" ${preferences.system_notifications ? 'checked' : ''}>
                <label for="system">
                  <strong>System Notifications</strong>
                  <div class="desc">Security alerts, account updates, and important notices</div>
                </label>
              </div>
            </div>
            
            <button type="submit" class="btn">Save Preferences</button>
            <button type="button" class="btn btn-danger" onclick="unsubscribeAll()">Unsubscribe from All</button>
          </form>
        </div>
        <div class="footer">
          © ${EMAIL_CONFIG.brand.year} ${EMAIL_CONFIG.brand.name}. All rights reserved.
        </div>
      </div>
      
      <script>
        const token = '${token}';
        
        document.getElementById('preferencesForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          
          const response = await fetch(window.location.pathname, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: token,
              marketing_emails: formData.has('marketing_emails'),
              application_updates: formData.has('application_updates'),
              system_notifications: formData.has('system_notifications')
            })
          });
          
          if (response.ok) {
            const msg = document.getElementById('successMessage');
            msg.style.display = 'block';
            setTimeout(() => msg.style.display = 'none', 3000);
          }
        });
        
        async function unsubscribeAll() {
          if (confirm('Are you sure you want to unsubscribe from all emails?')) {
            const response = await fetch(window.location.pathname, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: token, unsubscribe_all: true })
            });
            
            if (response.ok) {
              window.location.reload();
            }
          }
        }
      </script>
    </body>
    </html>
  `;
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const supabase = getServiceClient();

  try {
    // GET - Show unsubscribe/preferences page
    if (req.method === "GET") {
      if (!token) {
        return new Response(
          generateUnsubscribePage('', false, 'Invalid or missing unsubscribe token.'),
          { status: 400, headers: { "Content-Type": "text/html", ...corsHeaders } }
        );
      }

      // Look up preferences by token
      const { data: prefs, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('unsubscribe_token', token)
        .single();

      if (error || !prefs) {
        logger.warn('Invalid unsubscribe token', { token: token.substring(0, 8) + '...' });
        return new Response(
          generateUnsubscribePage('', false, 'This unsubscribe link is invalid or has expired.'),
          { status: 404, headers: { "Content-Type": "text/html", ...corsHeaders } }
        );
      }

      // Check if already unsubscribed
      if (prefs.unsubscribed_at) {
        return new Response(
          generateUnsubscribePage(prefs.email, true, "You've already been unsubscribed from our emails."),
          { status: 200, headers: { "Content-Type": "text/html", ...corsHeaders } }
        );
      }

      // Show preferences page
      return new Response(
        generatePreferencesPage(prefs.email, prefs, token),
        { status: 200, headers: { "Content-Type": "text/html", ...corsHeaders } }
      );
    }

    // POST - Process unsubscribe
    if (req.method === "POST") {
      const body = await req.json();
      const unsubscribeToken = body.token || token;

      if (!unsubscribeToken) {
        return new Response(
          JSON.stringify({ error: "Missing unsubscribe token" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Look up and update preferences
      const { data: prefs, error: lookupError } = await supabase
        .from('email_preferences')
        .select('id, email')
        .eq('unsubscribe_token', unsubscribeToken)
        .single();

      if (lookupError || !prefs) {
        return new Response(
          JSON.stringify({ error: "Invalid unsubscribe token" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Unsubscribe from all
      const { error: updateError } = await supabase
        .from('email_preferences')
        .update({
          marketing_emails: false,
          application_updates: false,
          system_notifications: false,
          unsubscribed_at: new Date().toISOString()
        })
        .eq('id', prefs.id);

      if (updateError) {
        logger.error('Failed to unsubscribe', { error: updateError });
        return new Response(
          JSON.stringify({ error: "Failed to process unsubscribe request" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      logger.info('User unsubscribed from all emails', { email: prefs.email });

      return new Response(
        generateUnsubscribePage(prefs.email, true, "You've been successfully unsubscribed from all emails."),
        { status: 200, headers: { "Content-Type": "text/html", ...corsHeaders } }
      );
    }

    // PUT - Update preferences
    if (req.method === "PUT") {
      const body = await req.json();
      const updateToken = body.token;

      if (!updateToken) {
        return new Response(
          JSON.stringify({ error: "Missing token" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: prefs, error: lookupError } = await supabase
        .from('email_preferences')
        .select('id, email')
        .eq('unsubscribe_token', updateToken)
        .single();

      if (lookupError || !prefs) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { error: updateError } = await supabase
        .from('email_preferences')
        .update({
          marketing_emails: body.marketing_emails ?? true,
          application_updates: body.application_updates ?? true,
          system_notifications: body.system_notifications ?? true,
          unsubscribed_at: null // Clear unsubscribed flag if re-subscribing
        })
        .eq('id', prefs.id);

      if (updateError) {
        logger.error('Failed to update preferences', { error: updateError });
        return new Response(
          JSON.stringify({ error: "Failed to update preferences" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      logger.info('Email preferences updated', { email: prefs.email });

      return new Response(
        JSON.stringify({ success: true, message: "Preferences updated successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    logger.error('Unsubscribe error', error);
    return new Response(
      generateUnsubscribePage('', false, 'An error occurred. Please try again later.'),
      { status: 500, headers: { "Content-Type": "text/html", ...corsHeaders } }
    );
  }
});
