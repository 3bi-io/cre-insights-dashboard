 /**
  * Google Indexing Trigger Edge Function
  * Called automatically when jobs are created, updated, or deleted
  * Uses service role key - should only be called by database triggers
  */
 
 import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
 import { createLogger } from "../_shared/logger.ts"
 
 const logger = createLogger('google-indexing-trigger')
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 }
 
 interface TriggerPayload {
   job_id: string
   action: 'created' | 'updated' | 'deleted'
   url?: string
   organization_id?: string
 }
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders })
   }
 
   try {
     const payload: TriggerPayload = await req.json()
     
     logger.info('Indexing trigger received', { 
       jobId: payload.job_id, 
       action: payload.action 
     })
 
     // Check if Google Service Account is configured
     const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
     if (!serviceAccountJson) {
       logger.warn('Google Service Account not configured, skipping indexing')
       return new Response(
         JSON.stringify({ success: true, message: 'Indexing skipped - no credentials' }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       )
     }
 
     // Build the job URL
     const baseUrl = 'https://apply.jobs'
     const jobUrl = payload.url || `${baseUrl}/jobs/${payload.job_id}`
 
     // Determine notification type
     const notificationType = payload.action === 'deleted' ? 'URL_DELETED' : 'URL_UPDATED'
 
     // Get OAuth2 access token and notify Google
     const serviceAccount = JSON.parse(serviceAccountJson)
     const accessToken = await getAccessToken(serviceAccount)
     await notifyGoogleIndexing(jobUrl, notificationType, accessToken)
 
     logger.info('Successfully notified Google Indexing API', { 
       url: jobUrl, 
       type: notificationType 
     })
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         message: `Notified Google: ${notificationType}`,
         url: jobUrl
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     )
 
   } catch (error) {
     logger.error('Indexing trigger error', { error })
     
     // Don't fail the response - we don't want to block job operations
     return new Response(
       JSON.stringify({ 
         success: false, 
         error: error instanceof Error ? error.message : 'Unknown error'
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     )
   }
 })
 
 async function getAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
   const jwtHeader = { alg: 'RS256', typ: 'JWT' }
   const now = Math.floor(Date.now() / 1000)
   const jwtPayload = {
     iss: serviceAccount.client_email,
     scope: 'https://www.googleapis.com/auth/indexing',
     aud: 'https://oauth2.googleapis.com/token',
     iat: now,
     exp: now + 3600
   }
 
   const jwt = await createJWT(jwtHeader, jwtPayload, serviceAccount.private_key)
 
   const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
     method: 'POST',
     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
 
 async function createJWT(
   header: { alg: string; typ: string }, 
   payload: Record<string, unknown>, 
   privateKey: string
 ): Promise<string> {
   const encoder = new TextEncoder()
   
   const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
   const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
   
   const data = `${headerB64}.${payloadB64}`
   
   const keyData = privateKey
     .replace(/-----BEGIN PRIVATE KEY-----/, '')
     .replace(/-----END PRIVATE KEY-----/, '')
     .replace(/\n/g, '')
   
   const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
   
   const key = await crypto.subtle.importKey(
     'pkcs8',
     binaryKey.buffer,
     { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
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
 
 async function notifyGoogleIndexing(
   url: string, 
   type: 'URL_UPDATED' | 'URL_DELETED', 
   accessToken: string
 ): Promise<void> {
   const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${accessToken}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({ url, type })
   })
 
   if (!response.ok) {
     const errorText = await response.text()
     throw new Error(`Google Indexing API error: ${response.status} ${errorText}`)
   }
 }