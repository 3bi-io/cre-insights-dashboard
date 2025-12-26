/**
 * GoodHire Background Check Adapter
 * Implements direct integration with GoodHire's REST API
 * 
 * API Documentation: https://developer.goodhire.com/
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
// GoodHire-specific Types
// ============================================================================

interface GoodHireCandidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
}

interface GoodHireReport {
  id: string;
  candidate_id: string;
  package: string;
  status: string;
  result?: string;
  created_at: string;
  completed_at?: string;
  report_url?: string;
  checks: GoodHireCheck[];
}

interface GoodHireCheck {
  id: string;
  type: string;
  status: string;
  result?: string;
}

interface GoodHireInvitation {
  id: string;
  candidate_id: string;
  invitation_url: string;
  status: string;
  expires_at: string;
}

interface GoodHireWebhookEvent {
  id: string;
  event: string;
  report_id: string;
  candidate_id: string;
  status: string;
  result?: string;
  occurred_at: string;
}

export class GoodHireAdapter extends BaseBGCAdapter {
  constructor(config: BGCAdapterConfig) {
    super(config);
  }
  
  // ============================================================================
  // Core API Methods
  // ============================================================================
  
  async createCandidate(candidate: CandidateData): Promise<BGCResponse> {
    try {
      const ghCandidate = await this.executeWithRetry(
        () => this.makeRequest<GoodHireCandidate>('/candidates', {
          method: 'POST',
          body: JSON.stringify(this.mapCandidateToGoodHire(candidate)),
        }),
        'createCandidate'
      );
      
      this.log('info', 'Candidate created in GoodHire', { 
        candidateId: ghCandidate.id 
      });
      
      return this.createSuccessResponse({
        candidate_id: ghCandidate.id,
        status: 'pending',
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'CANDIDATE_CREATE_FAILED');
    }
  }
  
  async initiateCheck(request: BGCRequest): Promise<BGCResponse> {
    try {
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
      const packageName = this.determinePackage(request.check_types, request.package_name);
      
      // Create invitation for candidate to complete
      const invitation = await this.executeWithRetry(
        () => this.makeRequest<GoodHireInvitation>('/invitations', {
          method: 'POST',
          body: JSON.stringify({
            candidate_id: candidateId,
            package: packageName,
            custom_id: request.candidate.application_id,
          }),
        }),
        'createInvitation'
      );
      
      this.log('info', 'Invitation created in GoodHire', { 
        invitationId: invitation.id,
        candidateId,
        package: packageName,
      });
      
      return this.createSuccessResponse({
        external_id: invitation.id,
        candidate_id: candidateId,
        status: 'waiting_on_candidate',
        candidate_portal_url: invitation.invitation_url,
        estimated_completion: invitation.expires_at,
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'CHECK_INITIATE_FAILED');
    }
  }
  
  async getStatus(externalId: string): Promise<BGCResponse> {
    try {
      const report = await this.executeWithRetry(
        () => this.makeRequest<GoodHireReport>(`/reports/${externalId}`),
        'getStatus'
      );
      
      return this.createSuccessResponse({
        external_id: report.id,
        candidate_id: report.candidate_id,
        status: this.mapStatus(report.status),
        report_url: report.report_url,
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'STATUS_FETCH_FAILED');
    }
  }
  
  async getReport(externalId: string): Promise<BGCReport> {
    const report = await this.executeWithRetry(
      () => this.makeRequest<GoodHireReport>(`/reports/${externalId}`),
      'getReport'
    );
    
    return {
      id: report.id,
      external_id: report.id,
      status: this.mapStatus(report.status),
      result: this.mapResult(report.result),
      completed_at: report.completed_at,
      report_url: report.report_url,
      checks: report.checks.map(c => ({
        type: this.mapCheckType(c.type),
        status: this.mapStatus(c.status),
        result: this.mapResult(c.result),
      })),
    };
  }
  
  validateWebhook(
    payload: string,
    signature: string,
    secret: string
  ): WebhookValidationResult {
    try {
      const event: GoodHireWebhookEvent = JSON.parse(payload);
      
      return {
        valid: true,
        payload: {
          provider: 'goodhire',
          event_type: event.event,
          external_id: event.report_id,
          candidate_id: event.candidate_id,
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
      await this.makeRequest<{ data: GoodHireCandidate[] }>('/candidates?limit=1');
      
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
  
  private mapCandidateToGoodHire(candidate: CandidateData): Record<string, unknown> {
    return {
      first_name: candidate.first_name,
      middle_name: candidate.middle_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: this.formatPhone(candidate.phone),
      date_of_birth: this.formatDate(candidate.date_of_birth),
      ssn: candidate.ssn?.replace(/\D/g, ''),
      address: {
        street: candidate.address_line1,
        street2: candidate.address_line2,
        city: candidate.city,
        state: candidate.state,
        zip: candidate.zip,
      },
      drivers_license: candidate.driver_license_number ? {
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
      return 'premium_plus_mvr';
    }
    if (checkSet.has('employment') || checkSet.has('education')) {
      return 'premium';
    }
    if (checkSet.size > 2) {
      return 'standard';
    }
    
    return 'basic';
  }
  
  private mapResult(result?: string): 'clear' | 'consider' | 'adverse' | 'pending' | 'error' {
    if (!result) return 'pending';
    
    const resultMap: Record<string, 'clear' | 'consider' | 'adverse' | 'pending' | 'error'> = {
      'clear': 'clear',
      'pass': 'clear',
      'consider': 'consider',
      'review': 'consider',
      'fail': 'adverse',
      'adverse': 'adverse',
      'pending': 'pending',
      'error': 'error',
    };
    
    return resultMap[result.toLowerCase()] || 'pending';
  }
  
  private mapCheckType(type: string): CheckType {
    const typeMap: Record<string, CheckType> = {
      'criminal': 'criminal',
      'ssn_trace': 'ssn_trace',
      'sex_offender': 'sex_offender',
      'mvr': 'mvr',
      'motor_vehicle': 'mvr',
      'employment': 'employment',
      'education': 'education',
      'drug': 'drug',
    };
    
    return typeMap[type.toLowerCase()] || 'criminal';
  }
  
  protected getAuthHeaders(): Record<string, string> {
    const apiKey = this.config.connection.credentials.api_key;
    return { 
      'Authorization': `Bearer ${apiKey}`,
      'X-GoodHire-Api-Key': apiKey || '',
    };
  }
  
  protected buildUrl(path: string, params?: Record<string, string>): string {
    let baseUrl = this.isTestMode
      ? 'https://api-sandbox.goodhire.com/v1'
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
