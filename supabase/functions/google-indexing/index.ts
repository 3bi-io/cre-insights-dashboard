/**
 * Google Indexing Edge Function (Manual/Admin)
 * Allows authenticated admins to manually submit URLs to Google Indexing API.
 */

import { createClient } from 'npm:@supabase/supabase-js@2.50.0';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const logger = createLogger('google-indexing');

function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

interface IndexingRequest {
  action: 'publish_all' | 'publish_from_feed' | 'publish_urls' | 'remove_urls';
  urls?: string[];
  feed_url?: string;
}

interface IndexingResult {
  total: number;
  successes: number;
  failures: number;
  errors: string[];
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized: Authentication required');
    }

    const { data: hasAccess } = await supabaseClient.rpc('is_super_admin', { _user_id: user.id });
    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!hasAccess && !isAdmin) {
      throw new Error('Unauthorized: Admin privileges required for Google Indexing');
    }

    const { action, urls, feed_url }: IndexingRequest = await req.json();

    if (!action) {
      throw new Error('Action parameter required');
    }

    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      throw new Error('Google Service Account JSON not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const supabaseServiceClient = getServiceClient();

    let urlsToProcess: string[] = [];

    if (action === 'publish_all') {
      const { data: jobs, error } = await supabaseServiceClient
        .from('job_listings')
        .select('url, apply_url')
        .eq('status', 'active')
        .eq('is_hidden', false);

      if (error) throw error;

      urlsToProcess = jobs
        .map(job => job.url || job.apply_url)
        .filter(Boolean) as string[];
    } else if (action === 'publish_from_feed') {
      if (!feed_url) {
        throw new Error('feed_url parameter required for publish_from_feed');
      }
      const feedResp = await fetch(feed_url);
      if (!feedResp.ok) {
        throw new Error(`Failed to fetch feed: ${feedResp.status} ${feedResp.statusText}`);
      }
      const xmlText = await feedResp.text();
      const linkRegex = /<item>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/g;
      const locRegex = /<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/url>/g;
      const links: string[] = [];
      let match;
      while ((match = linkRegex.exec(xmlText)) !== null) {
        if (match[1]) links.push(match[1].trim());
      }
      while ((match = locRegex.exec(xmlText)) !== null) {
        if (match[1]) links.push(match[1].trim());
      }
      urlsToProcess = Array.from(new Set(links)).filter(Boolean) as string[];
    } else {
      if (!urls || urls.length === 0) {
        throw new Error('URLs parameter required for this action');
      }
      urlsToProcess = urls;
    }

    const invalidUrls = urlsToProcess.filter(url => !validateUrl(url));
    if (invalidUrls.length > 0) {
      throw new Error(`Invalid URLs detected: ${invalidUrls.slice(0, 5).join(', ')}${invalidUrls.length > 5 ? '...' : ''}`);
    }

    if (urlsToProcess.length > 1000) {
      throw new Error('Maximum 1000 URLs per request. Please batch your requests.');
    }

    const accessToken = await getAccessToken(serviceAccount);

    const result: IndexingResult = {
      total: urlsToProcess.length,
      successes: 0,
      failures: 0,
      errors: [],
    };

    const notificationType = action.startsWith('publish') ? 'URL_UPDATED' : 'URL_DELETED';

    for (const url of urlsToProcess) {
      try {
        await notifyGoogleIndexing(url, notificationType, accessToken);
        result.successes++;
      } catch (error: unknown) {
        result.failures++;
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push(`${url}: ${message}`);
        logger.error('Failed to notify Google', error, { url });
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    logger.error('Error in google-indexing function', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface ServiceAccount { client_email: string; private_key: string }

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await createJWT(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    sa.private_key
  );

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed to get access token (${resp.status}): ${body.substring(0, 300)}`);
  }

  const tokenData = await resp.json();
  return tokenData.access_token;
}

async function createJWT(header: Record<string, string>, payload: Record<string, unknown>, privateKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const data = `${headerB64}.${payloadB64}`;

  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(data));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${data}.${signatureB64}`;
}

async function notifyGoogleIndexing(url: string, type: 'URL_UPDATED' | 'URL_DELETED', accessToken: string): Promise<void> {
  const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, type }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Indexing API error: ${response.status} ${errorText}`);
  }
  await response.text();
}
