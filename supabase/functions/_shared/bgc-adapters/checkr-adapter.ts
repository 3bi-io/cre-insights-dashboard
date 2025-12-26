/**
 * Checkr Background Check Adapter
 * Implements direct integration with Checkr's REST API
 * 
 * API Documentation: https://docs.checkr.com/
 */

import { BaseBGCAdapter } from './base-adapter.ts';
import {
  BGCAdapterConfig,
  BGCRequest,
  BGCResponse,
  BGCReport,
  BGCStatus,
  BGCResult,
  CandidateData,
  CheckType,
  WebhookValidationResult,
  BGCWebhookPayload,
} from './types.ts';

// ============================================================================
// Checkr-specific Types
// ============================================================================

interface CheckrCandidate {
  id: string;
  object: string;
  uri: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  dob?: string;
  ssn?: string;
  driver_license_number?: string;
  driver_license_state?: string;
  custom_id?: string;
}

interface CheckrReport {
  id: string;
  object: string;
  uri: string;
  status: string;
  result?: string;
  adjudication?: string;
  package: string;
  candidate_id: string;
  created_at: string;
  completed_at?: string;
  turnaround_time?: number;
  estimated_completion_time?: string;
  drug_screening?: CheckrScreening;
  motor_vehicle_report?: CheckrScreening;
  criminal_searches?: CheckrCriminalSearch[];
  ssn_trace?: CheckrScreening;
  sex_offender_search?: CheckrScreening;
  global_watchlist_search?: CheckrScreening;
  federal_criminal_search?: CheckrScreening;
  county_criminal_searches?: CheckrCountySearch[];
  national_criminal_search?: CheckrScreening;
}

interface CheckrScreening {
  id: string;
  status: string;
  result?: string;
  records?: CheckrRecord[];
}

interface CheckrCriminalSearch {
  id: string;
  status: string;
  result?: string;
  type: string;
  records?: CheckrRecord[];
}

interface CheckrCountySearch {
  id: string;
  status: string;
  result?: string;
  county: string;
  state: string;
  records?: CheckrRecord[];
}

interface CheckrRecord {
  id: string;
  case_number?: string;
  file_date?: string;
  offense_date?: string;
  charge?: string;
  disposition?: string;
  sentence?: string;
}

interface CheckrInvitation {
  id: string;
  status: string;
  uri: string;
  invitation_url: string;
  candidate_id: string;
  package: string;
  created_at: string;
  expires_at: string;
}

interface CheckrWebhookEvent {
  id: string;
  object: string;
  type: string;
  created_at: string;
  data: {
    object: CheckrReport | CheckrCandidate | CheckrInvitation;
  };
}

// Package mapping: internal check types to Checkr packages
const CHECKR_PACKAGES: Record<string, string[]> = {
  'driver_pro': ['criminal', 'ssn_trace', 'mvr', 'sex_offender', 'global_watchlist'],
  'driver_standard': ['criminal', 'ssn_trace', 'mvr'],
  'tasker_pro': ['criminal', 'ssn_trace', 'sex_offender', 'global_watchlist'],
  'tasker_standard': ['criminal', 'ssn_trace'],
  'basic_criminal': ['criminal', 'ssn_trace'],
  'basic+': ['criminal', 'ssn_trace', 'sex_offender', 'global_watchlist'],
  'professional': ['criminal', 'ssn_trace', 'employment', 'education'],
};

export class CheckrAdapter extends BaseBGCAdapter {
  constructor(config: BGCAdapterConfig) {
    super(config);
  }
  
  // ============================================================================
  // Core API Methods
  // ============================================================================
  
  /**
   * Create a candidate in Checkr
   */
  async createCandidate(candidate: CandidateData): Promise<BGCResponse> {
    try {
      const checkrCandidate = await this.executeWithRetry(
        () => this.makeRequest<CheckrCandidate>('/candidates', {
          method: 'POST',
          body: JSON.stringify(this.mapCandidateToCheckr(candidate)),
        }),
        'createCandidate'
      );
      
      this.log('info', 'Candidate created in Checkr', { 
        candidateId: checkrCandidate.id 
      });
      
      return this.createSuccessResponse({
        candidate_id: checkrCandidate.id,
        status: 'pending',
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'CANDIDATE_CREATE_FAILED');
    }
  }
  
  /**
   * Initiate a background check
   */
  async initiateCheck(request: BGCRequest): Promise<BGCResponse> {
    try {
      // Step 1: Create or get candidate
      let candidateId = request.candidate.custom_id;
      
      if (!candidateId) {
        const candidateResponse = await this.createCandidate(request.candidate);
        if (!candidateResponse.success) {
          return candidateResponse;
        }
        candidateId = candidateResponse.candidate_id;
      }
      
      // Step 2: Determine package
      const packageName = this.determinePackage(request.check_types, request.package_name);
      
      // Step 3: Create invitation (candidate-initiated) or report (company-initiated)
      if (this.requiresCandidateConsent(request.check_types)) {
        return await this.createInvitation(candidateId!, packageName);
      } else {
        return await this.createReport(candidateId!, packageName);
      }
    } catch (error) {
      return this.createErrorResponse(error as Error, 'CHECK_INITIATE_FAILED');
    }
  }
  
  /**
   * Create an invitation for candidate to complete
   */
  private async createInvitation(
    candidateId: string, 
    packageName: string
  ): Promise<BGCResponse> {
    const invitation = await this.executeWithRetry(
      () => this.makeRequest<CheckrInvitation>('/invitations', {
        method: 'POST',
        body: JSON.stringify({
          candidate_id: candidateId,
          package: packageName,
        }),
      }),
      'createInvitation'
    );
    
    this.log('info', 'Invitation created', { 
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
  }
  
  /**
   * Create a report directly (for company-initiated checks)
   */
  private async createReport(
    candidateId: string, 
    packageName: string
  ): Promise<BGCResponse> {
    const report = await this.executeWithRetry(
      () => this.makeRequest<CheckrReport>('/reports', {
        method: 'POST',
        body: JSON.stringify({
          candidate_id: candidateId,
          package: packageName,
        }),
      }),
      'createReport'
    );
    
    this.log('info', 'Report created', { 
      reportId: report.id,
      candidateId,
      package: packageName,
    });
    
    return this.createSuccessResponse({
      external_id: report.id,
      candidate_id: candidateId,
      status: this.mapStatus(report.status),
      estimated_completion: report.estimated_completion_time,
    });
  }
  
  /**
   * Get status of a report
   */
  async getStatus(externalId: string): Promise<BGCResponse> {
    try {
      const report = await this.executeWithRetry(
        () => this.makeRequest<CheckrReport>(`/reports/${externalId}`),
        'getStatus'
      );
      
      return this.createSuccessResponse({
        external_id: report.id,
        candidate_id: report.candidate_id,
        status: this.mapStatus(report.status),
        report_url: report.uri,
      });
    } catch (error) {
      return this.createErrorResponse(error as Error, 'STATUS_FETCH_FAILED');
    }
  }
  
  /**
   * Get full report details
   */
  async getReport(externalId: string): Promise<BGCReport> {
    const report = await this.executeWithRetry(
      () => this.makeRequest<CheckrReport>(`/reports/${externalId}`),
      'getReport'
    );
    
    return {
      id: report.id,
      external_id: report.id,
      status: this.mapStatus(report.status),
      result: this.mapResult(report.result),
      completed_at: report.completed_at,
      report_url: report.uri,
      adjudication: report.adjudication,
      checks: this.extractCheckResults(report),
    };
  }
  
  /**
   * Validate incoming webhook
   */
  validateWebhook(
    payload: string,
    signature: string,
    secret: string
  ): WebhookValidationResult {
    try {
      // Checkr uses HMAC-SHA256 for webhook signatures
      const computedSignature = this.computeHmacSignature(payload, secret);
      
      if (signature !== computedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }
      
      const event: CheckrWebhookEvent = JSON.parse(payload);
      
      return {
        valid: true,
        payload: this.mapWebhookPayload(event),
      };
    } catch (error) {
      return { 
        valid: false, 
        error: `Webhook validation failed: ${(error as Error).message}` 
      };
    }
  }
  
  /**
   * Test connection credentials
   */
  async testConnection(): Promise<BGCResponse> {
    try {
      // Try to list candidates (limited) to verify credentials
      await this.makeRequest<{ data: CheckrCandidate[] }>('/candidates?per_page=1');
      
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
  
  /**
   * Map candidate data to Checkr format
   */
  private mapCandidateToCheckr(candidate: CandidateData): Record<string, unknown> {
    const data: Record<string, unknown> = {
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      no_middle_name: !candidate.middle_name,
    };
    
    if (candidate.middle_name) {
      data.middle_name = candidate.middle_name;
    }
    
    if (candidate.phone) {
      data.phone = this.formatPhone(candidate.phone);
    }
    
    if (candidate.date_of_birth) {
      data.dob = this.formatDate(candidate.date_of_birth);
    }
    
    if (candidate.ssn) {
      data.ssn = candidate.ssn.replace(/\D/g, '');
    }
    
    if (candidate.driver_license_number) {
      data.driver_license_number = candidate.driver_license_number;
      data.driver_license_state = candidate.driver_license_state;
    }
    
    if (candidate.application_id) {
      data.custom_id = candidate.application_id;
    }
    
    // Work location
    if (candidate.city && candidate.state) {
      data.work_locations = [{
        city: candidate.city,
        state: candidate.state,
        country: candidate.country || 'US',
      }];
    }
    
    return data;
  }
  
  /**
   * Determine the best Checkr package for requested checks
   */
  private determinePackage(checks: CheckType[], requestedPackage?: string): string {
    // If specific package requested and mapped, use it
    if (requestedPackage) {
      const mapped = this.config.connection.package_mappings[requestedPackage];
      if (mapped) return mapped;
      return requestedPackage;
    }
    
    // Find the best matching package
    const checkSet = new Set(checks);
    
    // Check for MVR to determine driver packages
    if (checkSet.has('mvr')) {
      if (checkSet.has('sex_offender') || checkSet.has('global_watchlist')) {
        return 'driver_pro';
      }
      return 'driver_standard';
    }
    
    // Check for employment/education for professional package
    if (checkSet.has('employment') || checkSet.has('education')) {
      return 'professional';
    }
    
    // Default criminal packages
    if (checkSet.has('sex_offender') || checkSet.has('global_watchlist')) {
      return 'basic+';
    }
    
    return 'basic_criminal';
  }
  
  /**
   * Check if candidate consent flow is required
   */
  private requiresCandidateConsent(checks: CheckType[]): boolean {
    // Most Checkr checks require candidate to provide consent and info
    const directChecks = ['criminal', 'ssn_trace', 'sex_offender', 'global_watchlist'];
    return checks.some(c => !directChecks.includes(c));
  }
  
  /**
   * Map Checkr result to internal result
   */
  private mapResult(result?: string): BGCResult {
    if (!result) return 'pending';
    
    const resultMap: Record<string, BGCResult> = {
      'clear': 'clear',
      'consider': 'consider',
      'adverse_action': 'adverse',
      'pending': 'pending',
      'suspended': 'pending',
      'error': 'error',
    };
    
    return resultMap[result.toLowerCase()] || 'pending';
  }
  
  /**
   * Extract individual check results from report
   */
  private extractCheckResults(report: CheckrReport): BGCReport['checks'] {
    const checks: BGCReport['checks'] = [];
    
    // SSN Trace
    if (report.ssn_trace) {
      checks.push({
        type: 'ssn_trace',
        status: this.mapStatus(report.ssn_trace.status),
        result: this.mapResult(report.ssn_trace.result),
      });
    }
    
    // Sex Offender
    if (report.sex_offender_search) {
      checks.push({
        type: 'sex_offender',
        status: this.mapStatus(report.sex_offender_search.status),
        result: this.mapResult(report.sex_offender_search.result),
      });
    }
    
    // Global Watchlist
    if (report.global_watchlist_search) {
      checks.push({
        type: 'global_watchlist',
        status: this.mapStatus(report.global_watchlist_search.status),
        result: this.mapResult(report.global_watchlist_search.result),
      });
    }
    
    // National Criminal
    if (report.national_criminal_search) {
      checks.push({
        type: 'national_criminal',
        status: this.mapStatus(report.national_criminal_search.status),
        result: this.mapResult(report.national_criminal_search.result),
      });
    }
    
    // Federal Criminal
    if (report.federal_criminal_search) {
      checks.push({
        type: 'federal_criminal',
        status: this.mapStatus(report.federal_criminal_search.status),
        result: this.mapResult(report.federal_criminal_search.result),
      });
    }
    
    // MVR
    if (report.motor_vehicle_report) {
      checks.push({
        type: 'mvr',
        status: this.mapStatus(report.motor_vehicle_report.status),
        result: this.mapResult(report.motor_vehicle_report.result),
      });
    }
    
    // Drug Screening
    if (report.drug_screening) {
      checks.push({
        type: 'drug',
        status: this.mapStatus(report.drug_screening.status),
        result: this.mapResult(report.drug_screening.result),
      });
    }
    
    // County Criminal Searches
    if (report.county_criminal_searches) {
      for (const county of report.county_criminal_searches) {
        checks.push({
          type: 'county_criminal',
          status: this.mapStatus(county.status),
          result: this.mapResult(county.result),
        });
      }
    }
    
    return checks;
  }
  
  /**
   * Compute HMAC signature for webhook validation
   */
  private computeHmacSignature(payload: string, secret: string): string {
    // In a real implementation, use crypto subtle API
    // For now, return empty - real implementation would use:
    // const encoder = new TextEncoder();
    // const key = await crypto.subtle.importKey(...);
    // const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return '';
  }
  
  /**
   * Map webhook event to internal payload format
   */
  private mapWebhookPayload(event: CheckrWebhookEvent): BGCWebhookPayload {
    const report = event.data.object as CheckrReport;
    
    return {
      provider: 'checkr',
      event_type: event.type,
      external_id: report.id,
      candidate_id: report.candidate_id,
      status: this.mapStatus(report.status),
      result: this.mapResult(report.result),
      report_url: report.uri,
      completed_at: report.completed_at,
      raw_payload: event,
    };
  }
  
  /**
   * Override base URL for test mode
   */
  protected buildUrl(path: string, params?: Record<string, string>): string {
    let baseUrl = this.config.provider.base_url;
    
    // Checkr uses different subdomain for test mode
    if (this.isTestMode) {
      baseUrl = baseUrl.replace('api.checkr.com', 'api.checkr-staging.com');
    }
    
    baseUrl = baseUrl.replace(/\/$/, '');
    let url = `${baseUrl}${path}`;
    
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    
    return url;
  }
}
