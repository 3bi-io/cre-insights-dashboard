/**
 * Client Webhook Bulk Export Handler
 * 
 * Sends all applications matching a webhook's source_filter in bulk.
 * Used for one-time batch exports of existing application data.
 * 
 * SECURITY:
 * - Requires authentication
 * - Validates user has access to webhook's organization
 * - Logs all bulk export attempts for auditing
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getServiceClient, verifyUser } from '../_shared/supabase-client.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { wrapHandler, ValidationError, AuthorizationError, NotFoundError } from '../_shared/error-handler.ts';
import { enforceRateLimit, getRateLimitIdentifier } from '../_shared/rate-limiter.ts';

interface BulkExportRequest {
  webhook_id: string;
  filters?: {
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  };
}

// Zod validation schema for bulk export request
const BulkExportRequestSchema = z.object({
  webhook_id: z.string().uuid('Invalid webhook ID'),
  filters: z.object({
    status: z.string().max(50).optional(),
    search: z.string().max(200).optional(),
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)').optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)').optional(),
  }).optional(),
});

interface BulkExportPayload {
  event_type: 'bulk_export';
  timestamp: string;
  webhook_id: string;
  organization_id: string;
  total_applications: number;
  source_filter: string[];
  applications: Array<Record<string, any>>;
}

/**
 * Send bulk webhook payload
 */
async function sendBulkWebhook(
  url: string,
  payload: BulkExportPayload,
  secretKey: string | null
): Promise<{ success: boolean; status: number; body: string; error?: string }> {
  try {
    console.log('[CLIENT-WEBHOOK-BULK] Sending bulk export webhook', {
      url: url.substring(0, 50) + '...',
      totalApplications: payload.total_applications,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Supabase-Webhook-Bulk/1.0',
    };

    // Add signature header if secret key is configured
    if (secretKey) {
      headers['X-Webhook-Signature'] = secretKey;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000), // 60 second timeout for bulk
    });

    const responseBody = await response.text();

    if (response.ok) {
      console.log('[CLIENT-WEBHOOK-BULK] Bulk export succeeded');
      return {
        success: true,
        status: response.status,
        body: responseBody,
      };
    }

    return {
      success: false,
      status: response.status,
      body: responseBody,
      error: `HTTP ${response.status}: ${responseBody}`,
    };
  } catch (error) {
    console.error('[CLIENT-WEBHOOK-BULK] Bulk export failed:', error);
    return {
      success: false,
      status: 500,
      body: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getServiceClient();
  const startTime = Date.now();

  // Verify user authentication
  const { userId } = await verifyUser(req);
  console.log('[CLIENT-WEBHOOK-BULK] Request from user:', userId);

  // Apply rate limiting: 5 bulk exports per hour per user
  const identifier = `user:${userId}`;
  try {
    await enforceRateLimit(identifier, {
      maxRequests: 5,
      windowMs: 3600000, // 1 hour
      keyPrefix: 'bulk-export'
    });
  } catch (error: any) {
    console.warn('[CLIENT-WEBHOOK-BULK] Rate limit exceeded', { userId });
    return new Response(
      JSON.stringify({ 
        error: 'Too many bulk export requests. Please try again later.',
        retryAfter: error.retryAfter 
      }),
      { 
        status: 429,
        headers: {
          'Retry-After': error.retryAfter?.toString() || '3600',
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }

  // Parse and validate request body
  const rawBody = await req.json();
  const validationResult = BulkExportRequestSchema.safeParse(rawBody);
  
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    console.warn('[CLIENT-WEBHOOK-BULK] Validation failed', { errors });
    return validationErrorResponse(errors, origin);
  }

  const body = validationResult.data;
  const { webhook_id, filters = {} } = body;

  // Fetch webhook configuration
  const { data: webhook, error: webhookError } = await supabase
    .from('client_webhooks')
    .select('*, organizations!inner(id, name)')
    .eq('id', webhook_id)
    .single();

  if (webhookError || !webhook) {
    throw new NotFoundError('Webhook');
  }

  // Verify user has access to this webhook's organization
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (!userProfile || userProfile.organization_id !== webhook.organization_id) {
    throw new AuthorizationError('You do not have access to this webhook');
  }

  // Verify webhook is enabled
  if (!webhook.enabled) {
    throw new ValidationError('Webhook is disabled. Enable it before bulk exporting.');
  }

  console.log('[CLIENT-WEBHOOK-BULK] Fetching applications for webhook:', {
    webhookId: webhook_id,
    organizationId: webhook.organization_id,
    sourceFilter: webhook.source_filter,
  });

  // Build applications query with source filter
  let query = supabase
    .from('applications')
    .select(`
      *,
      job_listings!inner(
        id,
        title,
        location,
        organization_id
      )
    `)
    .eq('job_listings.organization_id', webhook.organization_id);

  // Apply source filter (main filter)
  if (webhook.source_filter && webhook.source_filter.length > 0) {
    query = query.in('source', webhook.source_filter);
  }

  // Apply optional filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,applicant_email.ilike.%${filters.search}%`);
  }

  if (filters.date_from) {
    query = query.gte('applied_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('applied_at', filters.date_to);
  }

  // Order by most recent
  query = query.order('applied_at', { ascending: false });

  // Execute query
  const { data: applications, error: appsError } = await query;

  if (appsError) {
    console.error('[CLIENT-WEBHOOK-BULK] Error fetching applications:', appsError);
    throw new Error(`Failed to fetch applications: ${appsError.message}`);
  }

  console.log('[CLIENT-WEBHOOK-BULK] Found applications:', applications?.length || 0);

  if (!applications || applications.length === 0) {
    return successResponse({
      success: true,
      applications_sent: 0,
      message: 'No applications match the webhook source filter',
    }, 'No applications to export', undefined, origin);
  }

  // Build bulk payload
  const payload: BulkExportPayload = {
    event_type: 'bulk_export',
    timestamp: new Date().toISOString(),
    webhook_id: webhook.id,
    organization_id: webhook.organization_id,
    total_applications: applications.length,
    source_filter: webhook.source_filter,
    applications: applications,
  };

  // Send webhook
  const webhookResult = await sendBulkWebhook(
    webhook.webhook_url,
    payload,
    webhook.secret_key
  );

  const duration = Date.now() - startTime;

  // Log the bulk export attempt
  await supabase.from('client_webhook_logs').insert({
    webhook_id: webhook.id,
    application_id: applications[0].id, // Use first app ID as reference
    event_type: 'bulk_export',
    request_payload: {
      total_applications: applications.length,
      source_filter: webhook.source_filter,
      filters,
    },
    response_status: webhookResult.status,
    response_body: webhookResult.body.substring(0, 1000), // Truncate for storage
    error_message: webhookResult.error || null,
    duration_ms: duration,
  });

  if (!webhookResult.success) {
    // Update webhook with last error
    await supabase
      .from('client_webhooks')
      .update({
        last_triggered_at: new Date().toISOString(),
        last_error: webhookResult.error || `HTTP ${webhookResult.status}`,
      })
      .eq('id', webhook.id);

    return errorResponse(
      `Bulk export failed: ${webhookResult.error || 'Unknown error'}`,
      500,
      {
        applications_attempted: applications.length,
        webhook_status: webhookResult.status,
      },
      origin
    );
  }

  // Update webhook with success status
  await supabase
    .from('client_webhooks')
    .update({
      last_triggered_at: new Date().toISOString(),
      last_success_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', webhook.id);

  console.log('[CLIENT-WEBHOOK-BULK] Bulk export completed successfully', {
    applicationsSent: applications.length,
    duration,
  });

  return successResponse({
    success: true,
    applications_sent: applications.length,
    webhook_status: webhookResult.status,
    duration_ms: duration,
  }, `Successfully exported ${applications.length} applications`, undefined, origin);
};

serve(wrapHandler(handler, { context: 'client-webhook-bulk-export', logRequests: true }));
