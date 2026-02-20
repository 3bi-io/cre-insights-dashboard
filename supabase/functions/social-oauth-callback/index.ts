import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatePayload {
  organizationId: string;
  platform: string;
  nonce: string;
  timestamp: number;
  codeVerifier?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle both GET (redirect from OAuth provider) and OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Get the frontend URL for redirects
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://applyai.jobs';

    if (error) {
      console.error('OAuth error from provider:', error, errorDescription);
      return Response.redirect(
        `${frontendUrl}/social-engagement?error=${encodeURIComponent(errorDescription || error)}`,
        302
      );
    }

    if (!code || !state) {
      return Response.redirect(
        `${frontendUrl}/social-engagement?error=missing_params`,
        302
      );
    }

    // Decode state
    let statePayload: StatePayload;
    try {
      statePayload = JSON.parse(atob(state));
    } catch {
      return Response.redirect(
        `${frontendUrl}/social-engagement?error=invalid_state`,
        302
      );
    }

    const { organizationId, platform, codeVerifier } = statePayload;

    // Verify state isn't too old (15 minutes max)
    if (Date.now() - statePayload.timestamp > 15 * 60 * 1000) {
      return Response.redirect(
        `${frontendUrl}/social-engagement?error=state_expired`,
        302
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const callbackUrl = `${supabaseUrl}/functions/v1/social-oauth-callback`;

    let tokenData: TokenResponse;
    let pages: FacebookPage[] = [];
    let platformUserId: string | null = null;
    let platformUsername: string | null = null;

    // Exchange code for token based on platform
    if (platform === 'facebook' || platform === 'instagram') {
      // Exchange code for short-lived token
      const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
      tokenUrl.searchParams.set('client_id', Deno.env.get('META_APP_ID')!);
      tokenUrl.searchParams.set('client_secret', Deno.env.get('META_APP_SECRET')!);
      tokenUrl.searchParams.set('redirect_uri', callbackUrl);
      tokenUrl.searchParams.set('code', code);

      const tokenResponse = await fetch(tokenUrl.toString());
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        return Response.redirect(
          `${frontendUrl}/social-engagement?error=token_exchange_failed`,
          302
        );
      }

      tokenData = await tokenResponse.json();

      // Exchange for long-lived token
      const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
      longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
      longLivedUrl.searchParams.set('client_id', Deno.env.get('META_APP_ID')!);
      longLivedUrl.searchParams.set('client_secret', Deno.env.get('META_APP_SECRET')!);
      longLivedUrl.searchParams.set('fb_exchange_token', tokenData.access_token);

      const longLivedResponse = await fetch(longLivedUrl.toString());
      if (longLivedResponse.ok) {
        const longLivedData = await longLivedResponse.json();
        tokenData.access_token = longLivedData.access_token;
        tokenData.expires_in = longLivedData.expires_in;
      }

      // Get user info
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${tokenData.access_token}`
      );
      if (userResponse.ok) {
        const userData = await userResponse.json();
        platformUserId = userData.id;
        platformUsername = userData.name;
      }

      // Get pages the user manages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
      );
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        pages = pagesData.data || [];
      }

      // For Instagram, also get Instagram Business accounts
      if (platform === 'instagram') {
        for (const page of pages) {
          const igResponse = await fetch(
            `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
          );
          if (igResponse.ok) {
            const igData = await igResponse.json();
            if (igData.instagram_business_account) {
              const igAccountId = igData.instagram_business_account.id;
              const igInfoResponse = await fetch(
                `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,username&access_token=${page.access_token}`
              );
              if (igInfoResponse.ok) {
                const igInfo = await igInfoResponse.json();
                pages.push({
                  id: igAccountId,
                  name: `@${igInfo.username}`,
                  access_token: page.access_token,
                  category: 'instagram',
                });
              }
            }
          }
        }
        // Filter to only Instagram accounts
        pages = pages.filter(p => p.category === 'instagram');
      }

    } else if (platform === 'twitter') {
      // Twitter OAuth 2.0 token exchange
      const clientId = Deno.env.get('TWITTER_CLIENT_ID')!;
      const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET')!;
      
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: callbackUrl,
          code_verifier: codeVerifier || '',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Twitter token exchange failed:', errorText);
        return Response.redirect(
          `${frontendUrl}/social-engagement?error=token_exchange_failed`,
          302
        );
      }

      tokenData = await tokenResponse.json();

      // Get user info
      const userResponse = await fetch('https://api.twitter.com/2/users/me', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        platformUserId = userData.data.id;
        platformUsername = userData.data.username;
        pages = [{ 
          id: userData.data.id, 
          name: `@${userData.data.username}`,
          access_token: tokenData.access_token,
        }];
      }

    } else if (platform === 'linkedin') {
      const clientId = Deno.env.get('LINKEDIN_CLIENT_ID')!;
      const clientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET')!;

      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: callbackUrl,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('LinkedIn token exchange failed:', errorText);
        return Response.redirect(
          `${frontendUrl}/social-engagement?error=token_exchange_failed`,
          302
        );
      }

      tokenData = await tokenResponse.json();

      // Get user info using OpenID Connect userinfo endpoint (v2/me is deprecated)
      const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        // OpenID Connect returns 'sub' instead of 'id', and 'name' instead of localizedFirstName/lastName
        platformUserId = userData.sub;
        platformUsername = userData.name || `${userData.given_name || ''} ${userData.family_name || ''}`.trim();
        pages = [{
          id: userData.sub,
          name: platformUsername || userData.email || 'LinkedIn User',
          access_token: tokenData.access_token,
        }];
        console.log('LinkedIn user info retrieved:', { sub: userData.sub, name: platformUsername });
      } else {
        const errorText = await userResponse.text();
        console.error('LinkedIn userinfo fetch failed:', errorText);
      }
    }

    // If we have pages/accounts, store the first one (or redirect to page selection)
    if (pages.length > 0) {
      const selectedPage = pages[0];
      const tokenExpiresAt = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      // Upsert the connection
      const { error: upsertError } = await supabase
        .from('social_platform_connections')
        .upsert({
          organization_id: organizationId,
          platform,
          platform_user_id: platformUserId,
          platform_username: platformUsername,
          page_id: selectedPage.id,
          page_name: selectedPage.name,
          access_token: selectedPage.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_expires_at: tokenExpiresAt,
          is_active: true,
          auto_respond_enabled: false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id,platform,page_id',
        });

      if (upsertError) {
        console.error('Failed to save connection:', upsertError);
        return Response.redirect(
          `${frontendUrl}/social-engagement?error=save_failed`,
          302
        );
      }

      console.log(`Successfully connected ${platform} for org ${organizationId}`);

      // If there are multiple pages, we could redirect to a page selection screen
      // For now, just redirect with success and page count
      const redirectUrl = pages.length > 1
        ? `${frontendUrl}/social-engagement?connected=${platform}&pages=${pages.length}`
        : `${frontendUrl}/social-engagement?connected=${platform}`;

      return Response.redirect(redirectUrl, 302);
    }

    return Response.redirect(
      `${frontendUrl}/social-engagement?error=no_pages_found`,
      302
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://applyai.jobs';
    return Response.redirect(
      `${frontendUrl}/social-engagement?error=callback_error`,
      302
    );
  }
});
