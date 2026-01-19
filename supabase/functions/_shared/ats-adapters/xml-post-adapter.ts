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

      // DEBUG: Log the raw Tenstreet response (first 1500 chars, sensitive data redacted)
      console.log('[XMLPostAdapter] Tenstreet Raw Response:', 
        responseText
          .replace(/<Password>.*?<\/Password>/gi, '<Password>[REDACTED]</Password>')
          .replace(/<SSN>.*?<\/SSN>/gi, '<SSN>[REDACTED]</SSN>')
          .substring(0, 1500)
      );

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
      source: source, // Log the source being used
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
    const formattedDOB = application.date_of_birth ? this.formatDateMMDDYYYY(application.date_of_birth) : '';
    const email = application.applicant_email || application.email || '';
    const preferredContact = application.preferred_contact_method || 'PrimaryPhone';
    
    // Build comprehensive Tenstreet XML per official spec
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
  <Mode>${this.escapeXml(String(mode))}</Mode>
  <Source>${this.escapeXml(source)}</Source>
  <Authentication>
    <ClientId>${this.escapeXml(String(creds.client_id || creds.clientId || ''))}</ClientId>
    <Password><![CDATA[${creds.password || ''}]]></Password>
    <Service>subject_upload</Service>
  </Authentication>
  <CompanyId>${this.escapeXml(companyId)}</CompanyId>
  <CompanyName>${this.escapeXml(application.company_name || '')}</CompanyName>
  <Driver>
    <DriverId>${this.escapeXml(application.driver_id || application.id || '')}</DriverId>
  </Driver>
  <PersonalData>
    <PersonName>
      <GivenName>${this.escapeXml(application.first_name || '')}</GivenName>
      <MiddleName>${this.escapeXml(application.middle_name || '')}</MiddleName>
      <FamilyName>${this.escapeXml(application.last_name || '')}</FamilyName>
    </PersonName>
    <PostalAddress>
      <CountryCode>${this.escapeXml(application.country || 'US')}</CountryCode>
      <Municipality>${this.escapeXml(application.city || '')}</Municipality>
      <Region>${this.escapeXml(application.state || '')}</Region>
      <PostalCode>${this.escapeXml(application.zip || '')}</PostalCode>
      <Address1>${this.escapeXml(application.address_1 || '')}</Address1>${application.address_2 ? `
      <Address2>${this.escapeXml(application.address_2)}</Address2>` : ''}
    </PostalAddress>${formattedDOB ? `
    <DateOfBirth>${this.escapeXml(formattedDOB)}</DateOfBirth>` : ''}
    <ContactData PreferredMethod="${this.escapeXml(preferredContact)}">
      <InternetEmailAddress>${email ? `mailto:${this.escapeXml(email)}` : ''}</InternetEmailAddress>
      <PrimaryPhone>${this.escapeXml(formattedPhone)}</PrimaryPhone>${application.secondary_phone ? `
      <SecondaryPhone>${this.escapeXml(this.formatPhone(application.secondary_phone))}</SecondaryPhone>` : ''}
    </ContactData>
  </PersonalData>`;

    // Add Licenses section per Tenstreet spec
    if (application.cdl_class || application.cdl_endorsements || application.cdl) {
      const hasCDL = application.cdl === 'yes' || application.cdl === 'true' || application.cdl === true || !!application.cdl_class;
      xml += `
  <Licenses>
    <License>
      <CurrentLicense>${hasCDL ? 'y' : 'n'}</CurrentLicense>${application.cdl_number ? `
      <LicenseNumber>${this.escapeXml(application.cdl_number)}</LicenseNumber>` : ''}${application.cdl_expiration_date ? `
      <ExpirationDate>${this.escapeXml(this.formatDate(application.cdl_expiration_date))}</ExpirationDate>` : ''}
      <Region>${this.escapeXml(application.cdl_state || application.state || '')}</Region>
      <CountryCode>US</CountryCode>
      <CommercialDriversLicense>${hasCDL ? 'y' : 'n'}</CommercialDriversLicense>${application.cdl_class ? `
      <LicenseClass>${this.escapeXml(application.cdl_class)}</LicenseClass>` : ''}`;
      
      // Add endorsements as individual elements
      if (application.cdl_endorsements && application.cdl_endorsements.length > 0) {
        xml += `
      <Endorsements>`;
        for (const endorsement of application.cdl_endorsements) {
          xml += `
        <Endorsement>${this.escapeXml(endorsement)}</Endorsement>`;
        }
        xml += `
      </Endorsements>`;
      }
      
      xml += `
    </License>
  </Licenses>`;
    }

    // Add ApplicationData section per Tenstreet spec
    xml += `
  <ApplicationData>
    <AppReferrer>${this.escapeXml(application.source || application.referral_source || 'ATS.me')}</AppReferrer>
    <StatusTag>${this.escapeXml(application.status || 'New')}</StatusTag>`;

    // Add DisplayFields inside ApplicationData per spec
    if (application.custom_questions || application.display_fields) {
      const customData = application.custom_questions || application.display_fields;
      xml += `
    <DisplayFields>`;
      for (const [key, value] of Object.entries(customData as Record<string, unknown>)) {
        if (value !== null && value !== undefined) {
          xml += `
      <DisplayField>
        <DisplayPrompt>${this.escapeXml(key)}</DisplayPrompt>
        <DisplayValue>${this.escapeXml(String(value))}</DisplayValue>
      </DisplayField>`;
        }
      }
      xml += `
    </DisplayFields>`;
    }

    xml += `
  </ApplicationData>
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

  /**
   * Format date to MM/DD/YYYY (Tenstreet DateOfBirth format)
   */
  protected formatDateMMDDYYYY(date?: string): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return '';
    }
  }
}
