/**
 * Sterling Background Check Adapter
 * Implements direct integration with Sterling's REST API
 * 
 * API Documentation: https://developer.sterlingcheck.com/
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
  BGCWebhookPayload,
} from './types.ts';

// ============================================================================
// Sterling-specific Types
// ============================================================================

interface SterlingCandidate {
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

interface SterlingOrder {
  orderId: string;
  candidateId: string;
  packageId: string;
  status: string;
  result?: string;
  orderDate: string;
  completedDate?: string;
  reportUrl?: string;
  screenings: SterlingScreening[];
}

interface SterlingScreening {
  screeningId: string;
  screeningType: string;
  status: string;
  result?: string;
  completedDate?: string;
}

interface SterlingWebhookEvent {
  eventId: string;
  eventType: string;
  orderId: string;
  candidateId: string;
  status: string;
  result?: string;
  timestamp: string;
}

interface SterlingTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class SterlingAdapter extends BaseBGCAdapter {
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
      throw new Error('Sterling requires client_id and client_secret');
    }
    
    const tokenUrl = this.isTestMode
      ? 'https://api-sandbox.sterlingcheck.com/oauth/token'
      : 'https://api.sterlingcheck.com/oauth/token';
    
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
      throw new Error(`Failed to obtain Sterling access token: ${response.status}`);
    }
    
    const tokenData: SterlingTokenResponse = await response.json();
    this.accessToken = tokenData.access_token;
    this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in - 60) * 1000);
    
    this.log('info', 'Sterling access token obtained');
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
      
      const sterlingCandidate = await this.executeWithRetry(
        () => this.makeRequest<SterlingCandidate>('/v2/candidates', {
          method: 'POST',
          body: JSON.stringify(this.mapCandidateToSterling(candidate)),
        }),
        'createCandidate'
      );
      
      this.log('info', 'Candidate created in Sterling', { 
        candidateId: sterlingCandidate.candidateId 
      });
      
      return this.createSuccessResponse({
        candidate_id: sterlingCandidate.candidateId,
        status: 'pending',
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'CANDIDATE_CREATE_FAILED');
    }
  }
  
  async initiateCheck(request: BGCRequest): Promise<BGCResponse> {
    try {
      await this.ensureValidToken();
      
      // Create candidate first if needed
      let candidateId = request.candidate.custom_id;
      
      if (!candidateId) {
        const candidateResponse = await this.createCandidate(request.candidate);
        if (!candidateResponse.success) {
          return candidateResponse;
        }
        candidateId = candidateResponse.candidate_id;
      }
      
      // Determine package
      const packageId = this.determinePackage(request.check_types, request.package_name);
      
      // Create order
      const order = await this.executeWithRetry(
        () => this.makeRequest<SterlingOrder>('/v2/orders', {
          method: 'POST',
          body: JSON.stringify({
            candidateId,
            packageId,
            clientReferenceId: request.candidate.application_id,
          }),
        }),
        'createOrder'
      );
      
      this.log('info', 'Order created in Sterling', { 
        orderId: order.orderId,
        candidateId,
        packageId,
      });
      
      return this.createSuccessResponse({
        external_id: order.orderId,
        candidate_id: candidateId,
        status: this.mapStatus(order.status),
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'CHECK_INITIATE_FAILED');
    }
  }
  
  async getStatus(externalId: string): Promise<BGCResponse> {
    try {
      await this.ensureValidToken();
      
      const order = await this.executeWithRetry(
        () => this.makeRequest<SterlingOrder>(`/v2/orders/${externalId}`),
        'getStatus'
      );
      
      return this.createSuccessResponse({
        external_id: order.orderId,
        candidate_id: order.candidateId,
        status: this.mapStatus(order.status),
        report_url: order.reportUrl,
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'STATUS_FETCH_FAILED');
    }
  }
  
  async getReport(externalId: string): Promise<BGCReport> {
    await this.ensureValidToken();
    
    const order = await this.executeWithRetry(
      () => this.makeRequest<SterlingOrder>(`/v2/orders/${externalId}`),
      'getReport'
    );
    
    return {
      id: order.orderId,
      external_id: order.orderId,
      status: this.mapStatus(order.status),
      result: this.mapResult(order.result),
      completed_at: order.completedDate,
      report_url: order.reportUrl,
      checks: order.screenings.map(s => ({
        type: this.mapScreeningType(s.screeningType),
        status: this.mapStatus(s.status),
        result: this.mapResult(s.result),
      })),
    };
  }
  
  validateWebhook(
    payload: string,
    signature: string,
    secret: string
  ): WebhookValidationResult {
    try {
      // Sterling uses signature validation
      // Implement actual signature verification here
      
      const event: SterlingWebhookEvent = JSON.parse(payload);
      
      return {
        valid: true,
        payload: {
          provider: 'sterling',
          event_type: event.eventType,
          external_id: event.orderId,
          candidate_id: event.candidateId,
          status: this.mapStatus(event.status),
          result: this.mapResult(event.result),
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
      
      // Verify token works by making a simple API call
      await this.makeRequest<{ status: string }>('/v2/health');
      
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
  
  private mapCandidateToSterling(candidate: CandidateData): Record<string, unknown> {
    return {
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      middleName: candidate.middle_name,
      email: candidate.email,
      phoneNumber: this.formatPhone(candidate.phone),
      dateOfBirth: this.formatDate(candidate.date_of_birth),
      ssn: candidate.ssn?.replace(/\D/g, ''),
      address: {
        streetAddress1: candidate.address_line1,
        streetAddress2: candidate.address_line2,
        city: candidate.city,
        state: candidate.state,
        postalCode: candidate.zip,
        country: candidate.country || 'US',
      },
      driverLicense: candidate.driver_license_number ? {
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
    
    // Sterling package mapping
    const checkSet = new Set(checks);
    
    if (checkSet.has('mvr')) {
      return 'DRIVER_STANDARD';
    }
    if (checkSet.has('employment') || checkSet.has('education')) {
      return 'PROFESSIONAL';
    }
    
    return 'STANDARD_CRIMINAL';
  }
  
  private mapResult(result?: string): 'clear' | 'consider' | 'adverse' | 'pending' | 'error' {
    if (!result) return 'pending';
    
    const resultMap: Record<string, 'clear' | 'consider' | 'adverse' | 'pending' | 'error'> = {
      'CLEAR': 'clear',
      'ALERT': 'consider',
      'REVIEW': 'consider',
      'FAIL': 'adverse',
      'PENDING': 'pending',
      'ERROR': 'error',
    };
    
    return resultMap[result.toUpperCase()] || 'pending';
  }
  
  private mapScreeningType(type: string): CheckType {
    const typeMap: Record<string, CheckType> = {
      'CRIMINAL': 'criminal',
      'SSN_TRACE': 'ssn_trace',
      'MVR': 'mvr',
      'EMPLOYMENT': 'employment',
      'EDUCATION': 'education',
      'DRUG': 'drug',
      'CREDIT': 'credit',
    };
    
    return typeMap[type.toUpperCase()] || 'criminal';
  }
  
  protected buildUrl(path: string, params?: Record<string, string>): string {
    let baseUrl = this.isTestMode
      ? 'https://api-sandbox.sterlingcheck.com'
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
