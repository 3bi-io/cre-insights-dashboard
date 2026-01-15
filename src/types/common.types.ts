// Common type definitions for better type safety

export interface Application {
  id: string;
  job_listing_id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  applicant_email?: string;
  phone?: string;
  status?: string;
  source?: string;
  notes?: string;
  job_id?: string;
  cdl?: string;
  exp?: string;
  drug?: string;
  consent?: string;
  privacy?: string;
  age?: string;
  veteran?: string;
  months?: string;
  prefix?: string;
  middle_name?: string;
  suffix?: string;
  ssn?: string;
  government_id?: string;
  government_id_type?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  secondary_phone?: string;
  preferred_contact_method?: string;
  applied_at?: string;
  created_at?: string;
  updated_at?: string;
  recruiter_id?: string;
  date_of_birth?: string;
  cdl_expiration_date?: string;
  driving_experience_years?: number;
  employment_history?: Record<string, unknown>;
  military_start_date?: string;
  military_end_date?: string;
  preferred_start_date?: string;
  medical_card_expiration?: string;
  dot_physical_date?: string;
  passport_card?: string;
  hazmat_endorsement?: string;
  background_check_consent?: string;
  consent_to_email?: string;
  consent_to_sms?: string;
  agree_privacy_policy?: string;
  can_pass_physical?: string;
  can_pass_drug_test?: string;
  over_21?: string;
  driver_id?: string;
  referral_source?: string;
  how_did_you_hear?: string;
  salary_expectations?: string;
  willing_to_relocate?: string;
  can_work_nights?: string;
  can_work_weekends?: string;
  work_authorization?: string;
  felony_details?: string;
  convicted_felony?: string;
  military_branch?: string;
  military_service?: string;
  education_level?: string;
  violation_history?: string;
  accident_history?: string;
  cdl_state?: string;
  cdl_endorsements?: string[];
  cdl_class?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_name?: string;
  custom_questions?: Record<string, unknown>;
  display_fields?: Record<string, unknown>;
  elevenlabs_call_transcript?: string;
  twic_card?: string;
  // Relations
  job_listings?: {
    title?: string;
    job_title?: string;
  };
  recruiters?: {
    first_name: string;
    last_name: string;
  };
}

export interface JobListing {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  job_title?: string;
  job_summary?: string;
  description?: string;
  job_description?: string;
  location?: string;
  city?: string;
  state?: string;
  dest_city?: string;
  dest_state?: string;
  radius?: number;
  salary_min?: number;
  salary_max?: number;
  salary_type?: string;
  experience_level?: string;
  job_type?: string;
  remote_type?: string;
  status?: string;
  budget?: number;
  url?: string;
  apply_url?: string;
  job_id?: string;
  client?: string;
  client_id?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  job_platform_associations?: Array<{
    platforms?: {
      name: string;
    };
  }>;
  job_categories?: {
    name: string;
  };
  clients?: {
    name: string;
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  domain?: string;
  domain_status?: string;
  domain_ssl_status?: string;
  domain_dns_records?: Record<string, unknown>;
  domain_verification_token?: string;
  domain_deployed_at?: string;
  // subscription_status and plan_type removed - all features available to all users
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Recruiter {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Platform {
  id: string;
  name: string;
  logo_url?: string;
  api_endpoint?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MetaSpendData {
  id: string;
  user_id: string;
  account_id: string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  date_start: string;
  date_stop: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  cpm: number;
  cpc: number;
  ctr: number;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DailySpend {
  id: string;
  job_listing_id: string;
  date: string;
  amount: number;
  clicks?: number;
  views?: number;
  created_at: string;
}

export interface ChartData {
  date: string;
  spend: number;
  views?: number;
  clicks?: number;
}

export interface PlatformData {
  name: string;
  spend: number;
  value: number;
  color: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterState {
  dateRange?: {
    from: Date;
    to: Date;
  };
  status?: string[];
  source?: string[];
  location?: string[];
  jobType?: string[];
}

export interface DashboardMetrics {
  totalSpend: number;
  totalApplications: number;
  totalJobs: number;
  totalReach: number;
  totalImpressions: number;
  costPerApplication: number;
  costPerLead: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'assistant';
  message: string;
  timestamp: string;
  is_analytics?: boolean;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  page?: string;
  context?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationFeature {
  id: string;
  organization_id: string;
  feature_name: string;
  enabled: boolean;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  organization_id?: string;
  table_name: string;
  record_id?: string;
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  sensitive_fields?: string[];
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Component Props Types
export interface ApplicationCardProps {
  application: Application;
  recruiters?: Recruiter[];
  index: number;
  onSmsOpen: (application: Application) => void;
  onDetailsView: (application: Application) => void;
  onTenstreetUpdate: (application: Application) => void;
}

export interface JobCardProps {
  job: JobListing;
  onViewAnalytics: (job: JobListing) => void;
  onVoiceApply?: (job: JobListing) => void;
}

export interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  fullName?: string;
}

export interface OrganizationFormData {
  name: string;
  slug: string;
  domain?: string;
  settings?: Record<string, unknown>;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ErrorState {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
  className?: string;
}

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}