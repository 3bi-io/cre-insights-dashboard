/**
 * ATS Adapter Type Definitions
 * Shared types for the ATS integration system
 */

// ============ Credential Types ============

export interface ATSCredentials {
  // Common fields
  api_key?: string;
  apiKey?: string;
  api_secret?: string;
  access_token?: string;
  
  // XML-based ATS (Tenstreet)
  client_id?: string;
  clientId?: string;
  password?: string;
  source?: string;
  company_id?: string;
  companyId?: string;
  company_ids?: number[] | string[];
  account_name?: string;
  mode?: string;
  
  // REST-based ATS
  subdomain?: string;
  on_behalf_of?: string;
  customer_id?: string;
  
  // Allow additional fields
  [key: string]: unknown;
}

// ============ Connection Types ============

export interface ATSConnection {
  id: string;
  organization_id: string;
  client_id?: string;
  ats_system_id: string;
  name: string;
  credentials: ATSCredentials;
  mode: 'test' | 'production' | 'TEST' | 'PROD';
  status: 'pending' | 'active' | 'error' | 'disabled';
  is_auto_post_enabled?: boolean;
  auto_post_on_status?: string[];
  last_sync_at?: string;
  last_error?: string;
  sync_stats?: {
    total_sent?: number;
    total_success?: number;
    total_failed?: number;
    total_syncs?: number;
    successful_syncs?: number;
    failed_syncs?: number;
  };
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// ============ System Types ============

export type ATSApiType = 'xml_post' | 'rest_json' | 'graphql' | 'webhook' | 'soap';

export type ATSCategory = 
  | 'trucking' 
  | 'healthcare' 
  | 'tech' 
  | 'general' 
  | 'hospitality' 
  | 'retail' 
  | 'staffing' 
  | 'enterprise';

export interface CredentialFieldSchema {
  type: 'string' | 'password' | 'array' | 'select' | 'boolean' | 'number';
  required: boolean;
  label: string;
  name?: string;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  default?: string | number | boolean;
}

export interface ATSSystem {
  id: string;
  name: string;
  slug: string;
  api_type: ATSApiType;
  base_endpoint?: string;
  credential_schema: Record<string, CredentialFieldSchema> | CredentialFieldSchema[];
  field_schema?: Record<string, unknown>;
  supports_test_mode?: boolean;
  documentation_url?: string;
  logo_url?: string;
  category?: ATSCategory;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============ Field Mapping Types ============

export interface FieldMappingRule {
  source_field: string;
  target_field?: string;
  transform?: string;
  default_value?: unknown;
}

export interface TransformRule {
  type: 'concat' | 'split' | 'map' | 'format' | 'custom' | 'uppercase' | 'lowercase' | 'trim' | 'date_format';
  config: Record<string, unknown>;
}

export interface FieldMapping {
  id?: string;
  ats_connection_id: string;
  name: string;
  field_mappings: Record<string, string | FieldMappingRule>;
  transform_rules?: Record<string, TransformRule>;
  is_default?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============ Application Data Types ============

export interface EmploymentHistoryEntry {
  employer?: string;
  company?: string;
  position?: string;
  title?: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  is_current?: boolean;
  responsibilities?: string;
  reason_for_leaving?: string;
}

export interface ApplicationData {
  // Identifiers
  id: string;
  job_id?: string;
  job_listing_id?: string;
  
  // Personal Information
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  full_name?: string;
  prefix?: string;
  suffix?: string;
  applicant_email?: string;
  email?: string;
  phone?: string;
  secondary_phone?: string;
  
  // Address
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  
  // Date of Birth & Sensitive
  date_of_birth?: string;
  ssn?: string;
  
  // CDL/Driving Info
  cdl?: string;
  cdl_class?: string;
  cdl_state?: string;
  cdl_endorsements?: string[];
  cdl_expiration_date?: string;
  exp?: string;
  driving_experience_years?: number;
  
  // Employment & Education
  employment_history?: EmploymentHistoryEntry[];
  education_level?: string;
  work_authorization?: string;
  
  // Status & Source
  status?: string;
  source?: string;
  veteran?: string;
  
  // Custom Fields
  custom_questions?: Record<string, unknown>;
  display_fields?: Record<string, unknown>;
  
  // Allow additional fields
  [key: string]: unknown;
}

// ============ Request/Response Types ============

export interface ATSRequest {
  action: 'test_connection' | 'send_application' | 'sync_status' | 'search' | 'get_jobs';
  connection_id: string;
  application_id?: string;
  application_data?: ApplicationData;
  search_criteria?: Record<string, string>;
  external_id?: string;
  options?: Record<string, unknown>;
}

export interface ATSResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  external_id?: string;
  error?: string;
  error_code?: string;
  duration_ms?: number;
  raw_response?: unknown;
}

// ============ Adapter Configuration ============

export interface AdapterConfig {
  system: ATSSystem;
  connection: ATSConnection;
  fieldMapping?: FieldMapping;
}

// ============ Auto-Post Types ============

export interface AutoPostResult {
  connection_id: string;
  ats_slug: string;
  ats_name: string;
  success: boolean;
  external_id?: string;
  error?: string;
  duration_ms: number;
}

export interface AutoPostSummary {
  total_connections: number;
  successful: number;
  failed: number;
  skipped: number;
  results: AutoPostResult[];
}
