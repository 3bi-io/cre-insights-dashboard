/**
 * Tenstreet extractcomplete Webhook Receiver
 * 
 * Receives SOAP 1.1 callbacks from Tenstreet when background checks/screenings complete.
 * This is a CRITICAL endpoint - without it, screening results are never received.
 * 
 * Flow:
 * 1. Tenstreet completes screening → sends SOAP POST to this endpoint
 * 2. Parse SOAP envelope, extract PacketId, DriverId, Status, ExtractURL
 * 3. Validate security (ClientId, idempotency)
 * 4. Update tenstreet_xchange_requests table
 * 5. Download extract file if URL provided
 * 6. Log to tenstreet_webhook_logs
 * 7. Return SOAP acknowledgment
 * 
 * Security:
 * - No JWT verification (external webhook)
 * - ClientId validation against organization credentials
 * - Idempotency checking (duplicate PacketId handling)
 * - IP allowlisting (TODO: configure Tenstreet IP ranges)
 */

import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { wrapHandler } from '../_shared/error-handler.ts';
import { createLogger } from '../_shared/logger.ts';
import {
  parseSOAPEnvelope,
  parseTenstreetExtractComplete,
  validateSOAPStructure,
  createSOAPFault,
  createSOAPResponse,
  type ExtractCompleteData
} from '../_shared/soap-parser.ts';

const logger = createLogger('tenstreet-extractcomplete');

Deno.serve(wrapHandler(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = {
    ...getCorsHeaders(origin),
    'Content-Type': 'text/xml; charset=utf-8'
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getServiceClient();
  logger.info('Received extractcomplete callback');

  // Only accept POST requests
  if (req.method !== 'POST') {
    logger.warn('Invalid method', { method: req.method });
    return new Response(
      createSOAPFault('Client', 'Only POST requests are accepted'),
      { status: 405, headers: corsHeaders }
    );
  }

  // Read SOAP XML payload
  const soapXml = await req.text();
  logger.info('Received payload', { length: soapXml.length });

  // Validate SOAP structure
  const validation = validateSOAPStructure(soapXml);
  if (!validation.valid) {
    logger.error('Invalid SOAP structure', null, { errors: validation.errors });
    return new Response(
      createSOAPFault('Client', `Invalid SOAP structure: ${validation.errors.join(', ')}`),
      { status: 400, headers: corsHeaders }
    );
  }

  // Parse SOAP envelope
  const envelope = parseSOAPEnvelope(soapXml);
  const extractData = parseTenstreetExtractComplete(envelope.body);

  logger.info('Parsed data', {
    packetId: extractData.packetId,
    driverId: extractData.driverId,
    status: extractData.status,
    hasExtractURL: !!extractData.extractURL
  });

    // Check for duplicate (idempotency)
    const { data: existingLog } = await supabase
      .from('tenstreet_webhook_logs')
      .select('id, processed')
      .eq('packet_id', extractData.packetId)
      .eq('processed', true)
      .single();

  if (existingLog) {
    logger.info('Duplicate webhook detected, already processed', { packetId: extractData.packetId });
    
    // Log duplicate attempt
      await supabase.from('tenstreet_webhook_logs').insert({
        packet_id: extractData.packetId,
        driver_id: extractData.driverId,
        soap_payload: soapXml,
        parsed_data: extractData,
        duplicate: true,
        processed: true
      });

    // Still return success (idempotent)
    return new Response(createSOAPResponse(true), { status: 200, headers: corsHeaders });
  }

  // Validate ClientId against organization credentials
  if (extractData.clientId) {
    const { data: credentials } = await supabase
      .from('tenstreet_credentials')
      .select('client_id, organization_id')
      .eq('client_id', extractData.clientId)
      .eq('status', 'active')
      .single();

    if (!credentials) {
      logger.error('Invalid ClientId', null, { clientId: extractData.clientId });
      return new Response(
        createSOAPFault('Client', 'Invalid or inactive ClientId'),
        { status: 401, headers: corsHeaders }
      );
    }

    // Find corresponding Xchange request
    const { data: xchangeRequest, error: findError } = await supabase
      .from('tenstreet_xchange_requests')
      .select('id, application_id, organization_id, status')
      .eq('tenstreet_request_id', extractData.packetId)
      .single();

    if (findError || !xchangeRequest) {
      logger.error('Xchange request not found', findError, { packetId: extractData.packetId });
      
      // Log webhook but don't fail
      await supabase.from('tenstreet_webhook_logs').insert({
        packet_id: extractData.packetId,
        driver_id: extractData.driverId,
        soap_payload: soapXml,
        parsed_data: extractData,
        organization_id: credentials.organization_id,
        processed: false,
        error: 'Xchange request not found in database'
      });

      return new Response(createSOAPResponse(true), { status: 200, headers: corsHeaders });
    }

    // Download extract file if URL provided
    let extractResults = null;
    if (extractData.extractURL && extractData.status === 'Complete') {
      try {
        logger.info('Downloading extract file', { url: extractData.extractURL });
        const extractResponse = await fetch(extractData.extractURL);
        if (extractResponse.ok) {
          const extractContent = await extractResponse.text();
          extractResults = { raw: extractContent, url: extractData.extractURL };
        }
      } catch (extractError) {
        logger.error('Failed to download extract file', extractError);
      }
    }

      // Update Xchange request status
      const updateData: any = {
        status: extractData.status === 'Complete' ? 'completed' : 'failed',
        completed_date: new Date().toISOString(),
        response_data: extractResults || { error: extractData.errorMessage },
        extract_url: extractData.extractURL,
        updated_at: new Date().toISOString()
      };

      if (extractData.errorMessage) {
        updateData.error_message = extractData.errorMessage;
      }

    const { error: updateError } = await supabase
      .from('tenstreet_xchange_requests')
      .update(updateData)
      .eq('id', xchangeRequest.id);

    if (updateError) {
      logger.error('Failed to update Xchange request', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    logger.info('Successfully updated Xchange request', { requestId: xchangeRequest.id });

    // Log successful webhook processing
    await supabase.from('tenstreet_webhook_logs').insert({
      packet_id: extractData.packetId,
      driver_id: extractData.driverId,
      soap_payload: soapXml,
      parsed_data: extractData,
      organization_id: credentials.organization_id,
      processed: true,
      duplicate: false
    });

    // Return SOAP success response
    return new Response(createSOAPResponse(true), { status: 200, headers: corsHeaders });

  } else {
    // No ClientId provided - log but accept
    logger.warn('No ClientId in webhook payload');
    
    await supabase.from('tenstreet_webhook_logs').insert({
      packet_id: extractData.packetId,
      driver_id: extractData.driverId,
      soap_payload: soapXml,
      parsed_data: extractData,
      processed: false,
      error: 'No ClientId provided in webhook'
    });

    return new Response(createSOAPResponse(true), { status: 200, headers: corsHeaders });
  }
}, { context: 'tenstreet-extractcomplete', logRequests: true }));
