/**
 * XML POST Adapter
 * For ATS systems that use XML-based APIs (e.g., Tenstreet)
 * Enhanced with retry logic, comprehensive XML building, and better error handling
 */

import { BaseATSAdapter } from './base-adapter.ts';
import type { ApplicationData, ATSResponse, AdapterConfig } from './types.ts';
import { createLogger } from '../logger.ts';

const logger = createLogger('xml-post-adapter');

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
      logger.debug('XML Payload Preview', { xml: xmlPreview });
      
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
      logger.debug('Tenstreet Raw Response', {
        response: responseText
          .replace(/<Password>.*?<\/Password>/gi, '<Password>[REDACTED]</Password>')
          .replace(/<SSN>.*?<\/SSN>/gi, '<SSN>[REDACTED]</SSN>')
          .substring(0, 1500)
      });

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
    logger.debug('Credentials debug', {
      all_keys: Object.keys(creds),
      has_company_id: !!creds.company_id,
      has_companyId: !!creds.companyId,
      has_company_ids: !!creds.company_ids,
      company_ids_type: typeof creds.company_ids,
      company_ids_isArray: Array.isArray(creds.company_ids),
      has_client_id: !!creds.client_id,
      mode: mode,
      source: source,
    });
    
    // Extract company ID - handle all possible formats (number, string, or array)
    const companyId = (() => {
      // Check direct company_id or companyId first
      if (creds.company_id) {
        logger.debug('Using creds.company_id', { value: creds.company_id });
        return String(creds.company_id);
      }
      if (creds.companyId) {
        logger.debug('Using creds.companyId', { value: creds.companyId });
        return String(creds.companyId);
      }
      
      // Handle company_ids - could be array, string, or number
      const companyIds = creds.company_ids;
      if (!companyIds) {
        logger.debug('No company_ids found');
        return '';
      }
      
      if (Array.isArray(companyIds)) {
        const firstId = companyIds[0]?.toString() || '';
        this.log('debug', 'Using company_ids array', { firstElement: firstId });
        return firstId;
      }
      
      // Direct string or number value
      this.log('debug', 'Using company_ids direct value', { value: companyIds, type: typeof companyIds });
      return String(companyIds);
    })();
    
    // Final extracted value
    this.log('debug', 'Final extracted CompanyId', { companyId, length: companyId.length });
    
    // Log warning if companyId is missing
    if (!companyId) {
      this.log('warn', 'Missing CompanyId in credentials', {
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

    // Add ApplicationData section with enriched DisplayFields + CustomQuestions
    const appReferrer = this.extractBrandName(application.referral_source, application.source);
    
    xml += `
  <ApplicationData>
    <AppReferrer>${this.escapeXml(appReferrer)}</AppReferrer>
    <StatusTag>New</StatusTag>`;

    // Build DisplayFields from application columns
    const displayFields: Array<{ prompt: string; value: string }> = [];
    
    // Experience Level mapping from months
    const monthsNum = application.months ? parseInt(String(application.months), 10) : null;
    if (monthsNum !== null && !isNaN(monthsNum)) {
      const expLevel = monthsNum >= 12 ? 'Over 1 Year' : (monthsNum >= 3 ? '3-12 Months' : 'Under 3 Months');
      displayFields.push({ prompt: 'Experience Level', value: expLevel });
      
      const years = Math.floor(monthsNum / 12);
      const expMonthsDisplay = years > 0 ? `${monthsNum} (${years} year${years > 1 ? 's' : ''})` : String(monthsNum);
      displayFields.push({ prompt: 'Experience Months', value: expMonthsDisplay });
    } else if (application.exp) {
      displayFields.push({ prompt: 'Experience Level', value: String(application.exp) });
    }

    // Veteran Status
    if (application.veteran) {
      displayFields.push({ prompt: 'Veteran Status', value: String(application.veteran) });
    }

    // Driver Type (skip if null)
    if (application.driver_type) {
      displayFields.push({ prompt: 'Driver Type', value: String(application.driver_type) });
    }

    // Apply URL (injected by index.ts)
    if (application.apply_url) {
      displayFields.push({ prompt: 'Apply URL', value: `ATS.me(${application.apply_url})` });
    }

    // Powered By (injected by index.ts)
    if (application.powered_by) {
      displayFields.push({ prompt: 'Powered By', value: String(application.powered_by) });
    }

    // Merge any existing display_fields JSON
    if (application.display_fields && typeof application.display_fields === 'object') {
      for (const [key, value] of Object.entries(application.display_fields as Record<string, unknown>)) {
        if (value !== null && value !== undefined) {
          displayFields.push({ prompt: key, value: String(value) });
        }
      }
    }

    if (displayFields.length > 0) {
      xml += `
    <DisplayFields>`;
      for (const field of displayFields) {
        xml += `
      <DisplayField>
        <DisplayPrompt>${this.escapeXml(field.prompt)}</DisplayPrompt>
        <DisplayValue>${this.escapeXml(field.value)}</DisplayValue>
      </DisplayField>`;
      }
      xml += `
    </DisplayFields>`;
    }

    // Build CustomQuestions from compliance booleans
    const customQuestions: Array<{ question: string; answer: string }> = [];
    
    const drugAnswer = application.drug || application.can_pass_drug_test;
    if (drugAnswer) customQuestions.push({ question: 'Can you pass a drug screening?', answer: String(drugAnswer) });
    
    const over21Answer = application.over_21 || application.age;
    if (over21Answer) customQuestions.push({ question: 'Are you over 21 years of age?', answer: String(over21Answer) });
    
    if (application.veteran) customQuestions.push({ question: 'Are you a veteran?', answer: String(application.veteran) });
    
    const consentAnswer = application.consent;
    if (consentAnswer) customQuestions.push({ question: 'Do you consent to data processing?', answer: String(consentAnswer) });
    
    const privacyAnswer = application.privacy || application.agree_privacy_policy;
    if (privacyAnswer) customQuestions.push({ question: 'Do you agree to the privacy policy?', answer: String(privacyAnswer) });
    
    if (application.consent_to_sms) customQuestions.push({ question: 'Do you consent to SMS communication?', answer: String(application.consent_to_sms) });
    
    if (application.background_check_consent) customQuestions.push({ question: 'Do you consent to background check?', answer: String(application.background_check_consent) });

    // Merge any existing custom_questions JSON
    if (application.custom_questions && typeof application.custom_questions === 'object') {
      for (const [key, value] of Object.entries(application.custom_questions as Record<string, unknown>)) {
        if (value !== null && value !== undefined) {
          customQuestions.push({ question: key, answer: String(value) });
        }
      }
    }

    if (customQuestions.length > 0) {
      xml += `
    <CustomQuestions>`;
      for (const cq of customQuestions) {
        xml += `
      <CustomQuestion>
        <Question>${this.escapeXml(cq.question)}</Question>
        <Answer>${this.escapeXml(cq.answer)}</Answer>
      </CustomQuestion>`;
      }
      xml += `
    </CustomQuestions>`;
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
   * Extract clean brand name from referral_source URL
   */
  protected extractBrandName(referralSource?: string, fallbackSource?: string): string {
    const brandMap: Record<string, string> = {
      'ziprecruiter.com': 'ZipRecruiter',
      'indeed.com': 'Indeed',
      'linkedin.com': 'LinkedIn',
      'facebook.com': 'Facebook',
      'craigslist.org': 'Craigslist',
      'google.com': 'Google',
    };

    if (referralSource) {
      try {
        const url = new URL(referralSource);
        const hostname = url.hostname.replace(/^www\./, '');
        if (brandMap[hostname]) return brandMap[hostname];
        // Capitalize first part of domain
        const domainName = hostname.split('.')[0];
        return domainName.charAt(0).toUpperCase() + domainName.slice(1);
      } catch {
        // Not a valid URL, use as-is
        return referralSource;
      }
    }

    return fallbackSource || 'ATS.me';
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
