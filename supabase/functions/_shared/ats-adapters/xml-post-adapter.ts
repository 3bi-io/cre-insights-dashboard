/**
 * XML POST Adapter
 * For ATS systems that use XML-based APIs (e.g., Tenstreet)
 * Enhanced with retry logic, comprehensive XML building, and better error handling
 */

import { BaseATSAdapter } from './base-adapter.ts';
import type { ApplicationData, ATSResponse, AdapterConfig } from './types.ts';

export class XMLPostAdapter extends BaseATSAdapter {
  constructor(config: AdapterConfig) {
    super(config);
  }

  async testConnection(): Promise<ATSResponse> {
    const startTime = Date.now();
    
    try {
      const testXml = this.buildTestXml();
      
      this.log('info', 'Testing connection', { endpoint: this.baseEndpoint });
      
      // Use retry logic for connection test
      const response = await this.executeWithRetry(
        async () => {
          const res = await fetch(this.baseEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              'Accept': 'application/xml',
            },
            body: testXml,
          });
          return res;
        },
        'testConnection'
      );

      const responseText = await response.text();
      const duration = Date.now() - startTime;
      const isSuccess = this.parseTestResponse(responseText);

      return {
        success: isSuccess,
        message: isSuccess ? 'Connection successful' : 'Connection test returned an error',
        duration_ms: duration,
        raw_response: responseText.substring(0, 500),
      };
    } catch (error) {
      return this.createErrorResponse(
        error as Error,
        'CONNECTION_FAILED'
      );
    }
  }

  async sendApplication(application: ApplicationData): Promise<ATSResponse> {
    const startTime = Date.now();
    
    try {
      // Apply field mappings if available
      const mappedData = this.applyFieldMappings(application, this.config.fieldMapping);
      
      // Validate required fields
      const validation = this.validateRequiredFields(application, ['first_name', 'last_name']);
      if (!validation.valid) {
        return this.createErrorResponse(
          `Missing required fields: ${validation.missingFields.join(', ')}`,
          'VALIDATION_ERROR'
        );
      }
      
      // Build XML payload
      const xml = this.buildApplicationXml(mappedData as ApplicationData);
      
      // DEBUG: Log XML payload preview (redact password)
      const xmlPreview = xml
        .replace(/<Password>.*?<\/Password>/gi, '<Password>[REDACTED]</Password>')
        .substring(0, 1200);
      console.log('[XMLPostAdapter] XML Payload Preview:', xmlPreview);
      
      this.log('info', 'Sending application', { 
        application_id: application.id,
        endpoint: this.baseEndpoint,
        payload_size: xml.length
      });

      // Use retry logic for sending
      const response = await this.executeWithRetry(
        async () => {
          const res = await fetch(this.baseEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              'Accept': 'application/xml',
            },
            body: xml,
          });
          return res;
        },
        'sendApplication'
      );

      const responseText = await response.text();
      const duration = Date.now() - startTime;

      // Parse response
      const result = this.parseApplicationResponse(responseText);

      this.log(result.success ? 'info' : 'error', 'Application submission complete', {
        success: result.success,
        external_id: result.external_id,
        duration_ms: duration,
        http_status: response.status
      });

      return {
        ...result,
        duration_ms: duration,
        raw_response: responseText.substring(0, 1000),
      };
    } catch (error) {
      return this.createErrorResponse(
        error as Error,
        'SEND_FAILED'
      );
    }
  }

  /**
   * Build test XML based on ATS type
   */
  protected buildTestXml(): string {
    const creds = this.credentials;
    const mode = creds.mode || this.config.connection.mode || 'TEST';
    
    // Tenstreet-specific test payload
    if (this.adapterName === 'tenstreet') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
  <Mode>${this.escapeXml(String(mode))}</Mode>
  <Authentication>
    <ClientId>${this.escapeXml(String(creds.client_id || creds.clientId || ''))}</ClientId>
    <Password>${this.escapeXml(String(creds.password || ''))}</Password>
    <Service>driver_search</Service>
  </Authentication>
  <SearchCriteria>
    <MaxResults>1</MaxResults>
  </SearchCriteria>
</TenstreetData>`;
    }

    // Generic XML test
    return `<?xml version="1.0" encoding="UTF-8"?>
<TestConnection>
  <ClientId>${this.escapeXml(String(creds.client_id || ''))}</ClientId>
  <Password>${this.escapeXml(String(creds.password || ''))}</Password>
</TestConnection>`;
  }

  /**
   * Parse test response
   */
  protected parseTestResponse(xml: string): boolean {
    const lowerXml = xml.toLowerCase();
    
    // Check for error indicators
    const errorPatterns = [
      /<error>/i,
      /<errorcode>/i,
      /authentication\s*failed/i,
      /invalid\s*credentials/i,
      /unauthorized/i,
      /<status>error</i,
    ];

    for (const pattern of errorPatterns) {
      if (pattern.test(xml)) {
        return false;
      }
    }

    // Check for success indicators
    const successPatterns = [
      /<success>true</i,
      /<status>ok</i,
      /<results>/i,
      /driverid>/i,
      /subjectid>/i,
    ];

    return successPatterns.some(pattern => pattern.test(xml));
  }

  /**
   * Build application XML payload
   */
  protected buildApplicationXml(application: ApplicationData): string {
    const creds = this.credentials;
    const mode = creds.mode || this.config.connection.mode || 'TEST';
    const source = creds.source || '3BI';
    
    // DEBUG: Log all credential keys for troubleshooting (redact password)
    console.log('[XMLPostAdapter] Credentials debug:', {
      all_keys: Object.keys(creds),
      company_id: creds.company_id,
      companyId: creds.companyId,
      company_ids: creds.company_ids,
      company_ids_type: typeof creds.company_ids,
      company_ids_isArray: Array.isArray(creds.company_ids),
      client_id: creds.client_id,
      mode: mode,
    });
    
    // Extract company ID - handle all possible formats (number, string, or array)
    const companyId = (() => {
      // Check direct company_id or companyId first
      if (creds.company_id) {
        console.log('[XMLPostAdapter] Using creds.company_id:', creds.company_id);
        return String(creds.company_id);
      }
      if (creds.companyId) {
        console.log('[XMLPostAdapter] Using creds.companyId:', creds.companyId);
        return String(creds.companyId);
      }
      
      // Handle company_ids - could be array, string, or number
      const companyIds = creds.company_ids;
      if (!companyIds) {
        console.log('[XMLPostAdapter] No company_ids found');
        return '';
      }
      
      if (Array.isArray(companyIds)) {
        const firstId = companyIds[0]?.toString() || '';
        console.log('[XMLPostAdapter] Using company_ids array, first element:', firstId);
        return firstId;
      }
      
      // Direct string or number value
      console.log('[XMLPostAdapter] Using company_ids direct value:', companyIds, 'type:', typeof companyIds);
      return String(companyIds);
    })();
    
    // Final extracted value
    console.log('[XMLPostAdapter] Final extracted CompanyId:', companyId, 'length:', companyId.length);
    
    // Log warning if companyId is missing
    if (!companyId) {
      console.warn('[XMLPostAdapter] Missing CompanyId in credentials', {
        has_company_id: !!creds.company_id,
        has_companyId: !!creds.companyId,
        has_company_ids: !!creds.company_ids,
        company_ids_type: typeof creds.company_ids
      });
    }
    
    const fullName = this.buildFullName(application);
    const formattedPhone = this.formatPhone(application.phone);
    const formattedDOB = this.formatDate(application.date_of_birth);
    
    // Build comprehensive Tenstreet XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
  <Mode>${this.escapeXml(String(mode))}</Mode>
  <Source>${this.escapeXml(source)}</Source>
  <Authentication>
    <ClientId>${this.escapeXml(String(creds.client_id || creds.clientId || ''))}</ClientId>
    <Password>${this.escapeXml(String(creds.password || ''))}</Password>
    <Service>subject_upload</Service>
  </Authentication>
  <Company>
    <CompanyId>${this.escapeXml(companyId)}</CompanyId>
  </Company>
  <Driver>
    <DriverId>${this.escapeXml(application.id || '')}</DriverId>
    <PersonName>
      <GivenName>${this.escapeXml(application.first_name || '')}</GivenName>
      <MiddleName>${this.escapeXml(application.middle_name || '')}</MiddleName>
      <FamilyName>${this.escapeXml(application.last_name || '')}</FamilyName>
      <FormattedName>${this.escapeXml(fullName)}</FormattedName>
    </PersonName>
    <ContactMethod>
      <Telephone>${this.escapeXml(formattedPhone)}</Telephone>
      <InternetEmailAddress>${this.escapeXml(application.applicant_email || application.email || '')}</InternetEmailAddress>
    </ContactMethod>
    <PostalAddress>
      <AddressLine>${this.escapeXml(application.address_1 || '')}</AddressLine>
      <Municipality>${this.escapeXml(application.city || '')}</Municipality>
      <Region>${this.escapeXml(application.state || '')}</Region>
      <PostalCode>${this.escapeXml(application.zip || '')}</PostalCode>
      <CountryCode>${this.escapeXml(application.country || 'US')}</CountryCode>
    </PostalAddress>`;

    // Add date of birth
    if (formattedDOB) {
      xml += `
    <DateOfBirth>${this.escapeXml(formattedDOB)}</DateOfBirth>`;
    }

    // Add CDL information
    if (application.cdl_class || application.cdl_endorsements || application.cdl) {
      xml += `
    <CDLInformation>`;
      if (application.cdl_class) {
        xml += `
      <CDLClass>${this.escapeXml(application.cdl_class)}</CDLClass>`;
      }
      if (application.cdl_endorsements && application.cdl_endorsements.length > 0) {
        xml += `
      <Endorsements>${this.escapeXml(application.cdl_endorsements.join(','))}</Endorsements>`;
      }
      if (application.cdl_state) {
        xml += `
      <CDLState>${this.escapeXml(application.cdl_state)}</CDLState>`;
      }
      if (application.cdl_expiration_date) {
        xml += `
      <CDLExpiration>${this.escapeXml(this.formatDate(application.cdl_expiration_date))}</CDLExpiration>`;
      }
      xml += `
    </CDLInformation>`;
    }

    // Add experience
    if (application.driving_experience_years || application.exp) {
      xml += `
    <Experience>
      <YearsExperience>${this.escapeXml(String(application.driving_experience_years || application.exp || ''))}</YearsExperience>
    </Experience>`;
    }

    // Add employment history
    if (application.employment_history && Array.isArray(application.employment_history) && application.employment_history.length > 0) {
      xml += `
    <EmploymentHistory>`;
      for (const job of application.employment_history.slice(0, 5)) {
        xml += `
      <Employment>
        <Employer>${this.escapeXml(job.employer || job.company || '')}</Employer>
        <Position>${this.escapeXml(job.position || job.title || '')}</Position>
        <StartDate>${this.escapeXml(this.formatDate(job.start_date || job.startDate))}</StartDate>
        <EndDate>${this.escapeXml(this.formatDate(job.end_date || job.endDate))}</EndDate>
      </Employment>`;
      }
      xml += `
    </EmploymentHistory>`;
    }

    // Add custom/display fields
    if (application.custom_questions || application.display_fields) {
      const customData = application.custom_questions || application.display_fields;
      xml += `
    <DisplayFields>`;
      for (const [key, value] of Object.entries(customData as Record<string, unknown>)) {
        if (value !== null && value !== undefined) {
          xml += `
      <DisplayField>
        <Name>${this.escapeXml(key)}</Name>
        <Value>${this.escapeXml(String(value))}</Value>
      </DisplayField>`;
        }
      }
      xml += `
    </DisplayFields>`;
    }

    xml += `
    <ApplicationData>
      <Source>${this.escapeXml(application.source || 'API')}</Source>
      <ExternalId>${this.escapeXml(application.id)}</ExternalId>
      <Status>${this.escapeXml(application.status || 'new')}</Status>
    </ApplicationData>
  </Driver>
</TenstreetData>`;

    return xml;
  }

  /**
   * Parse application response
   */
  protected parseApplicationResponse(xml: string): ATSResponse {
    // Try to extract driver/external ID
    const idPatterns = [
      /<DriverId>([^<]+)<\/DriverId>/i,
      /<SubjectId>([^<]+)<\/SubjectId>/i,
      /<ApplicationId>([^<]+)<\/ApplicationId>/i,
      /<Id>([^<]+)<\/Id>/i,
      /<ExternalId>([^<]+)<\/ExternalId>/i,
    ];

    let externalId: string | undefined;
    for (const pattern of idPatterns) {
      const match = xml.match(pattern);
      if (match?.[1]) {
        externalId = match[1].trim();
        break;
      }
    }

    // Check for errors
    const errorMatch = xml.match(/<Error>([^<]+)<\/Error>/i) || 
                       xml.match(/<ErrorMessage>([^<]+)<\/ErrorMessage>/i) ||
                       xml.match(/<Message>([^<]+)<\/Message>/i);
    
    if (errorMatch && xml.toLowerCase().includes('error')) {
      return {
        success: false,
        error: errorMatch[1].trim(),
        error_code: 'ATS_ERROR',
      };
    }

    // Check for success indicators
    const successMatch = xml.match(/<Success>true<\/Success>/i) ||
                         xml.match(/<Status>OK<\/Status>/i) ||
                         xml.match(/<Status>Success<\/Status>/i);

    // If we got an ID or explicit success, return success
    if (successMatch || externalId) {
      return {
        success: true,
        external_id: externalId,
        message: externalId ? `Application sent. External ID: ${externalId}` : 'Application sent successfully',
      };
    }

    // Check for explicit failure
    const failureIndicators = ['invalid', 'unauthorized', 'rejected', 'failed', '<status>error'];
    for (const indicator of failureIndicators) {
      if (xml.toLowerCase().includes(indicator)) {
        return {
          success: false,
          error: `Request rejected: ${xml.substring(0, 200)}`,
          error_code: 'ATS_REJECTED',
        };
      }
    }

    // Default to success if no clear error
    return {
      success: true,
      message: 'Application sent',
    };
  }

  /**
   * Escape XML special characters
   */
  protected escapeXml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
