/**
 * Tenstreet Xchange Request Handler
 * Handles MVR, drug tests, employment verification, and background checks
 */

import { corsHeaders } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { enforceAuth } from '../_shared/serverAuth.ts';

const XCHANGE_SERVICE_TYPES = {
  mvr: 'MVR',
  drug: 'DrugTest',
  employment: 'EmploymentVerification',
  background: 'BackgroundCheck'
} as const;

type ServiceType = keyof typeof XCHANGE_SERVICE_TYPES;

interface XchangeRequest {
  applicationId: string;
  serviceType: ServiceType;
  driverId?: string;
  urgency?: 'standard' | 'rush';
  additionalData?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authContext = await enforceAuth(req, 'user');
    if (authContext instanceof Response) return authContext;

    const supabase = getServiceClient();
    const { applicationId, serviceType, driverId, urgency = 'standard', additionalData } = await req.json() as XchangeRequest;

    // Validate input
    if (!applicationId || !serviceType) {
      return validationErrorResponse('applicationId and serviceType are required');
    }

    if (!Object.keys(XCHANGE_SERVICE_TYPES).includes(serviceType)) {
      return validationErrorResponse(`Invalid serviceType. Must be one of: ${Object.keys(XCHANGE_SERVICE_TYPES).join(', ')}`);
    }

    // Get application data
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*, job_listings!inner(organization_id)')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return errorResponse('Application not found', 404);
    }

    // Verify user has access to this organization
    if (authContext.organizationId !== application.job_listings.organization_id) {
      return errorResponse('Unauthorized access to this application', 403);
    }

    // Get organization's Tenstreet credentials
    const { data: credentials, error: credError } = await supabase
      .from('tenstreet_credentials')
      .select('*')
      .eq('organization_id', application.job_listings.organization_id)
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      return errorResponse('Tenstreet credentials not configured for this organization', 400);
    }

    // Build XML request for Tenstreet API
    const xmlPayload = buildXchangeXML({
      credentials,
      application,
      serviceType: XCHANGE_SERVICE_TYPES[serviceType],
      driverId: driverId || application.id,
      urgency,
      additionalData
    });

    console.log(`Sending ${serviceType} request to Tenstreet for application ${applicationId}`);

    // Call Tenstreet Xchange API
    const tenstreetResponse = await fetch(credentials.api_endpoint || 'https://gateway.tenstreet.com/xchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Authorization': `Bearer ${credentials.api_key}`
      },
      body: xmlPayload
    });

    const responseText = await tenstreetResponse.text();
    const parsedResponse = parseXchangeResponse(responseText);

    // Calculate cost (example pricing)
    const costMap = {
      mvr: 2500, // $25.00
      drug: 4500, // $45.00
      employment: 1500, // $15.00
      background: 3500 // $35.00
    };

    // Log the request to database
    const { data: xchangeRequest, error: logError } = await supabase
      .from('tenstreet_xchange_requests')
      .insert({
        application_id: applicationId,
        organization_id: application.job_listings.organization_id,
        service_type: serviceType,
        driver_id: driverId || application.id,
        status: parsedResponse.success ? 'pending' : 'failed',
        request_date: new Date().toISOString(),
        cost_cents: costMap[serviceType],
        request_payload: xmlPayload,
        response_payload: responseText,
        tenstreet_request_id: parsedResponse.requestId
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to log Xchange request:', logError);
    }

    if (!parsedResponse.success) {
      return errorResponse(parsedResponse.error || 'Tenstreet API request failed', 500);
    }

    return successResponse({
      requestId: xchangeRequest?.id,
      tenstreetRequestId: parsedResponse.requestId,
      status: 'pending',
      serviceType,
      estimatedCompletionTime: parsedResponse.estimatedCompletion,
      cost: costMap[serviceType] / 100 // Convert to dollars
    }, 'Xchange request submitted successfully');

  } catch (error) {
    console.error('Error in tenstreet-xchange function:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});

function buildXchangeXML(params: {
  credentials: any;
  application: any;
  serviceType: string;
  driverId: string;
  urgency: string;
  additionalData?: Record<string, any>;
}): string {
  const { credentials, application, serviceType, driverId, urgency } = params;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<XchangeRequest>
  <Authentication>
    <ClientId>${credentials.client_id}</ClientId>
    <ApiKey>${credentials.api_key}</ApiKey>
  </Authentication>
  <Request>
    <ServiceType>${serviceType}</ServiceType>
    <DriverId>${driverId}</DriverId>
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
  </Request>
</XchangeRequest>`;
}

function parseXchangeResponse(xmlResponse: string): {
  success: boolean;
  requestId?: string;
  estimatedCompletion?: string;
  error?: string;
} {
  try {
    // Simple XML parsing (in production, use a proper XML parser)
    const requestIdMatch = xmlResponse.match(/<RequestId>([^<]+)<\/RequestId>/);
    const statusMatch = xmlResponse.match(/<Status>([^<]+)<\/Status>/);
    const errorMatch = xmlResponse.match(/<Error>([^<]+)<\/Error>/);
    const estimatedMatch = xmlResponse.match(/<EstimatedCompletion>([^<]+)<\/EstimatedCompletion>/);

    if (errorMatch) {
      return {
        success: false,
        error: errorMatch[1]
      };
    }

    return {
      success: statusMatch?.[1] !== 'Error',
      requestId: requestIdMatch?.[1],
      estimatedCompletion: estimatedMatch?.[1]
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse Tenstreet response'
    };
  }
}
