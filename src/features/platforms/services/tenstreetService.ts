import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type {
  TenstreetConfig,
  TenstreetData,
  TenstreetFieldMappings,
  PersonalData,
  CustomQuestion,
  DisplayField
} from '@/types/tenstreet';

/**
 * Applicant response from Tenstreet API
 */
export interface TenstreetApplicantResponse {
  driverId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  cdl?: string;
  experience?: string;
  status: string;
  appliedAt: string;
  data?: Record<string, unknown>;
}

/**
 * Data for creating a new applicant
 */
export interface ApplicantCreateData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  cdl?: string;
  experience?: string;
  [key: string]: unknown;
}

/**
 * Search parameters for applicant search
 */
export interface SearchParams {
  companyId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  driverId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

/**
 * MVR (Motor Vehicle Record) request options
 */
export interface MVROptions {
  companyId: string;
  state?: string;
  yearsBack?: number;
  provider?: string;
}

/**
 * Drug test request options
 */
export interface DrugTestOptions {
  companyId: string;
  testType?: 'pre-employment' | 'random' | 'post-accident' | 'reasonable-suspicion';
  provider?: string;
  schedulingNotes?: string;
}

/**
 * Xchange request and status types
 */
export interface XchangeRequest {
  id: string;
  requestType: string;
  status: string;
  driverId: string;
  referenceNumber?: string;
  requestDate: string;
  completionDate?: string;
  resultData?: Record<string, unknown>;
}

export interface XchangeStatus {
  requestId: string;
  status: string;
  progress: number;
  estimatedCompletion?: string;
  resultAvailable: boolean;
}

/**
 * Job and application types
 */
export interface Job {
  id: string;
  title: string;
  companyId: string;
  status: string;
  location?: string;
  requirements?: Record<string, unknown>;
}

export interface TenstreetApplication {
  id: string;
  jobId: string;
  driverId: string;
  status: string;
  appliedAt: string;
  data?: Record<string, unknown>;
}

export interface Assignment {
  driverId: string;
  jobId: string;
  assignedAt: string;
  status: string;
}

/**
 * Analytics types
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface Metrics {
  totalApplications: number;
  activeApplicants: number;
  hiredCount: number;
  averageTimeToHire: number;
  conversionRate: number;
  trends?: Array<{ date: string; value: number }>;
}

export interface SourceStats {
  sources: Array<{
    name: string;
    applicants: number;
    hired: number;
    conversionRate: number;
    avgQualityScore?: number;
  }>;
}

export interface FunnelData {
  stages: Array<{
    name: string;
    count: number;
    dropoffRate: number;
  }>;
}

export interface KPIData {
  costPerHire: number;
  timeToFill: number;
  qualityOfHire: number;
  applicantSatisfaction: number;
  recruiterEfficiency: number;
}

/**
 * Bulk operation types
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  errors?: string[];
  details?: Record<string, unknown>;
}

export interface BulkUpdateResult {
  success: boolean;
  updated: number;
  failed: number;
  errors?: string[];
}

export interface ExportCriteria {
  companyId: string;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  format?: 'csv' | 'excel' | 'json';
  fields?: string[];
}

export interface SyncResult {
  success: boolean;
  synced: number;
  errors?: string[];
  newApplicants: number;
  updatedApplicants: number;
}

/**
 * Document management types
 */
export interface Document {
  id: string;
  driverId: string;
  type: string;
  fileName: string;
  uploadedAt: string;
  url?: string;
  size?: number;
}

/**
 * Webhook types
 */
export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

export interface TestResult {
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  eventType: string;
  status: number;
  deliveredAt: string;
  error?: string;
}

/**
 * Connection and configuration types
 */
export interface ConnectionStatus {
  connected: boolean;
  companyId: string;
  apiVersion?: string;
  lastChecked: string;
  error?: string;
}

export interface Credentials {
  clientId: string;
  password: string;
  service: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export interface UsageStats {
  requestsToday: number;
  requestsThisMonth: number;
  quotaLimit?: number;
  quotaRemaining?: number;
  resetDate?: string;
}

/**
 * Base response wrapper
 */
export interface TenstreetResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Centralized service for all Tenstreet API operations
 * Provides a consistent interface for interacting with Tenstreet ATS
 */
export class TenstreetService {
  private static readonly EDGE_FUNCTION = 'tenstreet-integration';
  private static readonly EXPLORER_FUNCTION = 'tenstreet-explorer';
  private static readonly SYNC_FUNCTION = 'tenstreet-sync';

  /**
   * Make a request to a Tenstreet edge function
   */
  private static async callEdgeFunction<T>(
    functionName: string,
    payload: Record<string, unknown>
  ): Promise<TenstreetResponse<T>> {
    try {
      logger.info(`TenstreetService: Calling ${functionName}`, { action: payload.action });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return {
          success: false,
          error: 'Unauthorized: please sign in again',
          timestamp: new Date().toISOString(),
        };
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        logger.error(`TenstreetService: Edge function error in ${functionName}`, error);
        return {
          success: false,
          error: error.message || 'Edge function call failed',
          timestamp: new Date().toISOString()
        };
      }

      logger.info(`TenstreetService: ${functionName} completed successfully`);
      return {
        success: true,
        data: data as T,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`TenstreetService: Network error calling ${functionName}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // ============================================================================
  // APPLICANT MANAGEMENT
  // ============================================================================

  /**
   * Search for applicants using various criteria
   */
  static async searchApplicants(params: SearchParams): Promise<TenstreetResponse<TenstreetApplicantResponse[]>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'search_applicants',
      ...params
    });
  }

  /**
   * Get detailed data for a specific applicant
   */
  static async getApplicantData(driverId: string, companyId: string): Promise<TenstreetResponse<TenstreetApplicantResponse>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'get_applicant_data',
      driverId,
      companyId
    });
  }

  /**
   * Create a new applicant in Tenstreet
   */
  static async createApplicant(data: ApplicantCreateData, companyId: string): Promise<TenstreetResponse<TenstreetApplicantResponse>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'create_applicant',
      applicantData: data,
      companyId
    });
  }

  /**
   * Update an existing applicant
   */
  static async updateApplicant(
    driverId: string,
    updates: Partial<ApplicantCreateData>,
    companyId: string
  ): Promise<TenstreetResponse<TenstreetApplicantResponse>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'update_applicant',
      driverId,
      updates,
      companyId
    });
  }

  /**
   * Update applicant status
   */
  static async updateApplicantStatus(
    driverId: string,
    status: string,
    companyId: string
  ): Promise<TenstreetResponse<any>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'update_applicant_status',
      driverId,
      status,
      companyId
    });
  }

  /**
   * Send application data to Tenstreet (post to ATS)
   */
  static async sendApplication(
    applicationData: any,
    mappings: TenstreetFieldMappings,
    config: TenstreetConfig
  ): Promise<TenstreetResponse<any>> {
    return this.callEdgeFunction(this.EDGE_FUNCTION, {
      action: 'send_application',
      applicationData,
      mappings,
      config
    });
  }

  /**
   * Sync applicant from Tenstreet to local database
   */
  static async syncApplicant(phone: string, companyId: string): Promise<TenstreetResponse<any>> {
    return this.callEdgeFunction(this.SYNC_FUNCTION, {
      action: 'search_and_sync',
      phone,
      companyId
    });
  }

  // ============================================================================
  // XCHANGE - BACKGROUND CHECKS & VERIFICATIONS
  // ============================================================================

  /**
   * Request Motor Vehicle Record check
   */
  static async requestMVR(driverId: string, options: MVROptions): Promise<TenstreetResponse<XchangeRequest>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'request_mvr',
      driverId,
      ...options
    });
  }

  /**
   * Request drug test screening
   */
  static async requestDrugTest(
    driverId: string,
    options: DrugTestOptions
  ): Promise<TenstreetResponse<XchangeRequest>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'request_drug_test',
      driverId,
      ...options
    });
  }

  /**
   * Request employment verification via The Work Number
   */
  static async requestEmploymentVerification(
    driverId: string,
    companyId: string
  ): Promise<TenstreetResponse<XchangeRequest>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'request_employment_verification',
      driverId,
      companyId
    });
  }

  /**
   * Request criminal background check
   */
  static async requestCriminalBackground(
    driverId: string,
    companyId: string
  ): Promise<TenstreetResponse<XchangeRequest>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'request_criminal_background',
      driverId,
      companyId
    });
  }

  /**
   * Get status of an Xchange verification request
   */
  static async getXchangeStatus(requestId: string): Promise<TenstreetResponse<XchangeStatus>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'get_xchange_status',
      requestId
    });
  }

  /**
   * List all Xchange requests for a driver
   */
  static async listXchangeRequests(driverId: string): Promise<TenstreetResponse<XchangeRequest[]>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'list_xchange_requests',
      driverId
    });
  }

  /**
   * Cancel a pending Xchange request
   */
  static async cancelXchangeRequest(requestId: string): Promise<TenstreetResponse<void>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'cancel_xchange_request',
      requestId
    });
  }

  // ============================================================================
  // JOB MANAGEMENT
  // ============================================================================

  /**
   * Get available jobs from Tenstreet
   */
  static async getAvailableJobs(companyId: string): Promise<TenstreetResponse<Job[]>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'get_available_jobs',
      companyId
    });
  }

  /**
   * Get applications for a specific job
   */
  static async getJobApplications(jobId: string, companyId: string): Promise<TenstreetResponse<TenstreetApplication[]>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'get_job_applications',
      jobId,
      companyId
    });
  }

  /**
   * Assign an applicant to a job
   */
  static async assignApplicantToJob(
    driverId: string,
    jobId: string,
    companyId: string
  ): Promise<TenstreetResponse<Assignment>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'assign_to_job',
      driverId,
      jobId,
      companyId
    });
  }

  // ============================================================================
  // ANALYTICS & REPORTING (FOCUS)
  // ============================================================================

  /**
   * Get application metrics for a date range
   */
  static async getApplicationMetrics(
    companyId: string,
    dateRange: DateRange
  ): Promise<TenstreetResponse<Metrics>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'get_application_metrics',
      companyId,
      ...dateRange
    });
  }

  /**
   * Get source performance analytics
   */
  static async getSourceAnalytics(companyId: string): Promise<TenstreetResponse<SourceStats>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'get_source_analytics',
      companyId
    });
  }

  /**
   * Get conversion funnel data
   */
  static async getConversionFunnelData(
    companyId: string,
    dateRange: DateRange
  ): Promise<TenstreetResponse<FunnelData>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'get_conversion_funnel',
      companyId,
      ...dateRange
    });
  }

  /**
   * Get recruiting KPIs
   */
  static async getRecruitingKPIs(companyId: string): Promise<TenstreetResponse<KPIData>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'get_recruiting_kpis',
      companyId
    });
  }

  /**
   * Export analytics report
   */
  static async exportAnalyticsReport(
    companyId: string,
    params: any
  ): Promise<TenstreetResponse<Blob>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'export_analytics',
      companyId,
      ...params
    });
  }

  // ============================================================================
  // BULK OPERATIONS (TOOLS)
  // ============================================================================

  /**
   * Bulk import applicants from external source
   */
  static async bulkImport(
    source: string,
    data: any[],
    companyId: string
  ): Promise<TenstreetResponse<ImportResult>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'bulk_import',
      source,
      data,
      companyId
    });
  }

  /**
   * Bulk update status for multiple applicants
   */
  static async bulkStatusUpdate(
    driverIds: string[],
    status: string,
    companyId: string
  ): Promise<TenstreetResponse<BulkUpdateResult>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'bulk_status_update',
      driverIds,
      status,
      companyId
    });
  }

  /**
   * Bulk export applicants
   */
  static async bulkExport(criteria: ExportCriteria): Promise<TenstreetResponse<Blob>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'export_applicants',
      ...criteria
    });
  }

  /**
   * Sync leads from Facebook
   */
  static async syncFromFacebook(
    adAccountId: string,
    companyId: string
  ): Promise<TenstreetResponse<SyncResult>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'sync_facebook_leads',
      adAccountId,
      companyId
    });
  }

  /**
   * Sync contacts from HubSpot
   */
  static async syncFromHubSpot(
    credentials: any,
    companyId: string
  ): Promise<TenstreetResponse<SyncResult>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'sync_hubspot_contacts',
      credentials,
      companyId
    });
  }

  // ============================================================================
  // DOCUMENT MANAGEMENT
  // ============================================================================

  /**
   * Upload document for a driver
   */
  static async uploadDocument(
    driverId: string,
    file: File,
    type: string,
    companyId: string
  ): Promise<TenstreetResponse<Document>> {
    // Note: File upload will need special handling
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'upload_document',
      driverId,
      documentType: type,
      companyId
      // File handling to be implemented
    });
  }

  /**
   * Get all documents for a driver
   */
  static async getDocuments(driverId: string, companyId: string): Promise<TenstreetResponse<Document[]>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'get_documents',
      driverId,
      companyId
    });
  }

  /**
   * Delete a document
   */
  static async deleteDocument(documentId: string, companyId: string): Promise<TenstreetResponse<void>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'delete_document',
      documentId,
      companyId
    });
  }

  // ============================================================================
  // WEBHOOK MANAGEMENT
  // ============================================================================

  /**
   * Register a listener endpoint for webhooks
   */
  static async registerListenerEndpoint(
    url: string,
    events: string[],
    companyId: string
  ): Promise<TenstreetResponse<Webhook>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'register_webhook',
      url,
      events,
      companyId
    });
  }

  /**
   * Test a webhook endpoint
   */
  static async testListenerEndpoint(webhookId: string): Promise<TenstreetResponse<TestResult>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'test_webhook',
      webhookId
    });
  }

  /**
   * Get webhook delivery logs
   */
  static async getWebhookLogs(webhookId: string): Promise<TenstreetResponse<WebhookLog[]>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'get_webhook_logs',
      webhookId
    });
  }

  // ============================================================================
  // CONNECTION & CONFIGURATION
  // ============================================================================

  /**
   * Test connection to Tenstreet API
   */
  static async testConnection(config: TenstreetConfig): Promise<TenstreetResponse<ConnectionStatus>> {
    return this.callEdgeFunction(this.EDGE_FUNCTION, {
      action: 'test_connection',
      config
    });
  }

  /**
   * Validate credentials
   */
  static async validateCredentials(credentials: Credentials): Promise<TenstreetResponse<ValidationResult>> {
    return this.callEdgeFunction(this.EDGE_FUNCTION, {
      action: 'validate_credentials',
      credentials
    });
  }

  /**
   * Get API usage statistics
   */
  static async getApiUsageStats(companyId: string): Promise<TenstreetResponse<UsageStats>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'get_usage_stats',
      companyId
    });
  }

  /**
   * Explore available Tenstreet services
   */
  static async exploreServices(companyId: string): Promise<TenstreetResponse<any>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'explore_services',
      companyId
    });
  }

  /**
   * Test a custom service endpoint
   */
  static async testService(
    serviceName: string,
    payload: any,
    companyId: string
  ): Promise<TenstreetResponse<any>> {
    return this.callEdgeFunction(this.EXPLORER_FUNCTION, {
      action: 'test_service',
      serviceName,
      customPayload: payload,
      companyId
    });
  }
}
