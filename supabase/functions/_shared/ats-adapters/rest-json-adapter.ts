/**
 * REST JSON Adapter
 * For ATS systems that use REST APIs with JSON (e.g., Greenhouse, Lever, DriverReach)
 * Enhanced with retry logic and better error handling
 */

import { BaseATSAdapter } from './base-adapter.ts';
import type { ApplicationData, ATSResponse, AdapterConfig } from './types.ts';

// ============ Double Nickel OAuth Token Cache ============
interface CachedToken {
  access_token: string;
  expires_at: number;
}

const dnTokenCache = new Map<string, CachedToken>();

async function getDoubleNickelToken(
  credentials: Record<string, unknown>,
  mode: string
): Promise<string> {
  const isTest = mode === 'test' || mode === 'TEST';
  const cacheKey = `${credentials.client_id}_${isTest ? 'test' : 'prod'}`;

  const cached = dnTokenCache.get(cacheKey);
  if (cached && cached.expires_at > Date.now() + 60_000) {
    return cached.access_token;
  }

  const authDomain = isTest
    ? 'https://double-nickel-test.us.auth0.com/oauth/token'
    : 'https://double-nickel.us.auth0.com/oauth/token';

  const res = await fetch(authDomain, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: credentials.client_id || credentials.clientId,
      client_secret: credentials.client_secret,
      audience: credentials.audience,
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Double Nickel Auth0 token error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  dnTokenCache.set(cacheKey, {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in || 86400) * 1000,
  });

  return data.access_token;
}

export class RESTJSONAdapter extends BaseATSAdapter {
  constructor(config: AdapterConfig) {
    super(config);
  }

  async testConnection(): Promise<ATSResponse> {
    const startTime = Date.now();
    
    try {
      const slug = this.config.system.slug;

      // Double Nickel: async token + custom test
      if (slug === 'doublenickel') {
        return await this.testDoubleNickelConnection();
      }

      const { url, headers } = this.buildTestRequest();
      
      this.log('info', 'Testing connection', { endpoint: url });
      
      const response = await this.executeWithRetry(
        async () => {
          const res = await fetch(url, { method: 'GET', headers });
          return res;
        },
        'testConnection'
      );

      const duration = Date.now() - startTime;
      
      if (!response.ok && response.status !== 401) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
          error_code: `HTTP_${response.status}`,
          duration_ms: duration,
        };
      }

      if (response.status === 401) {
        return this.createErrorResponse('Invalid API credentials', 'INVALID_CREDENTIALS');
      }

      const data = await response.json().catch(() => ({}));

      return {
        success: true,
        message: 'Connection successful',
        data,
        duration_ms: duration,
      };
    } catch (error) {
      return this.createErrorResponse(error as Error, 'CONNECTION_FAILED');
    }
  }

  async sendApplication(application: ApplicationData): Promise<ATSResponse> {
    const startTime = Date.now();
    
    try {
      const slug = this.config.system.slug;

      // Apply field mappings
      const mappedData = this.applyFieldMappings(application, this.config.fieldMapping);
      
      // Validate required fields
      const validation = this.validateRequiredFields(application, ['first_name', 'last_name']);
      if (!validation.valid) {
        return this.createErrorResponse(
          `Missing required fields: ${validation.missingFields.join(', ')}`,
          'VALIDATION_ERROR'
        );
      }

      // Double Nickel: async token + custom endpoint
      if (slug === 'doublenickel') {
        return await this.sendDoubleNickelApplication(mappedData as ApplicationData);
      }
      
      // Build request based on ATS type
      const { url, headers, body } = this.buildApplicationRequest(mappedData as ApplicationData);
      
      this.log('info', 'Sending application', { 
        application_id: application.id,
        endpoint: url 
      });

      const response = await this.executeWithRetry(
        async () => {
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
          });
          return res;
        },
        'sendApplication'
      );

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

      this.log('info', 'Application sent successfully', {
        external_id: externalId,
        duration_ms: duration
      });

      return {
        success: true,
        message: 'Application sent successfully',
        external_id: externalId,
        data: responseData,
        duration_ms: duration,
      };
    } catch (error) {
      return this.createErrorResponse(error as Error, 'SEND_FAILED');
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

      const response = await this.executeWithRetry(
        async () => {
          const res = await fetch(url, { method: 'GET', headers });
          return res;
        },
        'getJobs'
      );

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
      return this.createErrorResponse(error as Error, 'FETCH_FAILED');
    }
  }

  async syncStatus(externalId: string): Promise<ATSResponse> {
    const startTime = Date.now();
    
    try {
      const { url, headers } = this.buildStatusRequest(externalId);
      
      if (!url) {
        return {
          success: false,
          error: 'Status sync not supported for this ATS',
          error_code: 'NOT_SUPPORTED',
        };
      }

      const response = await this.executeWithRetry(
        async () => {
          const res = await fetch(url, { method: 'GET', headers });
          return res;
        },
        'syncStatus'
      );

      const data = await response.json();
      const duration = Date.now() - startTime;

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
        external_id: externalId,
        duration_ms: duration,
      };
    } catch (error) {
      return this.createErrorResponse(error as Error, 'SYNC_FAILED');
    }
  }

  // ============ Request Builders ============

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
          url: `https://www.workable.com/spi/v3/accounts/${creds.subdomain}`,
          headers: this.buildWorkableHeaders(),
        };

      case 'bamboohr':
        return {
          url: `https://api.bamboohr.com/api/gateway.php/${creds.subdomain}/v1/employees/directory`,
          headers: this.buildBambooHRHeaders(),
        };

      case 'smartrecruiters':
        return {
          url: 'https://api.smartrecruiters.com/configuration/company',
          headers: this.buildSmartRecruitersHeaders(),
        };

      case 'icims':
        return {
          url: `https://api.icims.com/customers/${creds.customer_id}/applicantworkflows?$top=1`,
          headers: this.buildICIMSHeaders(),
        };

      case 'jobvite':
        return {
          url: `https://api.jobvite.com/v2/candidate?count=1`,
          headers: this.buildJobviteHeaders(),
        };

      default:
        return {
          url: this.baseEndpoint || '',
          headers: { 'Content-Type': 'application/json' },
        };
    }
  }

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
          url: `https://www.workable.com/spi/v3/accounts/${creds.subdomain}/candidates`,
          headers: this.buildWorkableHeaders(),
          body: this.buildWorkablePayload(application),
        };

      case 'smartrecruiters':
        return {
          url: `https://api.smartrecruiters.com/jobs/${application.job_id || 'default'}/candidates`,
          headers: this.buildSmartRecruitersHeaders(),
          body: this.buildSmartRecruitersPayload(application),
        };

      case 'bamboohr':
        return {
          url: `https://api.bamboohr.com/api/gateway.php/${creds.subdomain}/v1/applicant_tracking/applications`,
          headers: this.buildBambooHRHeaders(),
          body: this.buildBambooHRPayload(application),
        };

      default:
        return {
          url: this.baseEndpoint || '',
          headers: { 'Content-Type': 'application/json' },
          body: this.buildGenericPayload(application),
        };
    }
  }

  protected buildJobsRequest(): { url: string; headers: Record<string, string> } {
    const slug = this.config.system.slug;
    const creds = this.credentials;

    switch (slug) {
      case 'greenhouse':
        return { url: 'https://harvest.greenhouse.io/v1/jobs', headers: this.buildGreenhouseHeaders() };
      case 'lever':
        return { url: 'https://api.lever.co/v1/postings', headers: this.buildLeverHeaders() };
      case 'workable':
        return { url: `https://www.workable.com/spi/v3/accounts/${creds.subdomain}/jobs`, headers: this.buildWorkableHeaders() };
      default:
        return { url: '', headers: {} };
    }
  }

  protected buildStatusRequest(externalId: string): { url: string; headers: Record<string, string> } {
    const slug = this.config.system.slug;
    
    switch (slug) {
      case 'greenhouse':
        return { url: `https://harvest.greenhouse.io/v1/candidates/${externalId}`, headers: this.buildGreenhouseHeaders() };
      case 'lever':
        return { url: `https://api.lever.co/v1/opportunities/${externalId}`, headers: this.buildLeverHeaders() };
      case 'driverreach':
        return { url: `https://api.driverreach.com/v1/applicants/${externalId}`, headers: this.buildDriverReachHeaders() };
      default:
        return { url: '', headers: {} };
    }
  }

  // ============ Header Builders ============

  protected buildGreenhouseHeaders(): Record<string, string> {
    const apiKey = String(this.credentials.api_key || this.credentials.apiKey || '');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(apiKey + ':')}`,
      ...(this.credentials.on_behalf_of && { 'On-Behalf-Of': String(this.credentials.on_behalf_of) }),
    };
  }

  protected buildLeverHeaders(): Record<string, string> {
    const apiKey = String(this.credentials.api_key || this.credentials.apiKey || '');
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
    const apiKey = String(this.credentials.api_key || '');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(apiKey + ':x')}`,
      'Accept': 'application/json',
    };
  }

  protected buildSmartRecruitersHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-SmartToken': String(this.credentials.api_key || ''),
    };
  }

  protected buildICIMSHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.credentials.access_token || this.credentials.api_key}`,
      'x-api-key': String(this.credentials.api_key || ''),
    };
  }

  protected buildJobviteHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Api-Key': String(this.credentials.api_key || ''),
      'Api-Secret': String(this.credentials.api_secret || ''),
    };
  }

  // ============ Payload Builders ============

  protected buildGreenhousePayload(app: ApplicationData): Record<string, unknown> {
    return {
      first_name: app.first_name,
      last_name: app.last_name,
      email_addresses: [{ value: app.applicant_email || app.email, type: 'personal' }],
      phone_numbers: app.phone ? [{ value: this.formatPhone(app.phone), type: 'mobile' }] : [],
      addresses: app.city ? [{
        value: [app.address_1, app.city, app.state, app.zip].filter(Boolean).join(', '),
        type: 'home',
      }] : [],
      applications: [{ source_id: null, referrer: { type: 'other', value: app.source || 'API' } }],
    };
  }

  protected buildLeverPayload(app: ApplicationData): Record<string, unknown> {
    return {
      name: this.buildFullName(app),
      email: app.applicant_email || app.email,
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
      email: app.applicant_email || app.email,
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
      email: app.applicant_email || app.email,
      phone: this.formatPhone(app.phone),
      address: app.address_1,
      city: app.city,
      state: app.state,
      zip: app.zip,
      source: app.source || 'API',
    };
  }

  protected buildSmartRecruitersPayload(app: ApplicationData): Record<string, unknown> {
    return {
      firstName: app.first_name,
      lastName: app.last_name,
      email: app.applicant_email || app.email,
      phoneNumber: this.formatPhone(app.phone),
      location: { city: app.city, region: app.state, postalCode: app.zip, country: app.country || 'US' },
      source: { type: 'API', name: app.source || 'Direct' },
      consent: { privacy: true },
    };
  }

  protected buildBambooHRPayload(app: ApplicationData): Record<string, unknown> {
    return {
      firstName: app.first_name,
      lastName: app.last_name,
      email: app.applicant_email || app.email,
      phoneNumber: this.formatPhone(app.phone),
      address: { streetAddress: app.address_1, city: app.city, state: app.state, zipCode: app.zip, country: app.country || 'US' },
      source: app.source || 'API',
      jobId: app.job_id,
    };
  }

  protected buildGenericPayload(app: ApplicationData): Record<string, unknown> {
    return {
      reference_id: app.id,
      first_name: app.first_name,
      last_name: app.last_name,
      email: app.applicant_email || app.email,
      phone: this.formatPhone(app.phone),
      address: { street: app.address_1, city: app.city, state: app.state, zip: app.zip, country: app.country || 'US' },
      source: app.source || 'API',
      status: app.status || 'new',
    };
  }

  // ============ Response Parsing ============

  protected extractExternalId(response: Record<string, unknown>): string | undefined {
    const idFields = ['id', 'candidate_id', 'candidateId', 'application_id', 'applicationId', 
                      'opportunity_id', 'opportunityId', 'external_id', 'externalId', 'applicant_id'];
    
    for (const field of idFields) {
      if (response[field]) {
        return String(response[field]);
      }
    }

    // Check nested structures
    if (response.data && typeof response.data === 'object') {
      return this.extractExternalId(response.data as Record<string, unknown>);
    }
    if (response.candidate && typeof response.candidate === 'object') {
      return this.extractExternalId(response.candidate as Record<string, unknown>);
    }

    return undefined;
  }
}
