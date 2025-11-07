/**
 * Tenstreet Xchange Request Handler
 * Handles MVR, drug tests, employment verification, and background checks
 * 
 * REFACTORED: Now uses shared utilities for:
 * - Credential fetching (tenstreet-credentials.ts)
 * - API client with retry logic (tenstreet-api-client.ts)
 * - XML building/parsing (tenstreet-xml-utils.ts)
 * - PII sanitization (tenstreet-pii-utils.ts)
 */

import { getCorsHeaders } from '../_shared/cors-config.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { enforceAuth } from '../_shared/serverAuth.ts';
import { fetchTenstreetCredentials } from '../_shared/tenstreet-credentials.ts';
import { getTenstreetAPIClient } from '../_shared/tenstreet-api-client.ts';
import { parseXMLResponse } from '../_shared/tenstreet-xml-utils.ts';
import { sanitizeForLogging } from '../_shared/tenstreet-pii-utils.ts';

const XCHANGE_SERVICE_TYPES = {
  mvr: 'MVR',
  drug_test: 'DrugTest',
  drug: 'DrugTest',
  employment_verification: 'EmploymentVerification',
  employment: 'EmploymentVerification',
  criminal_background: 'BackgroundCheck',
  background: 'BackgroundCheck'
} as const;

type ServiceType = keyof typeof XCHANGE_SERVICE_TYPES;

interface XchangeRequest {
  applicationId: string;
  serviceType?: ServiceType;
  requestType?: ServiceType; // New field name
  driverId?: string;
  urgency?: 'standard' | 'rush';
  additionalData?: Record<string, any>;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    // Authenticate user
    const authContext = await enforceAuth(req, 'user');
    if (authContext instanceof Response) return authContext;

    const supabase = getServiceClient();
    const { applicationId, serviceType, requestType, driverId, urgency = 'standard', additionalData } = await req.json() as XchangeRequest;

    // Support both 'serviceType' (legacy) and 'requestType' (new)
    const actualRequestType = requestType || serviceType;

    // Validate input
    if (!applicationId || !actualRequestType) {
      return validationErrorResponse('applicationId and requestType are required');
    }

    if (!Object.keys(XCHANGE_SERVICE_TYPES).includes(actualRequestType)) {
      return validationErrorResponse(`Invalid requestType. Must be one of: ${Object.keys(XCHANGE_SERVICE_TYPES).join(', ')}`);
    }

    console.log(`[Xchange] Processing ${actualRequestType} request for application ${applicationId}`);

    // Get application data (basic info only, no PII in logs)
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, driver_id, first_name, last_name, applicant_email, phone, date_of_birth, ssn, address_1, city, state, zip, job_listings!inner(organization_id)')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.error('[Xchange] Application not found:', applicationId);
      return errorResponse('Application not found', 404);
    }

    const organizationId = application.job_listings.organization_id;

    // Verify user has access to this organization
    if (authContext.organizationId !== organizationId) {
      console.error('[Xchange] Unauthorized access attempt by user:', authContext.user.id);
      return errorResponse('Unauthorized access to this application', 403);
    }

    // Fetch Tenstreet credentials using shared utility (with security checks)
    const credentials = await fetchTenstreetCredentials(supabase, {
      organizationId,
      userId: authContext.user.id,
      userRole: authContext.role
    });

    if (!credentials) {
      console.error('[Xchange] No active Tenstreet credentials found for org:', organizationId);
      return errorResponse('Tenstreet credentials not configured for this organization', 400);
    }

    // Use API client with retry logic and timeout
    const apiClient = getTenstreetAPIClient({
      timeout: 30000,
      maxRetries: 2
    });

    // Build Xchange-specific XML content
    const xchangeServiceType = XCHANGE_SERVICE_TYPES[actualRequestType];
    const xchangeContent = `
      <ServiceType>${xchangeServiceType}</ServiceType>
      <DriverId>${driverId || application.driver_id || application.id}</DriverId>
      <Urgency>${urgency}</Urgency>
      <Applicant>
        <FirstName>${application.first_name || ''}</FirstName>
        <LastName>${application.last_name || ''}</LastName>
        <Email>${application.applicant_email || ''}</Email>
        <Phone>${application.phone || ''}</Phone>
        <DateOfBirth>${application.date_of_birth || ''}</DateOfBirth>
        <SSN>${application.ssn || ''}</SSN>
        <Address>
          <Street>${application.address_1 || ''}</Street>
          <City>${application.city || ''}</City>
          <State>${application.state || ''}</State>
          <Zip>${application.zip || ''}</Zip>
        </Address>
      </Applicant>
    `;

    console.log(`[Xchange] Sending ${xchangeServiceType} request to Tenstreet API`);

    // Make API request with automatic retry and timeout
    const apiResponse = await apiClient.makeRequest(credentials, {
      service: 'xchange',
      xmlContent: xchangeContent,
      timeout: 30000
    });

    if (!apiResponse.success) {
      console.error('[Xchange] API request failed:', sanitizeForLogging(apiResponse.error));
      throw new Error(apiResponse.error || 'Tenstreet API request failed');
    }

    // Parse response using shared utility
    const parsedResponse = parseXMLResponse(apiResponse.data);

    // Calculate cost (example pricing in cents)
    const costMap: Record<string, number> = {
      mvr: 2500, // $25.00
      drug_test: 4500, // $45.00
      drug: 4500,
      employment_verification: 1500, // $15.00
      employment: 1500,
      criminal_background: 3500, // $35.00
      background: 3500
    };

    // Log the request to database (with PII sanitization for logs)
    const { data: xchangeRequest, error: logError } = await supabase
      .from('tenstreet_xchange_requests')
      .insert({
        application_id: applicationId,
        request_type: actualRequestType,
        status: parsedResponse.success ? 'pending' : 'failed',
        tenstreet_request_id: parsedResponse.requestId,
        response_data: sanitizeForLogging(parsedResponse),
        cost_cents: costMap[actualRequestType],
        error_message: parsedResponse.error,
        requested_by: authContext.user.id,
        request_date: new Date().toISOString(),
        api_type: 'soap'
      })
      .select()
      .single();

    if (logError) {
      console.error('[Xchange] Failed to log request:', sanitizeForLogging(logError));
    }

    if (!parsedResponse.success) {
      return errorResponse(parsedResponse.error || 'Tenstreet API request failed', 500);
    }

    console.log('[Xchange] Request successful:', {
      requestId: xchangeRequest?.id,
      tenstreetRequestId: parsedResponse.requestId,
      service: xchangeServiceType
    });

    return successResponse({
      requestId: xchangeRequest?.id,
      tenstreetRequestId: parsedResponse.requestId,
      status: 'pending',
      serviceType: actualRequestType,
      cost: costMap[actualRequestType] / 100, // Convert to dollars
      message: `${xchangeServiceType} request submitted successfully. Results will be delivered via webhook when complete.`
    }, 'Xchange request submitted successfully');

  } catch (error) {
    console.error('[Xchange] Error:', sanitizeForLogging(error));
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
