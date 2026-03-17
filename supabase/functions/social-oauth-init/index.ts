import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('social-oauth-init');

type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'whatsapp';

interface OAuthConfig {
  authUrl: string;
  scopes: string[];
  clientIdEnv: string;
}

const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scopes: [
      'pages_show_list', 'pages_read_engagement', 'pages_manage_metadata',
      'pages_messaging', 'pages_read_user_content', 'pages_manage_posts', 'public_profile',
    ],
    clientIdEnv: 'META_APP_ID',
  },
  instagram: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scopes: [
      'instagram_basic', 'instagram_manage_comments', 'instagram_manage_messages',
      'pages_show_list', 'pages_read_engagement', 'public_profile',
    ],
    clientIdEnv: 'META_APP_ID',
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'dm.read', 'dm.write', 'offline.access'],
    clientIdEnv: 'TWITTER_CLIENT_ID',
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scopes: [
      'openid', 'profile', 'email', 'w_member_social',
      'r_organization_social', 'w_organization_social', 'rw_organization_admin',
    ],
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
  },
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, organizationId, redirectUri } = await req.json();

    if (!platform || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: platform, organizationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = OAUTH_CONFIGS[platform as string];
    if (!config) {
      return new Response(
        JSON.stringify({ error: `Unsupported platform: ${platform}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = Deno.env.get(config.clientIdEnv);
    if (!clientId) {
      return new Response(
        JSON.stringify({ error: `OAuth not configured for ${platform}. Missing ${config.clientIdEnv}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const state = btoa(JSON.stringify({
      organizationId, platform,
      nonce: crypto.randomUUID(),
      timestamp: Date.now(),
    }));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const callbackUrl = `${supabaseUrl}/functions/v1/social-oauth-callback`;

    let authUrl: URL;
    
    if (platform === 'twitter') {
      const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const hash = await crypto.subtle.digest('SHA-256', data);
      const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      authUrl = new URL(config.authUrl);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', callbackUrl);
      authUrl.searchParams.set('scope', config.scopes.join(' '));
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      const stateWithVerifier = btoa(JSON.stringify({
        ...JSON.parse(atob(state)), codeVerifier,
      }));
      authUrl.searchParams.set('state', stateWithVerifier);
    } else if (platform === 'linkedin') {
      authUrl = new URL(config.authUrl);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', callbackUrl);
      authUrl.searchParams.set('scope', config.scopes.join(' '));
      authUrl.searchParams.set('state', state);
    } else {
      authUrl = new URL(config.authUrl);
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', callbackUrl);
      authUrl.searchParams.set('scope', config.scopes.join(','));
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('response_type', 'code');
    }

    logger.info(`Generated OAuth URL for ${platform}`, { platform, organizationId });

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString(), state }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    logger.error('OAuth init error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
