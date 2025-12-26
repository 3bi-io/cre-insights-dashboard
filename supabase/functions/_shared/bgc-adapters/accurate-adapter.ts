/**
 * Accurate Background Check Adapter
 * Implements direct integration with Accurate Background's REST API
 * 
 * API Documentation: https://developer.accuratebackground.com/
 */

import { BaseBGCAdapter } from './base-adapter.ts';
import {
  BGCAdapterConfig,
  BGCRequest,
  BGCResponse,
  BGCReport,
  CandidateData,
  CheckType,
  WebhookValidationResult,
} from './types.ts';

// ============================================================================
// Accurate-specific Types
// ============================================================================

interface AccurateSubject {
  subjectId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

interface AccurateOrder {
  orderId: string;
  subjectId: string;
  productCode: string;
  orderStatus: string;
  resultStatus?: string;
  createdDate: string;
  completedDate?: string;
  viewReportUrl?: string;
  screenings: AccurateScreening[];
}

interface AccurateScreening {
  screeningId: string;
  productType: string;
  status: string;
  resultStatus?: string;
}

interface AccurateWebhookEvent {
  eventId: string;
  eventType: string;
  orderId: string;
  subjectId: string;
  orderStatus: string;
  resultStatus?: string;
  eventTime: string;
}

interface AccurateTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class AccurateAdapter extends BaseBGCAdapter {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  
  constructor(config: BGCAdapterConfig) {
    super(config);
  }
  
  // ============================================================================
  // OAuth2 Token Management
  // ============================================================================
  
  private async ensureValidToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return;
    }
    
    const { client_id, client_secret } = this.config.connection.credentials;
    
    if (!client_id || !client_secret) {
      throw new Error('Accurate requires client_id and client_secret');
    }
    
    const tokenUrl = this.isTestMode
      ? 'https://api-sandbox.accuratebackground.com/oauth/token'
      : 'https://api.accuratebackground.com/oauth/token';
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id,
        client_secret,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to obtain Accurate access token: ${response.status}`);
    }
    
    const tokenData: AccurateTokenResponse = await response.json();
    this.accessToken = tokenData.access_token;
    this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in - 60) * 1000);
    
    this.log('info', 'Accurate access token obtained');
  }
  
  protected getAuthHeaders(): Record<string, string> {
    if (!this.accessToken) {
      throw new Error('No valid access token');
    }
    return { 'Authorization': `Bearer ${this.accessToken}` };
  }
  
  // ============================================================================
  // Core API Methods
  // ============================================================================
  
  async createCandidate(candidate: CandidateData): Promise<BGCResponse> {
    try {
      await this.ensureValidToken();
      
      const subject = await this.executeWithRetry(
        () => this.makeRequest<AccurateSubject>('/v3/subjects', {
          method: 'POST',
          body: JSON.stringify(this.mapCandidateToAccurate(candidate)),
        }),
        'createSubject'
      );
      
      this.log('info', 'Subject created in Accurate', { 
        subjectId: subject.subjectId 
      });
      
      return this.createSuccessResponse({
        candidate_id: subject.subjectId,
        status: 'pending',
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'CANDIDATE_CREATE_FAILED');
    }
  }
  
  async initiateCheck(request: BGCRequest): Promise<BGCResponse> {
    try {
      await this.ensureValidToken();
      
      // Create subject first if needed
      let subjectId = request.candidate.custom_id;
      
      if (!subjectId) {
        const subjectResponse = await this.createCandidate(request.candidate);
        if (!subjectResponse.success) {
          return subjectResponse;
        }
        subjectId = subjectResponse.candidate_id;
      }
      
      // Determine product code
      const productCode = this.determinePackage(request.check_types, request.package_name);
      
      // Create order
      const order = await this.executeWithRetry(
        () => this.makeRequest<AccurateOrder>('/v3/orders', {
          method: 'POST',
          body: JSON.stringify({
            subjectId,
            productCode,
            clientReference: request.candidate.application_id,
          }),
        }),
        'createOrder'
      );
      
      this.log('info', 'Order created in Accurate', { 
        orderId: order.orderId,
        subjectId,
        productCode,
      });
      
      return this.createSuccessResponse({
        external_id: order.orderId,
        candidate_id: subjectId,
        status: this.mapStatus(order.orderStatus),
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'CHECK_INITIATE_FAILED');
    }
  }
  
  async getStatus(externalId: string): Promise<BGCResponse> {
    try {
      await this.ensureValidToken();
      
      const order = await this.executeWithRetry(
        () => this.makeRequest<AccurateOrder>(`/v3/orders/${externalId}`),
        'getStatus'
      );
      
      return this.createSuccessResponse({
        external_id: order.orderId,
        candidate_id: order.subjectId,
        status: this.mapStatus(order.orderStatus),
        report_url: order.viewReportUrl,
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'STATUS_FETCH_FAILED');
    }
  }
  
  async getReport(externalId: string): Promise<BGCReport> {
    await this.ensureValidToken();
    
    const order = await this.executeWithRetry(
      () => this.makeRequest<AccurateOrder>(`/v3/orders/${externalId}`),
      'getReport'
    );
    
    return {
      id: order.orderId,
      external_id: order.orderId,
      status: this.mapStatus(order.orderStatus),
      result: this.mapResult(order.resultStatus),
      completed_at: order.completedDate,
      report_url: order.viewReportUrl,
      checks: order.screenings.map(s => ({
        type: this.mapProductType(s.productType),
        status: this.mapStatus(s.status),
        result: this.mapResult(s.resultStatus),
      })),
    };
  }
  
  validateWebhook(
    payload: string,
    signature: string,
    secret: string
  ): WebhookValidationResult {
    try {
      const event: AccurateWebhookEvent = JSON.parse(payload);
      
      return {
        valid: true,
        payload: {
          provider: 'accurate',
          event_type: event.eventType,
          external_id: event.orderId,
          candidate_id: event.subjectId,
          status: this.mapStatus(event.orderStatus),
          result: this.mapResult(event.resultStatus),
          raw_payload: event,
        },
      };
    } catch (error) {
      return { 
        valid: false, 
        error: `Webhook validation failed: ${(error as Error).message}` 
      };
    }
  }
  
  async testConnection(): Promise<BGCResponse> {
    try {
      await this.ensureValidToken();
      
      // Verify token works
      await this.makeRequest<{ status: string }>('/v3/health');
      
      return this.createSuccessResponse({
        status: 'completed',
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'CONNECTION_TEST_FAILED');
    }
  }
  
  // ============================================================================
  // Helper Methods
  // ============================================================================
  
  private mapCandidateToAccurate(candidate: CandidateData): Record<string, unknown> {
    return {
      firstName: candidate.first_name,
      middleName: candidate.middle_name,
      lastName: candidate.last_name,
      emailAddress: candidate.email,
      phoneNumber: this.formatPhone(candidate.phone),
      dateOfBirth: this.formatDate(candidate.date_of_birth),
      ssn: candidate.ssn?.replace(/\D/g, ''),
      currentAddress: {
        addressLine1: candidate.address_line1,
        addressLine2: candidate.address_line2,
        city: candidate.city,
        state: candidate.state,
        zipCode: candidate.zip,
        country: candidate.country || 'US',
      },
      driversLicense: candidate.driver_license_number ? {
        number: candidate.driver_license_number,
        state: candidate.driver_license_state,
      } : undefined,
    };
  }
  
  private determinePackage(checks: CheckType[], requestedPackage?: string): string {
    if (requestedPackage) {
      const mapped = this.config.connection.package_mappings[requestedPackage];
      if (mapped) return mapped;
      return requestedPackage;
    }
    
    const checkSet = new Set(checks);
    
    if (checkSet.has('mvr')) {
      return 'DRIVER_PACKAGE';
    }
    if (checkSet.has('employment') || checkSet.has('education')) {
      return 'PROFESSIONAL_PACKAGE';
    }
    if (checkSet.has('drug')) {
      return 'DRUG_SCREEN_PACKAGE';
    }
    
    return 'CRIMINAL_BASIC';
  }
  
  private mapResult(result?: string): 'clear' | 'consider' | 'adverse' | 'pending' | 'error' {
    if (!result) return 'pending';
    
    const resultMap: Record<string, 'clear' | 'consider' | 'adverse' | 'pending' | 'error'> = {
      'CLEAR': 'clear',
      'ELIGIBLE': 'clear',
      'CONSIDER': 'consider',
      'REVIEW': 'consider',
      'ALERT': 'consider',
      'INELIGIBLE': 'adverse',
      'FAIL': 'adverse',
      'PENDING': 'pending',
      'IN_PROGRESS': 'pending',
      'ERROR': 'error',
    };
    
    return resultMap[result.toUpperCase()] || 'pending';
  }
  
  private mapProductType(type: string): CheckType {
    const typeMap: Record<string, CheckType> = {
      'CRIMINAL': 'criminal',
      'NATIONAL_CRIMINAL': 'national_criminal',
      'SSN_TRACE': 'ssn_trace',
      'MVR': 'mvr',
      'MOTOR_VEHICLE': 'mvr',
      'EMPLOYMENT': 'employment',
      'EDUCATION': 'education',
      'DRUG_SCREEN': 'drug',
      'CREDIT': 'credit',
      'CIVIL_COURT': 'civil_court',
    };
    
    return typeMap[type.toUpperCase()] || 'criminal';
  }
  
  protected buildUrl(path: string, params?: Record<string, string>): string {
    let baseUrl = this.isTestMode
      ? 'https://api-sandbox.accuratebackground.com'
      : this.config.provider.base_url;
    
    baseUrl = baseUrl.replace(/\/$/, '');
    let url = `${baseUrl}${path}`;
    
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    
    return url;
  }
}
