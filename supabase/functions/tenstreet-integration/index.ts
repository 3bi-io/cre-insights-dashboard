import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { getCorsHeaders } from '../_shared/cors-config.ts'
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts'
import { createLogger } from '../_shared/logger.ts'
import { checkRateLimitWithGeo } from '../_shared/rate-limiter.ts'

const logger = createLogger('tenstreet-integration');

// Validation schemas
const tenstreetActionSchema = z.enum(['send_application', 'test_connection', 'sync_applicant']);

const tenstreetConfigSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  password: z.string().min(1, 'Password is required'),
  mode: z.enum(['PROD', 'TEST']),
  service: z.string().optional(),
  source: z.string().optional(),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  appReferrer: z.string().optional(),
  jobId: z.string().optional(),
  statusTag: z.string().optional(),
  driverId: z.string().optional(),
});

const tenstreetRequestSchema = z.object({
  action: tenstreetActionSchema,
  config: tenstreetConfigSchema.optional(),
  applicationData: z.record(z.any()).optional(),
  mappings: z.record(z.any()).optional(),
  phone: z.string().optional(),
});

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting with geo-awareness for developer regions
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const rateLimitResult = await checkRateLimitWithGeo(req, `tenstreet:${ip}`, {
      maxRequests: 30,
      windowMs: 60000, // 30 requests per minute (150/min for DFW/Alabama devs)
    });

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { 
        ip, 
        geoApplied: rateLimitResult.geoApplied,
        effectiveLimit: rateLimitResult.effectiveMaxRequests
      });
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const rawBody = await req.json();
    
    // Validate request
    const validationResult = tenstreetRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message
      }));
      logger.warn('Validation failed', { errors });
      return validationErrorResponse(errors, origin || undefined);
    }

    const { action, ...data } = validationResult.data;
    logger.info('Processing action', { action });

    switch (action) {
      case 'send_application':
        return await handleSendApplication(data, corsHeaders, origin);
      case 'test_connection':
        return await handleTestConnection(data, corsHeaders, origin);
      case 'sync_applicant':
        return await handleSyncApplicant(data, corsHeaders, origin);
      default:
        return errorResponse('Invalid action', 400, undefined, origin || undefined);
    }
  } catch (error) {
    const err = error as Error;
    logger.error('Error in tenstreet-integration function', err);
    return errorResponse('Internal server error', 500, undefined, req.headers.get('origin') || undefined);
  }
});

async function handleSendApplication(
  data: Record<string, unknown>, 
  corsHeaders: Record<string, string>,
  origin: string | null
) {
  try {
    const { applicationData, mappings, config } = data as {
      applicationData: Record<string, unknown>;
      mappings: Record<string, unknown>;
      config: Record<string, unknown>;
    };

    if (!config || !applicationData) {
      return errorResponse('Missing config or applicationData', 400, undefined, origin || undefined);
    }

    // Build Tenstreet XML payload
    const xmlPayload = buildTenstreetXML(applicationData, mappings, config);

    logger.info('Sending application to Tenstreet', { 
      email: (applicationData.applicant_email as string)?.slice(0, 3) + '***' 
    });

    // Send to Tenstreet API
    const startTime = Date.now();
    const response = await fetch('https://dashboard.tenstreet.com/post/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xmlPayload
    });

    const responseText = await response.text();
    const duration = Date.now() - startTime;
    
    logger.info('Tenstreet response', { status: response.status, duration_ms: duration });

    if (!response.ok) {
      return errorResponse(`Tenstreet API error: ${response.status}`, response.status, { response: responseText }, origin || undefined);
    }

    return successResponse(
      { response: responseText },
      'Application sent to Tenstreet successfully',
      { duration_ms: duration },
      origin || undefined
    );
  } catch (error) {
    const err = error as Error;
    logger.error('Error sending to Tenstreet', err);
    return errorResponse(err.message, 500, undefined, origin || undefined);
  }
}

async function handleTestConnection(
  data: Record<string, unknown>, 
  corsHeaders: Record<string, string>,
  origin: string | null
) {
  try {
    const { config } = data as { config: Record<string, string> };
    const TIMEOUT_MS = 10000;

    if (!config?.clientId || !config?.password || !config?.mode) {
      return validationErrorResponse('Missing required configuration: clientId, password, or mode', origin || undefined);
    }

    const testXML = buildTestXML(config);
    logger.info('Testing Tenstreet connection', { client_id: config.clientId });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const startTime = Date.now();
    const response = await fetch('https://dashboard.tenstreet.com/post/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: testXML,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseText = await response.text();
    const duration = Date.now() - startTime;
    
    logger.info('Tenstreet test response', { status: response.status, success: response.ok, duration_ms: duration });

    return successResponse(
      { 
        success: response.ok, 
        status: response.status,
        response: responseText 
      },
      response.ok ? 'Connection successful' : 'Connection failed',
      { duration_ms: duration },
      origin || undefined
    );
  } catch (error) {
    const err = error as Error;
    const isTimeout = err.name === 'AbortError';
    
    logger.error('Connection test failed', err, { isTimeout });
    
    const message = isTimeout 
      ? 'Connection timeout - Tenstreet API did not respond within 10 seconds'
      : err.message;
      
    return errorResponse(message, 500, undefined, origin || undefined);
  }
}

async function handleSyncApplicant(
  data: Record<string, unknown>, 
  corsHeaders: Record<string, string>,
  origin: string | null
) {
  try {
    const { phone } = data as { phone: string };
    
    if (!phone) {
      return validationErrorResponse('Phone number is required', origin || undefined);
    }

    logger.info('Syncing applicant', { phone: phone.slice(0, -4) + '****' });

    // Mock sync functionality - in real implementation, this would query Tenstreet API
    const mockData = {
      found: true,
      applicantData: {
        driverId: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: phone,
        cdlClass: 'A',
        experienceMonths: '24',
        veteranStatus: 'No'
      }
    };

    return successResponse(mockData, 'Applicant synced', undefined, origin || undefined);
  } catch (error) {
    const err = error as Error;
    logger.error('Error syncing applicant', err);
    return errorResponse(err.message, 500, undefined, origin || undefined);
  }
}

// Helper function to safely get field value from application data
function getFieldValue(applicationData: Record<string, unknown>, fieldName: string): string {
  if (!fieldName || !applicationData) return '';
  
  // Handle nested field access
  if (fieldName.includes('.')) {
    const parts = fieldName.split('.');
    let value: unknown = applicationData;
    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part];
      if (value === undefined || value === null) return '';
    }
    return String(value);
  }
  
  const value = applicationData[fieldName];
  if (value === undefined || value === null) return '';
  return String(value);
}

// Helper function to format phone number (XXX-XXX-XXXX format)
function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

// Helper function to format date (MM/DD/YYYY format for PersonalData)
function formatDateMMDDYYYY(dateValue: string): string {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue;
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return dateValue;
  }
}

// Helper function to format date (YYYY-MM-DD format for Licenses)
function formatDateYYYYMMDD(dateValue: string): string {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateValue;
  }
}

// Helper function to format SSN (XXX-XX-XXXX format)
function formatSSN(ssn: string): string {
  if (!ssn) return '';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  return ssn;
}

// Helper function to escape XML special characters
function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper function to format email with mailto: prefix per Tenstreet schema
function formatEmail(email: string): string {
  if (!email) return '';
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail.startsWith('mailto:')) return cleanEmail;
  return `mailto:${cleanEmail}`;
}

// Helper function to normalize yes/no values
function normalizeYesNo(value: string): 'y' | 'n' {
  if (!value) return 'n';
  const lower = value.toLowerCase().trim();
  return ['yes', 'y', 'true', '1'].includes(lower) ? 'y' : 'n';
}

// Map CDL endorsements from application data to Tenstreet endorsement format
function mapEndorsements(endorsements: unknown): string[] {
  if (!endorsements) return [];
  
  // Handle array of endorsements
  const endorsementList = Array.isArray(endorsements) 
    ? endorsements 
    : typeof endorsements === 'string' 
      ? endorsements.split(',').map(e => e.trim())
      : [];
  
  // Map to Tenstreet endorsement names
  const endorsementMap: Record<string, string> = {
    't': 'tanker',
    'tanker': 'tanker',
    'n': 'tanker',
    'x': 'xendorsement',
    'xendorsement': 'xendorsement',
    'combination': 'xendorsement',
    'h': 'hazmat',
    'hazmat': 'hazmat',
    'doubles': 'doublestriples',
    'triples': 'doublestriples',
    'doublestriples': 'doublestriples',
    'doubles/triples': 'doublestriples',
    'p': 'passenger',
    'passenger': 'passenger',
    's': 'schoolbus',
    'schoolbus': 'schoolbus',
    'school bus': 'schoolbus',
  };
  
  return endorsementList
    .map(e => endorsementMap[String(e).toLowerCase()] || 'other')
    .filter((e, i, arr) => arr.indexOf(e) === i); // Deduplicate
}

// Build comprehensive test XML matching official Tenstreet schema
function buildTestXML(config: Record<string, string>): string {
  logger.debug('Building test XML', { client_id: config.clientId });
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(config.clientId)}</ClientId>
        <Password><![CDATA[${config.password}]]></Password>
        <Service>${escapeXML(config.service || 'subject_upload')}</Service>
    </Authentication>
    <Mode>${escapeXML(config.mode || 'DEV')}</Mode>
    <Source>${escapeXML(config.source || '')}</Source>
    <CompanyId>${escapeXML(config.companyId || '')}</CompanyId>
    <CompanyName>${escapeXML(config.companyName || '')}</CompanyName>
    <DriverId>TEST123456</DriverId>
    <PersonalData>
        <PersonName>
            <Prefix></Prefix>
            <GivenName>Test</GivenName>
            <MiddleName>Q</MiddleName>
            <FamilyName>Connection</FamilyName>
            <Affix></Affix>
        </PersonName>
        <PostalAddress>
            <CountryCode>US</CountryCode>
            <Municipality>Tulsa</Municipality>
            <Region>OK</Region>
            <PostalCode>74135</PostalCode>
            <Address1>123 Test Street</Address1>
            <Address2></Address2>
        </PostalAddress>
        <GovernmentID countryCode="US" issuingAuthority="SSA" documentType="SSN">123-45-6789</GovernmentID>
        <DateOfBirth>01/01/1990</DateOfBirth>
        <ContactData PreferredMethod="PrimaryPhone">
            <InternetEmailAddress>mailto:test@example.com</InternetEmailAddress>
            <PrimaryPhone>918-123-4567</PrimaryPhone>
            <SecondaryPhone>918-555-9876</SecondaryPhone>
        </ContactData>
    </PersonalData>
    <ApplicationData>
        <AppReferrer>${escapeXML(config.appReferrer || 'TestConnection')}</AppReferrer>
        <Licenses>
            <License>
                <CurrentLicense>y</CurrentLicense>
                <LicenseNumber>TEST123</LicenseNumber>
                <ExpirationDate>2025-12-31</ExpirationDate>
                <Region>OK</Region>
                <CountryCode>US</CountryCode>
                <CommercialDriversLicense>y</CommercialDriversLicense>
                <LicenseClass>Class A</LicenseClass>
                <Endorsements>
                    <Endorsement>tanker</Endorsement>
                    <Endorsement>hazmat</Endorsement>
                </Endorsements>
            </License>
        </Licenses>
        <DisplayFields>
            <DisplayField>
                <DisplayPrompt>Test Field</DisplayPrompt>
                <DisplayValue>Test Value</DisplayValue>
            </DisplayField>
        </DisplayFields>
    </ApplicationData>
</TenstreetData>`;
}

// Build comprehensive Tenstreet XML matching official schema
function buildTenstreetXML(
  applicationData: Record<string, unknown>, 
  mappings: Record<string, unknown>, 
  config: Record<string, unknown>
): string {
  const personalData = (mappings?.personalData || {}) as Record<string, string>;
  const licenseMappings = (mappings?.license || {}) as Record<string, string>;
  const displayFields = mappings?.displayFields as Array<{ mapping: string; displayPrompt: string }> | undefined;

  // === PersonName Section ===
  const prefix = escapeXML(getFieldValue(applicationData, personalData?.prefix || 'prefix'));
  const givenName = escapeXML(getFieldValue(applicationData, personalData?.givenName || 'first_name'));
  const middleName = escapeXML(getFieldValue(applicationData, personalData?.middleName || 'middle_name'));
  const familyName = escapeXML(getFieldValue(applicationData, personalData?.familyName || 'last_name'));
  const affix = escapeXML(getFieldValue(applicationData, personalData?.affix || 'suffix'));

  const personNameXML = `
        <PersonName>
            <Prefix>${prefix}</Prefix>
            <GivenName>${givenName}</GivenName>
            <MiddleName>${middleName}</MiddleName>
            <FamilyName>${familyName}</FamilyName>
            <Affix>${affix}</Affix>
        </PersonName>`;

  // === PostalAddress Section ===
  const countryCode = escapeXML(getFieldValue(applicationData, personalData?.countryCode || 'country')) || 'US';
  const municipality = escapeXML(getFieldValue(applicationData, personalData?.municipality || 'city'));
  const region = escapeXML(getFieldValue(applicationData, personalData?.region || 'state'));
  const postalCode = escapeXML(getFieldValue(applicationData, personalData?.postalCode || 'zip'));
  const address1 = escapeXML(getFieldValue(applicationData, personalData?.address1 || 'address_1'));
  const address2 = escapeXML(getFieldValue(applicationData, personalData?.address2 || 'address_2'));

  const postalAddressXML = `
        <PostalAddress>
            <CountryCode>${countryCode}</CountryCode>
            <Municipality>${municipality}</Municipality>
            <Region>${region}</Region>
            <PostalCode>${postalCode}</PostalCode>
            <Address1>${address1}</Address1>
            <Address2>${address2}</Address2>
        </PostalAddress>`;

  // === GovernmentID Section (optional) ===
  const governmentIdValue = getFieldValue(applicationData, personalData?.governmentId || 'ssn');
  const governmentIdXML = governmentIdValue 
    ? `
        <GovernmentID countryCode="US" issuingAuthority="SSA" documentType="SSN">${formatSSN(governmentIdValue)}</GovernmentID>` 
    : '';

  // === DateOfBirth Section (optional) ===
  const dateOfBirth = formatDateMMDDYYYY(getFieldValue(applicationData, personalData?.dateOfBirth || 'date_of_birth'));
  const dateOfBirthXML = dateOfBirth 
    ? `
        <DateOfBirth>${dateOfBirth}</DateOfBirth>` 
    : '';

  // === ContactData Section ===
  const email = formatEmail(getFieldValue(applicationData, personalData?.internetEmailAddress || 'applicant_email'));
  const primaryPhone = formatPhoneNumber(getFieldValue(applicationData, personalData?.primaryPhone || 'phone'));
  const secondaryPhone = formatPhoneNumber(getFieldValue(applicationData, personalData?.secondaryPhone || 'secondary_phone'));
  const preferredMethod = getFieldValue(applicationData, personalData?.preferredMethod || 'preferred_contact_method') || 'PrimaryPhone';
  
  const contactDataXML = `
        <ContactData PreferredMethod="${escapeXML(preferredMethod)}">
            <InternetEmailAddress>${escapeXML(email)}</InternetEmailAddress>
            <PrimaryPhone>${primaryPhone}</PrimaryPhone>
            <SecondaryPhone>${secondaryPhone}</SecondaryPhone>
        </ContactData>`;

  // === Licenses Section (NEW - per official schema) ===
  const hasCDL = normalizeYesNo(getFieldValue(applicationData, licenseMappings?.commercialDriversLicense || 'cdl'));
  const cdlClass = escapeXML(getFieldValue(applicationData, licenseMappings?.licenseClass || 'cdl_class'));
  const cdlState = escapeXML(getFieldValue(applicationData, licenseMappings?.region || 'cdl_state'));
  const cdlExpiration = formatDateYYYYMMDD(getFieldValue(applicationData, licenseMappings?.expirationDate || 'cdl_expiration_date'));
  const cdlNumber = escapeXML(getFieldValue(applicationData, licenseMappings?.licenseNumber || ''));
  const endorsements = mapEndorsements(applicationData[licenseMappings?.endorsements || 'cdl_endorsements']);

  // Build endorsements XML
  const endorsementsXML = endorsements.length > 0 
    ? `
                <Endorsements>
${endorsements.map(e => `                    <Endorsement>${e}</Endorsement>`).join('\n')}
                </Endorsements>`
    : '';

  // Build license XML (only if CDL info exists)
  const licensesXML = hasCDL === 'y' || cdlClass 
    ? `
        <Licenses>
            <License>
                <CurrentLicense>${hasCDL}</CurrentLicense>
                ${cdlNumber ? `<LicenseNumber>${cdlNumber}</LicenseNumber>` : ''}
                ${cdlExpiration ? `<ExpirationDate>${cdlExpiration}</ExpirationDate>` : ''}
                <Region>${cdlState || region}</Region>
                <CountryCode>US</CountryCode>
                <CommercialDriversLicense>${hasCDL}</CommercialDriversLicense>
                ${cdlClass ? `<LicenseClass>${cdlClass}</LicenseClass>` : ''}${endorsementsXML}
            </License>
        </Licenses>`
    : '';

  // === DisplayFields Section ===
  const displayFieldsXML = displayFields && Array.isArray(displayFields)
    ? displayFields
        .filter((f) => f.mapping && f.displayPrompt && getFieldValue(applicationData, f.mapping))
        .map((f) => `
            <DisplayField>
                <DisplayPrompt>${escapeXML(f.displayPrompt)}</DisplayPrompt>
                <DisplayValue>${escapeXML(getFieldValue(applicationData, f.mapping))}</DisplayValue>
            </DisplayField>`)
        .join('')
    : '';

  // === Build DriverId ===
  const driverId = (config.driverId as string) || getFieldValue(applicationData, 'driver_id') || getFieldValue(applicationData, 'id');
  const driverIdXML = driverId 
    ? `
    <DriverId>${escapeXML(driverId)}</DriverId>` 
    : '';

  // === Final XML Assembly (matching official Tenstreet schema) ===
  return `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    <Authentication>
        <ClientId>${escapeXML(config.clientId as string)}</ClientId>
        <Password><![CDATA[${config.password}]]></Password>
        <Service>${escapeXML((config.service as string) || 'subject_upload')}</Service>
    </Authentication>
    <Mode>${escapeXML((config.mode as string) || 'DEV')}</Mode>
    <Source>${escapeXML((config.source as string) || '')}</Source>
    <CompanyId>${escapeXML((config.companyId as string) || '')}</CompanyId>
    <CompanyName>${escapeXML((config.companyName as string) || '')}</CompanyName>${driverIdXML}
    <PersonalData>${personNameXML}${postalAddressXML}${governmentIdXML}${dateOfBirthXML}${contactDataXML}
    </PersonalData>
    <ApplicationData>
        <AppReferrer>${escapeXML((config.appReferrer as string) || '')}</AppReferrer>
        <StatusTag>${escapeXML((config.statusTag as string) || 'New')}</StatusTag>${licensesXML}
        <DisplayFields>${displayFieldsXML}
        </DisplayFields>
    </ApplicationData>
</TenstreetData>`;
}
