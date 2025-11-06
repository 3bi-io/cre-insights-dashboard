/**
 * Tenstreet Database Types
 * Type-safe interfaces for database records
 */

// ============= Xchange Requests =============

export type XchangeRequestStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface XchangeRequestDB {
  id: string;
  application_id: string;
  request_type: string; // NOTE: Database uses 'request_type', not 'service_type'
  status: XchangeRequestStatus;
  tenstreet_request_id?: string;
  request_payload?: any;
  response_data?: any;
  cost_cents?: number;
  error_message?: string;
  requested_by: string;
  request_date: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
}

// ============= Bulk Operations =============

export type BulkOperationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type BulkOperationType = 'import' | 'export' | 'status_update' | 'sync';

export interface BulkOperationDB {
  id: string;
  organization_id: string;
  operation_type: BulkOperationType;
  status: BulkOperationStatus;
  records_processed: number; // NOTE: Database uses 'records_processed'
  records_failed: number;
  error_details?: any;
  initiated_by: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// ============= Tenstreet Credentials =============

export interface TenstreetCredentialsDB {
  id: string;
  organization_id: string;
  account_name: string;
  client_id: string;
  password: string; // Single field, encrypted at rest by Supabase
  service?: string;
  mode: 'DEV' | 'TEST' | 'PROD';
  api_endpoint: string;
  source?: string;
  company_name?: string;
  app_referrer?: string;
  referral_code?: string;
  company_ids?: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// ============= Analytics Cache =============

export interface AnalyticsCacheDB {
  id: string;
  organization_id: string;
  cache_key: string;
  analytics_type: string;
  data: any;
  expires_at: string;
  created_at: string;
}
