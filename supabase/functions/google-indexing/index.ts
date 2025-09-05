import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IndexingRequest {
  action: 'publish_all' | 'publish_from_feed' | 'publish_urls' | 'remove_urls'
  urls?: string[]
  feed_url?: string
}

interface IndexingResult {
  total: number
  successes: number
  failures: number
  errors: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const { action, urls, feed_url }: IndexingRequest = await req.json()

    if (!action) {
      throw new Error('Action parameter required')
    }

    // Load service account JSON from environment
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    if (!serviceAccountJson) {
      throw new Error('Google Service Account JSON not configured')
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    let urlsToProcess: string[] = []

    if (action === 'publish_all') {
      // Fetch all active job URLs
      const { data: jobs, error } = await supabaseClient
        .from('job_listings')
        .select('url, apply_url')
        .eq('status', 'active')

      if (error) throw error

      urlsToProcess = jobs
        .map(job => job.url || job.apply_url)
        .filter(Boolean) as string[]
    } else if (action === 'publish_from_feed') {
      if (!feed_url) {
        throw new Error('feed_url parameter required for publish_from_feed')
      }
      const feedResp = await fetch(feed_url)
      if (!feedResp.ok) {
        throw new Error(`Failed to fetch feed: ${feedResp.status} ${feedResp.statusText}`)
      }
      const xmlText = await feedResp.text()
      const linkRegex = /<item>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/g
      const links: string[] = []
      let match
      while ((match = linkRegex.exec(xmlText)) !== null) {
        if (match[1]) links.push(match[1].trim())
      }
      urlsToProcess = Array.from(new Set(links)).filter(Boolean)
    } else {
      if (!urls || urls.length === 0) {
        throw new Error('URLs parameter required for this action')
      }
      urlsToProcess = urls
    }

    // Get OAuth2 access token
    const accessToken = await getAccessToken(serviceAccount)
    
    // Process each URL
    const result: IndexingResult = {
      total: urlsToProcess.length,
      successes: 0,
      failures: 0,
      errors: []
    }

    const notificationType = action.startsWith('publish') ? 'URL_UPDATED' : 'URL_DELETED'

    for (const url of urlsToProcess) {
      try {
        await notifyGoogleIndexing(url, notificationType, accessToken)
        result.successes++
        console.log(`Successfully notified Google about ${url}`)
      } catch (error) {
        result.failures++
        result.errors.push(`${url}: ${error.message}`)
        console.error(`Failed to notify Google about ${url}:`, error)
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in google-indexing function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwtHeader = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)
  const jwtPayload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }

  // Create JWT (simplified - in production you'd use a proper JWT library)
  const jwt = await createJWT(jwtHeader, jwtPayload, serviceAccount.private_key)

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.statusText}`)
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

async function createJWT(header: any, payload: any, privateKey: string): Promise<string> {
  // This is a simplified JWT creation - in production use a proper library
  const encoder = new TextEncoder()
  
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  const data = `${headerB64}.${payloadB64}`
  
  // Import private key
  const keyData = privateKey.replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '')
  
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(data)
  )
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  return `${data}.${signatureB64}`
}

async function notifyGoogleIndexing(url: string, type: 'URL_UPDATED' | 'URL_DELETED', accessToken: string): Promise<void> {
  const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: url,
      type: type
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Indexing API error: ${response.status} ${errorText}`)
  }
}