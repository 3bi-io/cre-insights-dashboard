/**
 * Resolve Embed Token Edge Function
 * 
 * Resolves encrypted embed tokens to full embed URLs without exposing
 * the job_id and UTM parameters in the client-side HTML source.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getServiceClient } from '../_shared/supabase-client.ts';

// This endpoint must allow ANY origin since it's designed for 
// embedding on third-party websites. Domain security is handled 
// via the allowed_domains column in the token itself.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface TokenData {
  id: string;
  token: string;
  job_listing_id: string;
  organization_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  allowed_domains: string[] | null;
  is_active: boolean;
  expires_at: string | null;
  job_listings: {
    title: string;
    clients: {
      name: string;
      logo_url: string | null;
    } | null;
  } | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getServiceClient();

    // Fetch token data with job and client info
    const { data: tokenData, error: fetchError } = await supabase
      .from('embed_tokens')
      .select(`
        id,
        token,
        job_listing_id,
        organization_id,
        utm_source,
        utm_medium,
        utm_campaign,
        allowed_domains,
        is_active,
        expires_at,
        job_listings (
          title,
          clients (
            name,
            logo_url
          )
        )
      `)
      .eq('token', token)
      .single();

    if (fetchError || !tokenData) {
      console.error('Token lookup failed:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const typedTokenData = tokenData as TokenData;

    // Check if token is active
    if (!typedTokenData.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token is inactive' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token has expired
    if (typedTokenData.expires_at && new Date(typedTokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token has expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate domain if allowed_domains is set
    const referer = req.headers.get('referer');
    if (typedTokenData.allowed_domains && typedTokenData.allowed_domains.length > 0 && referer) {
      try {
        const refererUrl = new URL(referer);
        const refererHost = refererUrl.hostname;
        const isAllowed = typedTokenData.allowed_domains.some(domain => {
          // Support wildcard subdomains (*.example.com)
          if (domain.startsWith('*.')) {
            const baseDomain = domain.slice(2);
            return refererHost === baseDomain || refererHost.endsWith('.' + baseDomain);
          }
          return refererHost === domain || refererHost === 'www.' + domain;
        });

        if (!isAllowed) {
          console.warn(`Domain not allowed: ${refererHost}, allowed: ${typedTokenData.allowed_domains}`);
          return new Response(
            JSON.stringify({ success: false, error: 'Domain not authorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (e) {
        // Invalid referer URL, skip domain check
        console.warn('Invalid referer URL:', referer);
      }
    }

    // Increment impression count (fire and forget)
    supabase
      .from('embed_tokens')
      .update({ impression_count: (tokenData as any).impression_count + 1 })
      .eq('id', typedTokenData.id)
      .then(() => {})
      .catch((err: Error) => console.error('Failed to increment impression:', err));

    // Build the embed URL with UTM parameters
    const params = new URLSearchParams();
    params.set('job_id', typedTokenData.job_listing_id);
    
    if (typedTokenData.utm_source) {
      params.set('utm_source', typedTokenData.utm_source);
    }
    if (typedTokenData.utm_medium) {
      params.set('utm_medium', typedTokenData.utm_medium);
    }
    if (typedTokenData.utm_campaign) {
      params.set('utm_campaign', typedTokenData.utm_campaign);
    }

    const embedUrl = `/embed/apply?${params.toString()}`;

    // Return the resolved URL along with metadata for loading state
    return new Response(
      JSON.stringify({
        success: true,
        url: embedUrl,
        clientName: typedTokenData.job_listings?.clients?.name || null,
        clientLogoUrl: typedTokenData.job_listings?.clients?.logo_url || null,
        jobTitle: typedTokenData.job_listings?.title || null,
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        } 
      }
    );

  } catch (error) {
    console.error('Error resolving embed token:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
