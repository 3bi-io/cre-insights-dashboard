/**
 * SOAP Parser Utility
 * Handles SOAP 1.1 envelope parsing for Tenstreet webhook callbacks
 */

export interface SOAPEnvelope {
  body: any;
  header?: any;
}

export interface ExtractCompleteData {
  packetId: string;
  driverId: string;
  status: 'Complete' | 'Error';
  extractURL?: string;
  clientId?: string;
  errorMessage?: string;
}

/**
 * Parse SOAP 1.1 XML envelope
 */
export function parseSOAPEnvelope(xml: string): SOAPEnvelope {
  // Remove XML declaration and whitespace
  const cleanXml = xml.trim().replace(/<\?xml[^?]*\?>/i, '');
  
  // Extract SOAP Body
  const bodyMatch = cleanXml.match(/<(?:soap:|SOAP:)?Body[^>]*>([\s\S]*?)<\/(?:soap:|SOAP:)?Body>/i);
  if (!bodyMatch) {
    throw new Error('Invalid SOAP envelope: Body not found');
  }

  // Extract SOAP Header (optional)
  const headerMatch = cleanXml.match(/<(?:soap:|SOAP:)?Header[^>]*>([\s\S]*?)<\/(?:soap:|SOAP:)?Header>/i);

  return {
    body: bodyMatch[1],
    header: headerMatch ? headerMatch[1] : undefined
  };
}

/**
 * Extract tag value from XML
 */
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Parse Tenstreet extractcomplete SOAP body
 */
export function parseTenstreetExtractComplete(soapBody: string): ExtractCompleteData {
  // Extract fields from SOAP body
  const packetId = extractTag(soapBody, 'PacketId');
  const driverId = extractTag(soapBody, 'DriverId');
  const status = extractTag(soapBody, 'Status') as 'Complete' | 'Error';
  const extractURL = extractTag(soapBody, 'ExtractURL');
  const clientId = extractTag(soapBody, 'ClientId');
  const errorMessage = extractTag(soapBody, 'ErrorMessage');

  if (!packetId) {
    throw new Error('Missing required field: PacketId');
  }

  if (!driverId) {
    throw new Error('Missing required field: DriverId');
  }

  if (!status || (status !== 'Complete' && status !== 'Error')) {
    throw new Error('Invalid or missing Status field');
  }

  return {
    packetId,
    driverId,
    status,
    extractURL: extractURL || undefined,
    clientId: clientId || undefined,
    errorMessage: errorMessage || undefined
  };
}

/**
 * Validate SOAP structure
 */
export function validateSOAPStructure(xml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for SOAP envelope
  if (!/<(?:soap:|SOAP:)?Envelope/i.test(xml)) {
    errors.push('Missing SOAP Envelope');
  }

  // Check for SOAP body
  if (!/<(?:soap:|SOAP:)?Body/i.test(xml)) {
    errors.push('Missing SOAP Body');
  }

  // Check for balanced tags
  const openTags = xml.match(/<[^/][^>]*>/g) || [];
  const closeTags = xml.match(/<\/[^>]+>/g) || [];
  
  if (openTags.length !== closeTags.length) {
    errors.push('Unbalanced XML tags');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create SOAP fault response
 */
export function createSOAPFault(faultCode: string, faultString: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>${faultCode}</faultcode>
      <faultstring>${faultString}</faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;
}

/**
 * Create SOAP success response
 */
export function createSOAPResponse(acknowledged: boolean = true): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ExtractCompleteResponse>
      <Acknowledged>${acknowledged}</Acknowledged>
    </ExtractCompleteResponse>
  </soap:Body>
</soap:Envelope>`;
}
