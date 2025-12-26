/**
 * HireRight Background Check Adapter
 * Implements direct integration with HireRight's REST API
 * 
 * API Documentation: https://developer.hireright.com/
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
// HireRight-specific Types
// ============================================================================

interface HireRightApplicant {
  applicantId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

interface HireRightOrder {
  orderId: string;
  applicantId: string;
  packageCode: string;
  orderStatus: string;
  overallResult?: string;
  createdDate: string;
  completedDate?: string;
  reportLink?: string;
  services: HireRightService[];
}

interface HireRightService {
  serviceId: string;
  serviceType: string;
  status: string;
  result?: string;
}

interface HireRightWebhookEvent {
  eventId: string;
  eventType: string;
  orderId: string;
  applicantId: string;
  orderStatus: string;
  overallResult?: string;
  timestamp: string;
}

export class HireRightAdapter extends BaseBGCAdapter {
  constructor(config: BGCAdapterConfig) {
    super(config);
  }
  
  // ============================================================================
  // Core API Methods
  // ============================================================================
  
  async createCandidate(candidate: CandidateData): Promise<BGCResponse> {
    try {
      const applicant = await this.executeWithRetry(
        () => this.makeRequest<HireRightApplicant>('/applicants', {
          method: 'POST',
          body: JSON.stringify(this.mapCandidateToHireRight(candidate)),
        }),
        'createApplicant'
      );
      
      this.log('info', 'Applicant created in HireRight', { 
        applicantId: applicant.applicantId 
      });
      
      return this.createSuccessResponse({
        candidate_id: applicant.applicantId,
        status: 'pending',
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'CANDIDATE_CREATE_FAILED');
    }
  }
  
  async initiateCheck(request: BGCRequest): Promise<BGCResponse> {
    try {
      // Create applicant first if needed
      let applicantId = request.candidate.custom_id;
      
      if (!applicantId) {
        const applicantResponse = await this.createCandidate(request.candidate);
        if (!applicantResponse.success) {
          return applicantResponse;
        }
        applicantId = applicantResponse.candidate_id;
      }
      
      // Determine package
      const packageCode = this.determinePackage(request.check_types, request.package_name);
      
      // Create order
      const order = await this.executeWithRetry(
        () => this.makeRequest<HireRightOrder>('/orders', {
          method: 'POST',
          body: JSON.stringify({
            applicantId,
            packageCode,
            clientReferenceId: request.candidate.application_id,
            accountId: this.config.connection.credentials.account_id,
          }),
        }),
        'createOrder'
      );
      
      this.log('info', 'Order created in HireRight', { 
        orderId: order.orderId,
        applicantId,
        packageCode,
      });
      
      return this.createSuccessResponse({
        external_id: order.orderId,
        candidate_id: applicantId,
        status: this.mapStatus(order.orderStatus),
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'CHECK_INITIATE_FAILED');
    }
  }
  
  async getStatus(externalId: string): Promise<BGCResponse> {
    try {
      const order = await this.executeWithRetry(
        () => this.makeRequest<HireRightOrder>(`/orders/${externalId}`),
        'getStatus'
      );
      
      return this.createSuccessResponse({
        external_id: order.orderId,
        candidate_id: order.applicantId,
        status: this.mapStatus(order.orderStatus),
        report_url: order.reportLink,
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'STATUS_FETCH_FAILED');
    }
  }
  
  async getReport(externalId: string): Promise<BGCReport> {
    const order = await this.executeWithRetry(
      () => this.makeRequest<HireRightOrder>(`/orders/${externalId}`),
      'getReport'
    );
    
    return {
      id: order.orderId,
      external_id: order.orderId,
      status: this.mapStatus(order.orderStatus),
      result: this.mapResult(order.overallResult),
      completed_at: order.completedDate,
      report_url: order.reportLink,
      checks: order.services.map(s => ({
        type: this.mapServiceType(s.serviceType),
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
      const event: HireRightWebhookEvent = JSON.parse(payload);
      
      return {
        valid: true,
        payload: {
          provider: 'hireright',
          event_type: event.eventType,
          external_id: event.orderId,
          candidate_id: event.applicantId,
          status: this.mapStatus(event.orderStatus),
          result: this.mapResult(event.overallResult),
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
      await this.makeRequest<{ status: string }>('/health');
      
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
  
  private mapCandidateToHireRight(candidate: CandidateData): Record<string, unknown> {
    return {
      firstName: candidate.first_name,
      middleName: candidate.middle_name,
      lastName: candidate.last_name,
      email: candidate.email,
      phone: this.formatPhone(candidate.phone),
      dateOfBirth: this.formatDate(candidate.date_of_birth),
      ssn: candidate.ssn?.replace(/\D/g, ''),
      address: {
        line1: candidate.address_line1,
        line2: candidate.address_line2,
        city: candidate.city,
        stateProvince: candidate.state,
        postalCode: candidate.zip,
        country: candidate.country || 'US',
      },
      driversLicense: candidate.driver_license_number ? {
        number: candidate.driver_license_number,
        issuingState: candidate.driver_license_state,
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
      return 'HR_DRIVER_PKG';
    }
    if (checkSet.has('employment') || checkSet.has('education')) {
      return 'HR_PROFESSIONAL_PKG';
    }
    
    return 'HR_CRIMINAL_PKG';
  }
  
  private mapResult(result?: string): 'clear' | 'consider' | 'adverse' | 'pending' | 'error' {
    if (!result) return 'pending';
    
    const resultMap: Record<string, 'clear' | 'consider' | 'adverse' | 'pending' | 'error'> = {
      'ELIGIBLE': 'clear',
      'CLEAR': 'clear',
      'REVIEW': 'consider',
      'INELIGIBLE': 'adverse',
      'PENDING': 'pending',
      'ERROR': 'error',
    };
    
    return resultMap[result.toUpperCase()] || 'pending';
  }
  
  private mapServiceType(type: string): CheckType {
    const typeMap: Record<string, CheckType> = {
      'CRIMINAL_SEARCH': 'criminal',
      'SSN_VERIFICATION': 'ssn_trace',
      'MOTOR_VEHICLE': 'mvr',
      'EMPLOYMENT_VERIFICATION': 'employment',
      'EDUCATION_VERIFICATION': 'education',
      'DRUG_SCREENING': 'drug',
      'CREDIT_CHECK': 'credit',
    };
    
    return typeMap[type.toUpperCase()] || 'criminal';
  }
  
  protected buildUrl(path: string, params?: Record<string, string>): string {
    let baseUrl = this.isTestMode
      ? 'https://api-sandbox.hireright.com/v1'
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
