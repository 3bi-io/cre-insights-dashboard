/**
 * Tenstreet API Contracts
 * Type-safe interfaces for edge function requests and responses
 */

// ============= Common Types =============

export type TenstreetMode = 'DEV' | 'TEST' | 'PROD';

export type TenstreetServiceType = 
  | 'subject_upload'
  | 'subject_search'
  | 'subject_retrieve'
  | 'subject_update'
  | 'status_update'
  | 'job_listing'
  | 'export_data';

// ============= Xchange Request Types =============

export type XchangeServiceType = 
  | 'mvr'
  | 'drug_test'
  | 'employment_verification'
  | 'background_check';

export interface XchangeRequest {
  action: 'request_screening';
  applicationId: string;
  serviceType: XchangeServiceType; // NOTE: Matches database field name
  options?: {
    level?: 'standard' | 'comprehensive' | 'federal';
    consentDate?: string;
    additionalInstructions?: string;
  };
}

export interface XchangeResponse {
  success: boolean;
  requestId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedCompletion?: string;
  costCents?: number;
  errors?: string[];
}

// ============= Sync Request Types =============

export interface SyncApplicantsRequest {
  action: 'sync_applicants';
  organizationId: string;
  companyId: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  email?: string;
  phone?: string;
  lastName?: string;
}

export interface PushApplicantRequest {
  action: 'push_applicant';
  organizationId: string;
  companyId: string;
  applicationId: string;
}

export interface UpdateStatusRequest {
  action: 'update_status';
  organizationId: string;
  companyId: string;
  applicationId: string;
  status: string;
  statusTag?: string;
}

export interface SearchAndSyncRequest {
  action: 'search_and_sync';
  organizationId: string;
  companyId: string;
  email?: string;
  phone?: string;
  driverId?: string;
}

export type TenstreetSyncRequest = 
  | SyncApplicantsRequest
  | PushApplicantRequest
  | UpdateStatusRequest
  | SearchAndSyncRequest;

export interface SyncResponse {
  success: boolean;
  synced?: number;
  applicants?: any[];
  driverId?: string;
  errors?: string[];
}

// ============= Explorer Request Types =============

export type ExplorerAction = 
  | 'explore_services'
  | 'test_service'
  | 'get_applicant_data'
  | 'search_applicants'
  | 'get_application_status'
  | 'update_applicant_status'
  | 'get_available_jobs'
  | 'export_applicants'
  | 'subject_upload'
  | 'subject_update';

export interface ExplorerRequest {
  company_id: string;
  action: ExplorerAction;
  driverId?: string;
  criteria?: {
    email?: string;
    phone?: string;
    lastName?: string;
    dateRange?: string;
  };
  status?: string;
  applicantData?: any;
  updates?: any;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  service?: string;
  payload?: any;
}

export interface ExplorerResponse {
  success: boolean;
  status?: number;
  response?: string;
  parsed?: any;
  action?: string;
  attempt?: number;
  services?: any[];
  applicants?: any[];
  errors?: string[];
}

// ============= Bulk Operations Types =============

export type BulkOperationType = 
  | 'import'
  | 'export'
  | 'status_update'
  | 'sync';

export interface BulkOperationRequest {
  operationType: BulkOperationType;
  organizationId: string;
  data?: string; // Base64 encoded CSV for import
  applicationIds?: string[];
  status?: string;
  fields?: string[];
  syncSource?: 'facebook' | 'hubspot' | 'indeed';
}

export interface BulkOperationResponse {
  success: boolean;
  operationId: string;
  recordsProcessed: number; // NOTE: Matches database field name
  recordsFailed: number;
  data?: string; // Base64 encoded CSV for export
  errors?: string[];
}

// ============= Analytics Request Types =============

export type AnalyticsType = 
  | 'application_metrics'
  | 'source_performance'
  | 'conversion_funnel';

export interface AnalyticsRequest {
  type: AnalyticsType;
  organizationId: string;
  startDate?: string;
  endDate?: string;
  refresh?: boolean;
}

export interface AnalyticsResponse {
  success: boolean;
  data: any;
  cached: boolean;
  timestamp: string;
}
