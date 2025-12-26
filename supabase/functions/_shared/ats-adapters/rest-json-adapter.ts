/**
 * REST JSON Adapter
 * For ATS systems that use REST APIs with JSON (e.g., Greenhouse, Lever, DriverReach)
 */

import { BaseATSAdapter } from './base-adapter.ts';
import type { ApplicationData, ATSResponse, AdapterConfig } from './types.ts';

export class RESTJSONAdapter extends BaseATSAdapter {
  constructor(config: AdapterConfig) {
    super(config);
  }

  async testConnection(): Promise<ATSResponse> {
    const startTime = Date.now();
    
    try {
      const { url, headers } = this.buildTestRequest();
      
      this.log('info', 'Testing connection', { endpoint: url });
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
          error_code: `HTTP_${response.status}`,
          duration_ms: duration,
        };
      }

      const data = await response.json();

      return {
        success: true,
        message: 'Connection successful',
        data,
        duration_ms: duration,
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
      // Apply field mappings
      const mappedData = this.applyFieldMappings(application, this.config.fieldMapping);
      
      // Build request based on ATS type
      const { url, headers, body } = this.buildApplicationRequest(mappedData as ApplicationData);
      
      this.log('info', 'Sending application', { 
        application_id: application.id,
        endpoint: url 
      });

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const duration = Date.now() - startTime;
      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || responseData.error || `HTTP ${response.status}`,
          error_code: `HTTP_${response.status}`,
          duration_ms: duration,
          raw_response: responseData,
        };
      }

      // Extract external ID based on ATS type
      const externalId = this.extractExternalId(responseData);

      return {
        success: true,
        message: 'Application sent successfully',
        external_id: externalId,
        data: responseData,
        duration_ms: duration,
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

  async getJobs(): Promise<ATSResponse> {
    const startTime = Date.now();
    
    try {
      const { url, headers } = this.buildJobsRequest();
      
      if (!url) {
        return {
          success: false,
          error: 'Get jobs not supported for this ATS',
          error_code: 'NOT_SUPPORTED',
        };
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const duration = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
          error_code: `HTTP_${response.status}`,
          duration_ms: duration,
        };
      }

      return {
        success: true,
        data,
        duration_ms: duration,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        error_code: 'FETCH_FAILED',
        duration_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Build test request based on ATS type
   */
  protected buildTestRequest(): { url: string; headers: Record<string, string> } {
    const slug = this.config.system.slug;
    const creds = this.credentials;

    switch (slug) {
      case 'greenhouse':
        return {
          url: 'https://harvest.greenhouse.io/v1/users',
          headers: this.buildGreenhouseHeaders(),
        };

      case 'lever':
        return {
          url: 'https://api.lever.co/v1/users',
          headers: this.buildLeverHeaders(),
        };

      case 'driverreach':
        return {
          url: `https://api.driverreach.com/v1/companies/${creds.company_id}`,
          headers: this.buildDriverReachHeaders(),
        };

      case 'workable':
        return {
          url: `https://${creds.subdomain}.workable.com/spi/v3/accounts`,
          headers: this.buildWorkableHeaders(),
        };

      case 'jazzhr':
        return {
          url: `https://api.resumatorapi.com/v1/applicants?apikey=${creds.api_key}`,
          headers: { 'Content-Type': 'application/json' },
        };

      case 'bamboohr':
        return {
          url: `https://api.bamboohr.com/api/gateway.php/${creds.subdomain}/v1/employees/directory`,
          headers: this.buildBambooHRHeaders(),
        };

      case 'icims':
        return {
          url: `https://api.icims.com/customers/${creds.customer_id}/jobs`,
          headers: this.buildICIMSHeaders(),
        };

      default:
        return {
          url: this.baseEndpoint || '',
          headers: { 'Content-Type': 'application/json' },
        };
    }
  }

  /**
   * Build application request based on ATS type
   */
  protected buildApplicationRequest(application: ApplicationData): { 
    url: string; 
    headers: Record<string, string>; 
    body: Record<string, unknown>;
  } {
    const slug = this.config.system.slug;
    const creds = this.credentials;

    switch (slug) {
      case 'greenhouse':
        return {
          url: 'https://harvest.greenhouse.io/v1/candidates',
          headers: this.buildGreenhouseHeaders(),
          body: this.buildGreenhousePayload(application),
        };

      case 'lever':
        return {
          url: 'https://api.lever.co/v1/opportunities',
          headers: this.buildLeverHeaders(),
          body: this.buildLeverPayload(application),
        };

      case 'driverreach':
        return {
          url: `https://api.driverreach.com/v1/companies/${creds.company_id}/applications`,
          headers: this.buildDriverReachHeaders(),
          body: this.buildDriverReachPayload(application),
        };

      case 'workable':
        return {
          url: `https://${creds.subdomain}.workable.com/spi/v3/candidates`,
          headers: this.buildWorkableHeaders(),
          body: this.buildWorkablePayload(application),
        };

      case 'jazzhr':
        return {
          url: `https://api.resumatorapi.com/v1/applicants?apikey=${creds.api_key}`,
          headers: { 'Content-Type': 'application/json' },
          body: this.buildJazzHRPayload(application),
        };

      default:
        return {
          url: this.baseEndpoint || '',
          headers: { 'Content-Type': 'application/json' },
          body: application as Record<string, unknown>,
        };
    }
  }

  /**
   * Build jobs request
   */
  protected buildJobsRequest(): { url: string; headers: Record<string, string> } {
    const slug = this.config.system.slug;
    const creds = this.credentials;

    switch (slug) {
      case 'greenhouse':
        return {
          url: 'https://harvest.greenhouse.io/v1/jobs',
          headers: this.buildGreenhouseHeaders(),
        };

      case 'lever':
        return {
          url: 'https://api.lever.co/v1/postings',
          headers: this.buildLeverHeaders(),
        };

      case 'workable':
        return {
          url: `https://${creds.subdomain}.workable.com/spi/v3/jobs`,
          headers: this.buildWorkableHeaders(),
        };

      default:
        return { url: '', headers: {} };
    }
  }

  // === Header Builders ===

  protected buildGreenhouseHeaders(): Record<string, string> {
    const apiKey = this.credentials.api_key as string;
    return {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(apiKey + ':')}`,
      ...(this.credentials.on_behalf_of && {
        'On-Behalf-Of': String(this.credentials.on_behalf_of)
      }),
    };
  }

  protected buildLeverHeaders(): Record<string, string> {
    const apiKey = this.credentials.api_key as string;
    return {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(apiKey + ':')}`,
    };
  }

  protected buildDriverReachHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.credentials.api_key}`,
    };
  }

  protected buildWorkableHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.credentials.api_key}`,
    };
  }

  protected buildBambooHRHeaders(): Record<string, string> {
    const apiKey = this.credentials.api_key as string;
    return {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(apiKey + ':x')}`,
      'Accept': 'application/json',
    };
  }

  protected buildICIMSHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.credentials.api_key}`,
    };
  }

  // === Payload Builders ===

  protected buildGreenhousePayload(app: ApplicationData): Record<string, unknown> {
    return {
      first_name: app.first_name,
      last_name: app.last_name,
      email_addresses: [{ value: app.applicant_email, type: 'personal' }],
      phone_numbers: app.phone ? [{ value: this.formatPhone(app.phone), type: 'mobile' }] : [],
      addresses: app.city ? [{
        value: [app.address_1, app.city, app.state, app.zip].filter(Boolean).join(', '),
        type: 'home',
      }] : [],
      applications: [{
        source_id: null,
        referrer: { type: 'other', value: app.source || 'API' },
      }],
    };
  }

  protected buildLeverPayload(app: ApplicationData): Record<string, unknown> {
    return {
      name: this.buildFullName(app),
      email: app.applicant_email,
      phones: app.phone ? [{ type: 'mobile', value: this.formatPhone(app.phone) }] : [],
      location: app.city && app.state ? `${app.city}, ${app.state}` : undefined,
      origin: app.source || 'API',
      sources: [app.source || 'API'],
    };
  }

  protected buildDriverReachPayload(app: ApplicationData): Record<string, unknown> {
    return {
      first_name: app.first_name,
      last_name: app.last_name,
      email: app.applicant_email,
      phone: this.formatPhone(app.phone),
      address: app.address_1,
      city: app.city,
      state: app.state,
      zip: app.zip,
      cdl_class: app.cdl_class,
      cdl_state: app.cdl_state,
      years_experience: app.driving_experience_years,
      source: app.source || 'API',
      external_id: app.id,
    };
  }

  protected buildWorkablePayload(app: ApplicationData): Record<string, unknown> {
    return {
      name: this.buildFullName(app),
      firstname: app.first_name,
      lastname: app.last_name,
      email: app.applicant_email,
      phone: this.formatPhone(app.phone),
      address: app.address_1,
      city: app.city,
      state: app.state,
      zip: app.zip,
      source: app.source || 'API',
    };
  }

  protected buildJazzHRPayload(app: ApplicationData): Record<string, unknown> {
    return {
      first_name: app.first_name,
      last_name: app.last_name,
      email: app.applicant_email,
      phone: this.formatPhone(app.phone),
      address: app.address_1,
      city: app.city,
      state: app.state,
      zip: app.zip,
    };
  }

  /**
   * Extract external ID from response
   */
  protected extractExternalId(response: Record<string, unknown>): string | undefined {
    // Try common ID field names
    return String(
      response.id || 
      response.candidate_id || 
      response.application_id || 
      response.opportunity_id ||
      response.external_id ||
      ''
    ) || undefined;
  }
}
