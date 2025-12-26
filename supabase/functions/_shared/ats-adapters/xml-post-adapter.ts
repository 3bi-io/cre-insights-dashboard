/**
 * XML POST Adapter
 * For ATS systems that use XML-based APIs (e.g., Tenstreet)
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
      // Build a minimal test request based on the ATS
      const testXml = this.buildTestXml();
      
      this.log('info', 'Testing connection', { endpoint: this.baseEndpoint });
      
      const response = await fetch(this.baseEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
        },
        body: testXml,
      });

      const responseText = await response.text();
      const duration = Date.now() - startTime;

      // Parse response to check for success/error indicators
      const isSuccess = this.parseTestResponse(responseText);

      return {
        success: isSuccess,
        message: isSuccess ? 'Connection successful' : 'Connection test returned an error',
        duration_ms: duration,
        raw_response: responseText.substring(0, 500),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        error_code: 'CONNECTION_FAILED',
        duration_ms: Date.now() - startTime,
      };
    }
  }

  async sendApplication(application: ApplicationData): Promise<ATSResponse> {
    const startTime = Date.now();
    
    try {
      // Apply field mappings if available
      const mappedData = this.applyFieldMappings(application, this.config.fieldMapping);
      
      // Build XML payload
      const xml = this.buildApplicationXml(mappedData as ApplicationData);
      
      this.log('info', 'Sending application', { 
        application_id: application.id,
        endpoint: this.baseEndpoint 
      });

      const response = await fetch(this.baseEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
        },
        body: xml,
      });

      const responseText = await response.text();
      const duration = Date.now() - startTime;

      // Parse response
      const result = this.parseApplicationResponse(responseText);

      return {
        ...result,
        duration_ms: duration,
        raw_response: responseText.substring(0, 1000),
      };
    } catch (error) {
      this.log('error', 'Failed to send application', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        error_code: 'SEND_FAILED',
        duration_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Build test XML - specific implementations will override
   */
  protected buildTestXml(): string {
    const creds = this.credentials;
    
    // Generic XML structure for testing
    return `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
  <Authentication>
    <ClientId>${this.escapeXml(String(creds.client_id || ''))}</ClientId>
    <Password>${this.escapeXml(String(creds.password || ''))}</Password>
    <Service>driver_search</Service>
    <Mode>${this.escapeXml(String(creds.mode || 'TEST'))}</Mode>
  </Authentication>
  <SearchCriteria>
    <MaxResults>1</MaxResults>
  </SearchCriteria>
</TenstreetData>`;
  }

  /**
   * Parse test response
   */
  protected parseTestResponse(xml: string): boolean {
    // Check for common error indicators
    const errorPatterns = [
      /<Error>/i,
      /<ErrorCode>/i,
      /authentication\s*failed/i,
      /invalid\s*credentials/i,
      /unauthorized/i,
    ];

    for (const pattern of errorPatterns) {
      if (pattern.test(xml)) {
        return false;
      }
    }

    // Check for success indicators
    const successPatterns = [
      /<Success>true</i,
      /<Status>OK</i,
      /<Results>/i,
    ];

    return successPatterns.some(pattern => pattern.test(xml));
  }

  /**
   * Build application XML payload
   */
  protected buildApplicationXml(application: ApplicationData): string {
    const creds = this.credentials;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<TenstreetData>
  <Authentication>
    <ClientId>${this.escapeXml(String(creds.client_id || ''))}</ClientId>
    <Password>${this.escapeXml(String(creds.password || ''))}</Password>
    <Service>subject_upload</Service>
    <Mode>${this.escapeXml(String(creds.mode || 'TEST'))}</Mode>
  </Authentication>
  <Company>
    <CompanyId>${this.escapeXml(String(creds.company_id || (creds.company_ids as string[])?.[0] || ''))}</CompanyId>
  </Company>
  <PersonalData>
    <FirstName>${this.escapeXml(application.first_name || '')}</FirstName>
    <LastName>${this.escapeXml(application.last_name || '')}</LastName>
    <Email>${this.escapeXml(application.applicant_email || '')}</Email>
    <Phone>${this.escapeXml(this.formatPhone(application.phone))}</Phone>
    <Address>${this.escapeXml(application.address_1 || '')}</Address>
    <City>${this.escapeXml(application.city || '')}</City>
    <State>${this.escapeXml(application.state || '')}</State>
    <Zip>${this.escapeXml(application.zip || '')}</Zip>
    ${application.date_of_birth ? `<DateOfBirth>${this.formatDate(application.date_of_birth)}</DateOfBirth>` : ''}
  </PersonalData>
  <DriverData>
    ${application.cdl_class ? `<CDLClass>${this.escapeXml(application.cdl_class)}</CDLClass>` : ''}
    ${application.cdl_state ? `<CDLState>${this.escapeXml(application.cdl_state)}</CDLState>` : ''}
    ${application.cdl_expiration_date ? `<CDLExpiration>${this.formatDate(application.cdl_expiration_date)}</CDLExpiration>` : ''}
    ${application.driving_experience_years ? `<YearsExperience>${application.driving_experience_years}</YearsExperience>` : ''}
  </DriverData>
  <ApplicationData>
    <Source>${this.escapeXml(application.source || 'API')}</Source>
    <ExternalId>${this.escapeXml(application.id)}</ExternalId>
  </ApplicationData>
</TenstreetData>`;
  }

  /**
   * Parse application response
   */
  protected parseApplicationResponse(xml: string): ATSResponse {
    // Try to extract driver ID
    const driverIdMatch = xml.match(/<DriverId>([^<]+)<\/DriverId>/i);
    const externalId = driverIdMatch?.[1];

    // Check for errors
    const errorMatch = xml.match(/<Error>([^<]+)<\/Error>/i) || 
                       xml.match(/<ErrorMessage>([^<]+)<\/ErrorMessage>/i);
    
    if (errorMatch) {
      return {
        success: false,
        error: errorMatch[1],
        error_code: 'ATS_ERROR',
      };
    }

    // Check for success
    const successMatch = xml.match(/<Success>true<\/Success>/i) ||
                         xml.match(/<Status>OK<\/Status>/i);

    return {
      success: !!successMatch || !!externalId,
      external_id: externalId,
      message: externalId ? `Application sent successfully. External ID: ${externalId}` : 'Application sent',
    };
  }

  /**
   * Escape XML special characters
   */
  protected escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
