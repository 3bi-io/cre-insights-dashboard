/**
 * Generic ATS Auto-Post Engine
 * Replaces hardcoded Tenstreet/DriverReach auto-posting with dynamic ATS routing
 */

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2.50.0';
import { createATSAdapter } from './index.ts';
import { enrichWithTranscript } from './transcript-enrichment.ts';
import { calculateReadinessScore } from './readiness-scorer.ts';
import type { ATSSystem, ATSConnection, FieldMapping, ApplicationData, ATSResponse } from './types.ts';
import { createLogger } from '../logger.ts';
import { isDoubleNickelAllowed, DOUBLENICKEL_SLUG } from '../ats-constants.ts';

const logger = createLogger('auto-post-engine');

/**
 * Sanitize payload for logging - remove sensitive fields like SSN, password, etc.
 */
function sanitizePayload(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['ssn', 'password', 'government_id', 'secret', 'token'];
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizePayload(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

interface AutoPostResult {
  connectionId: string;
  atsSlug: string;
  atsName: string;
  success: boolean;
  externalId?: string;
  error?: string;
  durationMs: number;
}

interface AutoPostSummary {
  totalConnections: number;
  successful: number;
  failed: number;
  skipped: number;
  results: AutoPostResult[];
}

/**
 * Auto-post application to all enabled ATS connections for an organization
 */
export async function autoPostToATS(
  supabase: SupabaseClient,
  applicationId: string,
  organizationId: string,
  applicationData: Record<string, unknown>,
  options?: {
    clientId?: string;
    triggerStatus?: string;
    skipFeatureCheck?: boolean;
  }
): Promise<AutoPostSummary> {
  const summary: AutoPostSummary = {
    totalConnections: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    results: []
  };

  const correlationId = `auto-post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  logger.info('Starting auto-post', { correlationId, applicationId });

  try {
    // Get all active ATS connections for the organization
    const { data: connections, error: connError } = await supabase
      .rpc('get_active_ats_connections', {
        p_organization_id: organizationId,
        p_client_id: options?.clientId || null
      });

    if (connError) {
      logger.error('Failed to get connections', connError, { correlationId });
      return summary;
    }

    if (!connections || connections.length === 0) {
      logger.info('No active ATS connections found', { correlationId });
      return summary;
    }

    summary.totalConnections = connections.length;
    logger.info('Found active connections', { correlationId, count: connections.length });

    // Process each connection
    for (const conn of connections) {
      const startTime = Date.now();
      
      // Check if auto-post is enabled for this connection
      if (!conn.is_auto_post_enabled) {
        logger.debug('Skipping - auto-post not enabled', { correlationId, ats: conn.ats_slug });
        summary.skipped++;
        continue;
      }

      // Check if the status matches auto-post trigger (if configured)
      if (conn.auto_post_on_status && conn.auto_post_on_status.length > 0) {
        const appStatus = applicationData.status as string || 'pending';
        if (!conn.auto_post_on_status.includes(appStatus)) {
          logger.debug('Skipping - status not in trigger list', { correlationId, ats: conn.ats_slug, status: appStatus });
          summary.skipped++;
          continue;
        }
      }

      try {
        // === ATS Readiness Check ===
        const readiness = calculateReadinessScore(applicationData, conn.ats_slug, 60);
        
        // Store readiness score on the application
        await supabase
          .from('applications')
          .update({ ats_readiness_score: readiness.score } as any)
          .eq('id', applicationId);

        if (!readiness.isReady) {
          logger.info('Skipping - low readiness score', { 
            correlationId, ats: conn.ats_slug, score: readiness.score, 
            missingRequired: readiness.missingRequired 
          });
          
          // Log skip to ats_sync_logs
          await supabase.from('ats_sync_logs').insert({
            ats_connection_id: conn.connection_id,
            application_id: applicationId,
            action: 'skipped_low_readiness',
            status: 'skipped',
            error_message: `Readiness score ${readiness.score}% below threshold ${readiness.threshold}%`,
            request_payload: sanitizePayload({ 
              readiness_score: readiness.score,
              missing_required: readiness.missingRequired,
              missing_recommended: readiness.missingRecommended 
            } as Record<string, unknown>)
          });

          summary.skipped++;
          summary.results.push({
            connectionId: conn.connection_id,
            atsSlug: conn.ats_slug,
            atsName: conn.ats_name,
            success: false,
            error: `Readiness score too low: ${readiness.score}%`,
            durationMs: Date.now() - startTime
          });
          continue;
        }

        // Build ATS system config
        const system: ATSSystem = {
          id: conn.ats_system_id,
          slug: conn.ats_slug,
          name: conn.ats_name,
          api_type: conn.api_type as 'rest_json' | 'xml_post' | 'soap' | 'graphql',
          base_endpoint: conn.base_endpoint,
          credential_schema: {},
          is_active: true
        };

        // Build connection config
        const connection: ATSConnection = {
          id: conn.connection_id,
          ats_system_id: conn.ats_system_id,
          organization_id: organizationId,
          name: conn.ats_name,
          credentials: conn.credentials,
          status: 'active',
          mode: conn.mode || 'PROD',
          is_auto_post_enabled: conn.is_auto_post_enabled
        };

        // Get field mapping for this connection
        const { data: mappingData } = await supabase
          .from('ats_field_mappings')
          .select('*')
          .eq('ats_connection_id', conn.connection_id)
          .eq('is_active', true)
          .eq('is_default', true)
          .single();

        const fieldMapping: FieldMapping | undefined = mappingData ? {
          id: mappingData.id,
          ats_connection_id: mappingData.ats_connection_id,
          name: mappingData.name,
          field_mappings: mappingData.field_mappings,
          transform_rules: mappingData.transform_rules,
          is_active: mappingData.is_active,
          is_default: mappingData.is_default
        } : undefined;

        // Create adapter and send application
        const adapter = createATSAdapter(system, connection, fieldMapping);
        
        // Transform application data to expected format
        const appData: ApplicationData = {
          id: applicationId,
          first_name: applicationData.first_name as string,
          last_name: applicationData.last_name as string,
          email: applicationData.applicant_email as string || applicationData.email as string,
          phone: applicationData.phone as string,
          city: applicationData.city as string,
          state: applicationData.state as string,
          zip: applicationData.zip as string,
          address_1: applicationData.address_1 as string,
          country: applicationData.country as string || 'US',
          cdl_class: applicationData.cdl_class as string,
          cdl_endorsements: applicationData.cdl_endorsements as string[],
          driving_experience_years: applicationData.driving_experience_years as number,
          date_of_birth: applicationData.date_of_birth as string,
          status: applicationData.status as string,
          source: applicationData.source as string,
          ...applicationData
        };

        // Enrich with transcript before sending (for re-posts after outbound calls)
        const enrichedData = await enrichWithTranscript(supabase, appData) as ApplicationData;

        logger.info('Sending to ATS', { correlationId, ats: conn.ats_slug });
        const response = await adapter.sendApplication(enrichedData);
        const durationMs = Date.now() - startTime;

        const result: AutoPostResult = {
          connectionId: conn.connection_id,
          atsSlug: conn.ats_slug,
          atsName: conn.ats_name,
          success: response.success,
          externalId: response.external_id,
          error: response.error,
          durationMs
        };

        summary.results.push(result);

        if (response.success) {
          summary.successful++;
          logger.info('ATS post successful', { correlationId, ats: conn.ats_slug, durationMs, externalId: response.external_id });
          
          // Update sync stats
          await supabase.rpc('increment_ats_sync_stats', {
            p_connection_id: conn.connection_id,
            p_success: true
          });

          // Update application with sync status
          await updateApplicationSyncStatus(supabase, applicationId, conn.ats_slug, {
            status: 'synced',
            externalId: response.external_id
          });

        } else {
          summary.failed++;
          logger.error('ATS post failed', null, { correlationId, ats: conn.ats_slug, durationMs, error: response.error });
          
          // Update sync stats
          await supabase.rpc('increment_ats_sync_stats', {
            p_connection_id: conn.connection_id,
            p_success: false
          });

          // Update application with sync status
          await updateApplicationSyncStatus(supabase, applicationId, conn.ats_slug, {
            status: 'failed',
            error: response.error
          });
        }

        // Log to ats_sync_logs
        await supabase.from('ats_sync_logs').insert({
          ats_connection_id: conn.connection_id,
          application_id: applicationId,
          action: 'auto_post',
          status: response.success ? 'success' : 'failed',
          error_message: response.error,
          duration_ms: durationMs,
          response_data: response.data,
          request_payload: sanitizePayload(enrichedData as Record<string, unknown>)
        });

      } catch (error) {
        const durationMs = Date.now() - startTime;
        const err = error as Error;
        
        logger.error('ATS post error', error, { correlationId, ats: conn.ats_slug, durationMs });
        
        summary.failed++;
        summary.results.push({
          connectionId: conn.connection_id,
          atsSlug: conn.ats_slug,
          atsName: conn.ats_name,
          success: false,
          error: err.message,
          durationMs
        });

        // Log error
        await supabase.from('ats_sync_logs').insert({
          ats_connection_id: conn.connection_id,
          application_id: applicationId,
          action: 'auto_post',
          status: 'failed',
          error_message: err.message,
          duration_ms: durationMs,
          request_payload: sanitizePayload(applicationData as Record<string, unknown>)
        });
      }
    }

  } catch (error) {
    logger.error('Fatal error', error, { correlationId });
  }

  logger.info('Auto-post complete', { correlationId, successful: summary.successful, total: summary.totalConnections, failed: summary.failed, skipped: summary.skipped });
  
  return summary;
}

/**
 * Update application sync status columns based on ATS slug
 */
async function updateApplicationSyncStatus(
  supabase: SupabaseClient,
  applicationId: string,
  atsSlug: string,
  update: { status: 'synced' | 'failed'; externalId?: string; error?: string }
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  
  // Map ATS slug to application columns
  switch (atsSlug) {
    case 'tenstreet':
      updateData.tenstreet_sync_status = update.status;
      updateData.tenstreet_last_sync = new Date().toISOString();
      if (update.externalId) {
        updateData.tenstreet_applied_via = 'auto_post';
        updateData.driver_id = update.externalId;
      }
      break;
    case 'driverreach':
      updateData.driverreach_sync_status = update.status;
      updateData.driverreach_last_sync = new Date().toISOString();
      if (update.externalId) {
        updateData.driverreach_applied_via = 'auto_post';
      }
      break;
    // Add more ATS-specific columns as needed
    default:
      // For other ATS, store in notes or custom_questions
      break;
  }

  if (Object.keys(updateData).length > 0) {
    await supabase
      .from('applications')
      .update(updateData)
      .eq('id', applicationId);
  }
}

/**
 * Check if organization has any ATS connections with auto-post enabled
 */
export async function hasAutoPostEnabled(
  supabase: SupabaseClient,
  organizationId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('ats_connections')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .eq('is_auto_post_enabled', true)
    .limit(1);

  return !!data && data.length > 0;
}

/**
 * Get list of ATS connections that would receive an auto-post
 */
export async function getAutoPostTargets(
  supabase: SupabaseClient,
  organizationId: string,
  status?: string
): Promise<Array<{ slug: string; name: string; connectionId: string }>> {
  const { data: connections } = await supabase
    .rpc('get_active_ats_connections', {
      p_organization_id: organizationId,
      p_client_id: null
    });

  if (!connections) return [];

  return connections
    .filter((conn: any) => {
      if (!conn.is_auto_post_enabled) return false;
      if (status && conn.auto_post_on_status?.length > 0) {
        return conn.auto_post_on_status.includes(status);
      }
      return true;
    })
    .map((conn: any) => ({
      slug: conn.ats_slug,
      name: conn.ats_name,
      connectionId: conn.connection_id
    }));
}
