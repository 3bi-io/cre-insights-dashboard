/**
 * Tenstreet XML Utilities
 * Provides robust XML building, parsing, and validation for Tenstreet API integration
 */

export interface TenstreetCredentials {
  client_id: string;
  password: string;
  mode: 'DEV' | 'TEST' | 'PROD';
  company_ids: string[];
  company_id?: string;
  account_name?: string;
}

export interface PersonalData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  prefix?: string;
  suffix?: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  dateOfBirth?: string;
  ssn?: string;
  governmentId?: string;
  governmentIdType?: string;
}

export interface XMLParseResult {
  success: boolean;
  errors: string[];
  driverId?: string;
  status?: string;
  applicants?: any[];
  rawResponse: string;
}

/**
 * Escape special XML characters
 */
export function escapeXML(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extract company_id from credentials
 */
export function getCompanyId(credentials: TenstreetCredentials): string {
  if (credentials.company_ids && Array.isArray(credentials.company_ids) && credentials.company_ids.length > 0) {
    return credentials.company_ids[0].toString();
  }
  
  if (credentials.company_id) {
    return credentials.company_id.toString();
  }
  
  throw new Error('No company_id found in credentials');
}

/**
 * Build authentication XML section
 */
export function buildAuthXML(credentials: TenstreetCredentials, service: string): string {
  return `<Authentication>
        <ClientId>${escapeXML(credentials.client_id)}</ClientId>
        <Password>${escapeXML(credentials.password)}</Password>
        <Service>${escapeXML(service)}</Service>
    </Authentication>
    <Mode>${escapeXML(credentials.mode)}</Mode>
    <CompanyId>${escapeXML(getCompanyId(credentials))}</CompanyId>`;
}

/**
 * Build complete Tenstreet XML request
 */
export function buildTenstreetXML(
  credentials: TenstreetCredentials,
  service: string,
  additionalContent: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
    ${buildAuthXML(credentials, service)}
    ${additionalContent}
</TenstreetData>`;
}

/**
 * Build personal data XML section
 */
export function buildPersonalDataXML(data: PersonalData): string {
  const parts: string[] = [];

  // PersonName section
  if (data.firstName || data.lastName) {
    const nameParts: string[] = [];
    if (data.prefix) nameParts.push(`<Prefix>${escapeXML(data.prefix)}</Prefix>`);
    if (data.firstName) nameParts.push(`<GivenName>${escapeXML(data.firstName)}</GivenName>`);
    if (data.middleName) nameParts.push(`<MiddleName>${escapeXML(data.middleName)}</MiddleName>`);
    if (data.lastName) nameParts.push(`<FamilyName>${escapeXML(data.lastName)}</FamilyName>`);
    if (data.suffix) nameParts.push(`<Affix>${escapeXML(data.suffix)}</Affix>`);
    
    parts.push(`<PersonName>
            ${nameParts.join('\n            ')}
        </PersonName>`);
  }

  // PostalAddress section
  if (data.city || data.state || data.zip) {
    const addressParts: string[] = [
      `<CountryCode>${escapeXML(data.country || 'US')}</CountryCode>`,
      `<Municipality>${escapeXML(data.city || '')}</Municipality>`,
      `<Region>${escapeXML(data.state || '')}</Region>`,
      `<PostalCode>${escapeXML(data.zip || '')}</PostalCode>`
    ];
    if (data.address1) addressParts.push(`<Address1>${escapeXML(data.address1)}</Address1>`);
    if (data.address2) addressParts.push(`<Address2>${escapeXML(data.address2)}</Address2>`);
    
    parts.push(`<PostalAddress>
            ${addressParts.join('\n            ')}
        </PostalAddress>`);
  }

  // GovernmentID section (PII - handle with care)
  if (data.ssn || data.governmentId) {
    parts.push(`<GovernmentID>
            <Value>${escapeXML(data.governmentId || data.ssn || '')}</Value>
            <CountryCode>US</CountryCode>
            <IssuingAuthority>${escapeXML(data.governmentIdType || 'SSN')}</IssuingAuthority>
            <DocumentType>${escapeXML(data.governmentIdType || 'SSN')}</DocumentType>
        </GovernmentID>`);
  }

  // DateOfBirth (PII)
  if (data.dateOfBirth) {
    parts.push(`<DateOfBirth>${escapeXML(data.dateOfBirth)}</DateOfBirth>`);
  }

  // ContactData section
  if (data.email || data.phone) {
    const contactParts: string[] = [
      `<InternetEmailAddress>${escapeXML(data.email || '')}</InternetEmailAddress>`
    ];
    if (data.phone) contactParts.push(`<PrimaryPhone>${escapeXML(data.phone)}</PrimaryPhone>`);
    if (data.secondaryPhone) contactParts.push(`<SecondaryPhone>${escapeXML(data.secondaryPhone)}</SecondaryPhone>`);
    
    parts.push(`<ContactData>
            ${contactParts.join('\n            ')}
        </ContactData>`);
  }

  if (parts.length === 0) return '';

  return `<PersonalData>
        ${parts.join('\n        ')}
    </PersonalData>`;
}

/**
 * Extract XML tag value with proper parsing
 */
export function extractXMLTag(xml: string, tag: string): string | null {
  // Try CDATA format first
  const cdataRegex = new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>`, 'is');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }

  // Try regular format
  const simpleRegex = new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, 'is');
  const simpleMatch = xml.match(simpleRegex);
  if (simpleMatch) {
    return simpleMatch[1].trim();
  }

  return null;
}

/**
 * Extract multiple XML tags (e.g., multiple applicants)
 */
export function extractXMLTags(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, 'gis');
  const matches = xml.matchAll(regex);
  const results: string[] = [];
  
  for (const match of matches) {
    results.push(match[1].trim());
  }
  
  return results;
}

/**
 * Parse Tenstreet API response
 */
export function parseXMLResponse(xml: string): XMLParseResult {
  const errors: string[] = [];
  
  // Extract errors
  const errorMatches = extractXMLTags(xml, 'Error');
  errors.push(...errorMatches);
  
  const errorMsgMatches = extractXMLTags(xml, 'ErrorMessage');
  errors.push(...errorMsgMatches);

  // Extract success indicators
  const driverId = extractXMLTag(xml, 'DriverId');
  const status = extractXMLTag(xml, 'Status');

  return {
    success: errors.length === 0,
    errors,
    driverId: driverId || undefined,
    status: status || undefined,
    rawResponse: xml
  };
}

/**
 * Parse applicant data from XML
 */
export function parseApplicantFromXML(applicantXml: string): any {
  return {
    driverId: extractXMLTag(applicantXml, 'DriverId'),
    firstName: extractXMLTag(applicantXml, 'GivenName'),
    lastName: extractXMLTag(applicantXml, 'FamilyName'),
    middleName: extractXMLTag(applicantXml, 'MiddleName'),
    email: extractXMLTag(applicantXml, 'InternetEmailAddress'),
    phone: extractXMLTag(applicantXml, 'PrimaryPhone'),
    secondaryPhone: extractXMLTag(applicantXml, 'SecondaryPhone'),
    city: extractXMLTag(applicantXml, 'Municipality'),
    state: extractXMLTag(applicantXml, 'Region'),
    zip: extractXMLTag(applicantXml, 'PostalCode'),
    status: extractXMLTag(applicantXml, 'Status'),
    dateOfBirth: extractXMLTag(applicantXml, 'DateOfBirth'),
    appliedAt: extractXMLTag(applicantXml, 'SubmitDate') || extractXMLTag(applicantXml, 'ApplicationDate')
  };
}

/**
 * Parse multiple applicants from search response
 */
export function parseApplicantsFromXML(xml: string): any[] {
  const applicants: any[] = [];
  
  // Try to extract Applicant or Subject blocks
  const applicantBlocks = extractXMLTags(xml, 'Applicant');
  if (applicantBlocks.length > 0) {
    for (const block of applicantBlocks) {
      applicants.push(parseApplicantFromXML(block));
    }
    return applicants;
  }

  // Try Subject blocks
  const subjectBlocks = extractXMLTags(xml, 'Subject');
  if (subjectBlocks.length > 0) {
    for (const block of subjectBlocks) {
      applicants.push(parseApplicantFromXML(block));
    }
    return applicants;
  }

  // Fallback: try to parse as single applicant
  const singleApplicant = parseApplicantFromXML(xml);
  if (singleApplicant.driverId) {
    applicants.push(singleApplicant);
  }

  return applicants;
}

/**
 * Validate XML structure before sending
 */
export function validateXMLStructure(xml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required root element
  if (!xml.includes('<TenstreetData>')) {
    errors.push('Missing <TenstreetData> root element');
  }

  // Check for required authentication
  if (!xml.includes('<Authentication>')) {
    errors.push('Missing <Authentication> section');
  }

  if (!xml.includes('<ClientId>')) {
    errors.push('Missing <ClientId> in authentication');
  }

  if (!xml.includes('<Password>')) {
    errors.push('Missing <Password> in authentication');
  }

  if (!xml.includes('<Service>')) {
    errors.push('Missing <Service> in authentication');
  }

  // Check for balanced tags (basic validation)
  const openTags = xml.match(/<[^/][^>]*>/g) || [];
  const closeTags = xml.match(/<\/[^>]*>/g) || [];
  
  if (openTags.length !== closeTags.length + 1) { // +1 for XML declaration
    errors.push('Unbalanced XML tags detected');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
