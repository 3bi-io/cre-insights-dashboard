/**
 * ATS Adapter Type Definitions
 * Shared types for the ATS integration system
 */

export interface ATSCredentials {
  [key: string]: string | string[] | boolean | number;
}

export interface ATSConnection {
  id: string;
  organization_id: string;
  client_id?: string;
  ats_system_id: string;
  name: string;
  credentials: ATSCredentials;
  mode: 'test' | 'production';
  status: 'pending' | 'active' | 'error' | 'disabled';
  is_auto_post_enabled: boolean;
  auto_post_on_status: string[];
  last_sync_at?: string;
  last_error?: string;
  sync_stats: {
    total_sent: number;
    total_success: number;
    total_failed: number;
  };
  metadata: Record<string, unknown>;
}

export interface ATSSystem {
  id: string;
  name: string;
  slug: string;
  api_type: 'xml_post' | 'rest_json' | 'graphql' | 'webhook' | 'soap';
  base_endpoint?: string;
  credential_schema: Record<string, CredentialFieldSchema>;
  field_schema: Record<string, unknown>;
  supports_test_mode: boolean;
  documentation_url?: string;
  logo_url?: string;
  category: 'trucking' | 'healthcare' | 'tech' | 'general' | 'hospitality' | 'retail';
  is_active: boolean;
}

export interface CredentialFieldSchema {
  type: 'string' | 'password' | 'array' | 'select' | 'boolean' | 'number';
  required: boolean;
  label: string;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface FieldMapping {
  id: string;
  ats_connection_id: string;
  name: string;
  field_mappings: Record<string, string | FieldMappingRule>;
  transform_rules: Record<string, TransformRule>;
  is_default: boolean;
  is_active: boolean;
}

export interface FieldMappingRule {
  source_field: string;
  target_field: string;
  transform?: string;
  default_value?: string;
}

export interface TransformRule {
  type: 'concat' | 'split' | 'map' | 'format' | 'custom';
  config: Record<string, unknown>;
}

export interface ApplicationData {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  applicant_email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  address_1?: string;
  address_2?: string;
  country?: string;
  date_of_birth?: string;
  ssn?: string;
  cdl?: string;
  cdl_class?: string;
  cdl_state?: string;
  cdl_endorsements?: string[];
  cdl_expiration_date?: string;
  exp?: string;
  driving_experience_years?: number;
  education_level?: string;
  work_authorization?: string;
  veteran?: string;
  source?: string;
  status?: string;
  job_listing_id?: string;
  custom_questions?: Record<string, unknown>;
  display_fields?: Record<string, unknown>;
  employment_history?: unknown[];
  [key: string]: unknown;
}

export interface ATSRequest {
  action: 'test_connection' | 'send_application' | 'sync_status' | 'search' | 'get_jobs';
  connection_id: string;
  application_id?: string;
  application_data?: ApplicationData;
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

export interface AdapterConfig {
  connection: ATSConnection;
  system: ATSSystem;
  fieldMapping?: FieldMapping;
}
