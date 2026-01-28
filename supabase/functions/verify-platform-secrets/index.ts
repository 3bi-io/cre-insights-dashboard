import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, platforms } = await req.json();

    // Support both single platform and array of platforms
    const platformsToCheck = platforms || (platform ? [platform] : []);

    if (platformsToCheck.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Platform or platforms array required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
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

    // If single platform requested, return simplified response
    if (platform && !platforms) {
      const result = results[platform];
      return new Response(
        JSON.stringify({
          success: true,
          platform,
          ...result,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return all results for batch request
    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying platform secrets:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
