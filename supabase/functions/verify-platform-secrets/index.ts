import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('verify-platform-secrets');

// Map of platform to required secret environment variable names
const PLATFORM_SECRETS: Record<string, string[]> = {
  x: ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET'],
  twitter: ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET'],
  facebook: ['META_APP_ID', 'META_APP_SECRET'],
  instagram: ['META_APP_ID', 'META_APP_SECRET'],
  whatsapp: ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN'],
  tiktok: ['TIKTOK_APP_ID', 'TIKTOK_APP_SECRET'],
  reddit: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'],
  linkedin: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, platforms } = await req.json();

    const platformsToCheck = platforms || (platform ? [platform] : []);

    if (platformsToCheck.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Platform or platforms array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: Record<string, {
      hasAllSecrets: boolean;
      configuredSecrets: string[];
      missingSecrets: string[];
    }> = {};

    for (const p of platformsToCheck) {
      const requiredSecrets = PLATFORM_SECRETS[p.toLowerCase()] || [];
      const configuredSecrets: string[] = [];
      const missingSecrets: string[] = [];

      for (const secretName of requiredSecrets) {
        const value = Deno.env.get(secretName);
        if (value && value.trim() !== '') {
          configuredSecrets.push(secretName);
        } else {
          missingSecrets.push(secretName);
        }
      }

      results[p] = {
        hasAllSecrets: missingSecrets.length === 0 && configuredSecrets.length > 0,
        configuredSecrets,
        missingSecrets,
      };
    }

    if (platform && !platforms) {
      const result = results[platform];
      return new Response(
        JSON.stringify({ success: true, platform, ...result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    logger.error('Error verifying platform secrets', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
