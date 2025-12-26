/**
 * Background Check Adapter Types
 * Unified type system for all background check provider integrations
 */

// ============================================================================
// Provider & Configuration Types
// ============================================================================

export interface BGCProvider {
  id: string;
  slug: string;
  name: string;
  api_type: 'rest_json' | 'oauth2_rest' | 'soap_xml';
  base_url: string;
  auth_type: 'api_key' | 'basic_auth' | 'oauth2';
  supported_checks: CheckType[];
  webhook_config: WebhookConfig;
  pricing: Record<string, number>;
  documentation_url?: string;
  logo_url?: string;
  is_active: boolean;
}

export interface BGCConnection {
  id: string;
  organization_id: string;
  provider_id: string;
  credentials: BGCCredentials;
  is_enabled: boolean;
  is_default: boolean;
  package_mappings: Record<string, string>;
  webhook_secret?: string;
  mode: 'test' | 'live';
  last_used_at?: string;
}

export interface BGCCredentials {
  api_key?: string;
  client_id?: string;
  client_secret?: string;
  account_id?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
}

export interface WebhookConfig {
  events: string[];
  signature_header: string;
}

// ============================================================================
// Check Types & Packages
// ============================================================================

export type CheckType =
  | 'criminal'
  | 'ssn_trace'
  | 'sex_offender'
  | 'global_watchlist'
  | 'national_criminal'
  | 'county_criminal'
  | 'federal_criminal'
  | 'mvr'
  | 'employment'
  | 'education'
  | 'drug'
  | 'credit'
  | 'professional_license'
  | 'i9'
  | 'civil_court'
  | 'sanctions';

export interface CheckPackage {
  id: string;
  name: string;
  checks: CheckType[];
  price_cents?: number;
}

// ============================================================================
// Candidate & Application Data
// ============================================================================

export interface CandidateData {
  // Required fields
  first_name: string;
  last_name: string;
  email: string;
  
  // Optional but commonly required
  middle_name?: string;
  date_of_birth?: string; // YYYY-MM-DD
  ssn?: string; // Last 4 or full, depending on check type
  phone?: string;
  
  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  
  // Driver-specific (for MVR)
  driver_license_number?: string;
  driver_license_state?: string;
  
  // Employment verification
  current_employer?: string;
  job_title?: string;
  
  // Consent
  consent_given: boolean;
  consent_timestamp?: string;
  
  // Internal references
  application_id?: string;
  custom_id?: string;
}

// ============================================================================
// Request & Response Types
// ============================================================================

export interface BGCRequest {
  candidate: CandidateData;
  check_types: CheckType[];
  package_name?: string;
  priority?: 'standard' | 'rush';
  custom_options?: Record<string, unknown>;
}

export interface BGCResponse {
  success: boolean;
  provider: string;
  external_id?: string;
  candidate_id?: string;
  status: BGCStatus;
  report_url?: string;
  candidate_portal_url?: string;
  estimated_completion?: string;
  cost_cents?: number;
  error?: BGCError;
  raw_response?: unknown;
  timestamp: string;
}

export interface BGCError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

// ============================================================================
// Status & Results
// ============================================================================

export type BGCStatus =
  | 'pending'
  | 'processing'
  | 'waiting_on_candidate'
  | 'completed'
  | 'suspended'
  | 'cancelled'
  | 'error';

export type BGCResult = 'clear' | 'consider' | 'adverse' | 'pending' | 'error';

export interface BGCReport {
  id: string;
  external_id: string;
  status: BGCStatus;
  result: BGCResult;
  completed_at?: string;
  checks: BGCCheckResult[];
  report_url?: string;
  adjudication?: string;
}

export interface BGCCheckResult {
  type: CheckType;
  status: BGCStatus;
  result: BGCResult;
  records?: BGCRecord[];
  turnaround_days?: number;
}

export interface BGCRecord {
  source: string;
  date?: string;
  description: string;
  severity?: 'low' | 'medium' | 'high';
  details?: Record<string, unknown>;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface BGCWebhookPayload {
  provider: string;
  event_type: string;
  external_id: string;
  candidate_id?: string;
  status: BGCStatus;
  result?: BGCResult;
  report_url?: string;
  completed_at?: string;
  raw_payload: unknown;
}

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
  payload?: BGCWebhookPayload;
}

// ============================================================================
// Adapter Configuration
// ============================================================================

export interface BGCAdapterConfig {
  provider: BGCProvider;
  connection: BGCConnection;
  correlationId?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

// ============================================================================
// Database Record Types
// ============================================================================

export interface BGCRequestRecord {
  id: string;
  organization_id: string;
  application_id?: string;
  provider_id: string;
  connection_id?: string;
  external_id?: string;
  candidate_id?: string;
  check_type: string;
  package_name?: string;
  status: string;
  result?: string;
  result_data: Record<string, unknown>;
  report_url?: string;
  candidate_portal_url?: string;
  cost_cents?: number;
  initiated_by?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
