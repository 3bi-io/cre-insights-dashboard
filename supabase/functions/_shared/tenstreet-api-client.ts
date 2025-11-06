/**
 * Tenstreet API Client
 * Provides centralized API communication with retry logic, error handling, and logging
 */

import { buildTenstreetXML, parseXMLResponse, validateXMLStructure, type TenstreetCredentials, type XMLParseResult } from './tenstreet-xml-utils.ts';
import { sanitizeForLogging } from './tenstreet-pii-utils.ts';

export interface TenstreetAPIConfig {
  endpoint?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface TenstreetRequestOptions {
  service: string;
  xmlContent: string;
  maxRetries?: number;
  timeout?: number;
  validateBeforeSend?: boolean;
}

export interface TenstreetAPIResponse {
  success: boolean;
  status: number;
  data: XMLParseResult;
  requestXml?: string;
  responseXml: string;
  attempt: number;
  duration: number;
}

const DEFAULT_CONFIG: TenstreetAPIConfig = {
  endpoint: 'https://dashboard.tenstreet.com/post/',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000 // 1 second base delay
};

/**
 * Tenstreet API Client
 */
export class TenstreetAPIClient {
  private config: Required<TenstreetAPIConfig>;

  constructor(config?: TenstreetAPIConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<TenstreetAPIConfig>;
  }

  /**
   * Make a request to Tenstreet API with retry logic
   */
  async makeRequest(
    credentials: TenstreetCredentials,
    options: TenstreetRequestOptions
  ): Promise<TenstreetAPIResponse> {
    const startTime = Date.now();
    const maxRetries = options.maxRetries ?? this.config.maxRetries;
    const timeout = options.timeout ?? this.config.timeout;

    // Build complete XML
    const requestXml = buildTenstreetXML(credentials, options.service, options.xmlContent);

    // Validate XML structure if requested
    if (options.validateBeforeSend !== false) {
      const validation = validateXMLStructure(requestXml);
      if (!validation.valid) {
        throw new Error(`Invalid XML structure: ${validation.errors.join(', ')}`);
      }
    }

    // Log sanitized request (remove PII)
    console.log(`[Tenstreet API] Service: ${options.service}`);
    console.log(`[Tenstreet API] Request XML (sanitized):`, this.sanitizeXMLForLog(requestXml));

    let lastError: Error | null = null;

    // Retry loop with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Tenstreet API] Attempt ${attempt}/${maxRetries}`);

        // Make request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/xml',
          },
          body: requestXml,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();
        const duration = Date.now() - startTime;

        // Log sanitized response
        console.log(`[Tenstreet API] Response status: ${response.status}`);
        console.log(`[Tenstreet API] Response (sanitized):`, this.sanitizeXMLForLog(responseText));
        console.log(`[Tenstreet API] Duration: ${duration}ms`);

        // Parse response
        const parsed = parseXMLResponse(responseText);

        return {
          success: response.ok && parsed.success,
          status: response.status,
          data: parsed,
          requestXml: options.validateBeforeSend !== false ? undefined : requestXml, // Only include in debug mode
          responseXml: responseText,
          attempt,
          duration
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Tenstreet API] Attempt ${attempt} failed:`, lastError.message);

        // Don't retry on validation errors
        if (lastError.message.includes('Invalid XML') || lastError.message.includes('Validation')) {
          throw lastError;
        }

        // If this was the last attempt, throw
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        console.log(`[Tenstreet API] Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // All retries failed
    throw new Error(
      `Tenstreet API request failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Quick request wrapper for common services
   */
  async searchApplicants(
    credentials: TenstreetCredentials,
    criteria: { email?: string; phone?: string; lastName?: string; dateRange?: string }
  ): Promise<TenstreetAPIResponse> {
    const { email, phone, lastName, dateRange } = criteria;
    
    const searchXml = `<SearchCriteria>
        ${email ? `<Email>${this.escapeXML(email)}</Email>` : ''}
        ${phone ? `<Phone>${this.escapeXML(phone)}</Phone>` : ''}
        ${lastName ? `<LastName>${this.escapeXML(lastName)}</LastName>` : ''}
        ${dateRange ? `<DateRange>${this.escapeXML(dateRange)}</DateRange>` : ''}
    </SearchCriteria>`;

    return this.makeRequest(credentials, {
      service: 'subject_search',
      xmlContent: searchXml
    });
  }

  /**
   * Get applicant by driver ID
   */
  async getApplicant(
    credentials: TenstreetCredentials,
    driverId: string
  ): Promise<TenstreetAPIResponse> {
    const retrieveXml = `<DriverId>${this.escapeXML(driverId)}</DriverId>`;

    return this.makeRequest(credentials, {
      service: 'subject_retrieve',
      xmlContent: retrieveXml
    });
  }

  /**
   * Update applicant status
   */
  async updateStatus(
    credentials: TenstreetCredentials,
    driverId: string,
    status: string,
    statusTag?: string
  ): Promise<TenstreetAPIResponse> {
    const statusXml = `<DriverId>${this.escapeXML(driverId)}</DriverId>
    <Status>${this.escapeXML(status)}</Status>
    ${statusTag ? `<StatusTag>${this.escapeXML(statusTag)}</StatusTag>` : ''}`;

    return this.makeRequest(credentials, {
      service: 'status_update',
      xmlContent: statusXml
    });
  }

  /**
   * Helper: XML escape
   */
  private escapeXML(unsafe: string): string {
    if (!unsafe) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Helper: Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper: Sanitize XML for logging (remove PII)
   */
  private sanitizeXMLForLog(xml: string): string {
    let sanitized = xml;

    // Redact sensitive XML tags
    const sensitiveTagsToRedact = [
      'Password',
      'SSN',
      'SocialSecurityNumber',
      'GovernmentID',
      'Value', // Inside GovernmentID
      'DateOfBirth'
    ];

    for (const tag of sensitiveTagsToRedact) {
      const regex = new RegExp(`<${tag}>(.*?)<\\/${tag}>`, 'gi');
      sanitized = sanitized.replace(regex, `<${tag}>[REDACTED]</${tag}>`);
    }

    // Partially mask email and phone
    sanitized = sanitized.replace(
      /<InternetEmailAddress>(.*?)@(.*?)<\/InternetEmailAddress>/gi,
      (match, local, domain) => {
        const maskedLocal = local.length > 2 ? local.slice(0, 2) + '***' : '***';
        return `<InternetEmailAddress>${maskedLocal}@${domain}</InternetEmailAddress>`;
      }
    );

    sanitized = sanitized.replace(
      /<(?:PrimaryPhone|SecondaryPhone)>(.*?)<\/(?:PrimaryPhone|SecondaryPhone)>/gi,
      (match, phone) => {
        const cleaned = phone.replace(/\D/g, '');
        const masked = cleaned.length > 4 ? '***-***-' + cleaned.slice(-4) : '***-***-****';
        return match.replace(phone, masked);
      }
    );

    return sanitized;
  }
}

/**
 * Create a singleton instance
 */
let clientInstance: TenstreetAPIClient | null = null;

export function getTenstreetAPIClient(config?: TenstreetAPIConfig): TenstreetAPIClient {
  if (!clientInstance) {
    clientInstance = new TenstreetAPIClient(config);
  }
  return clientInstance;
}
