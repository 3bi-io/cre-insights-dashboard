/**
 * API-Specific Type Definitions
 * Comprehensive types for API requests, responses, and error handling
 */

// === BASE API TYPES ===
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationInfo;
  meta?: ResponseMeta;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
  path?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ResponseMeta {
  timestamp: string;
  version: string;
  requestId: string;
  processingTime?: number;
}

// === REQUEST TYPES ===
export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  validateResponse?: boolean;
}

export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  search?: string;
}

export interface BulkOperationRequest<T> {
  operation: 'create' | 'update' | 'delete';
  items: T[];
  options?: {
    validateAll?: boolean;
    stopOnError?: boolean;
    returnErrors?: boolean;
  };
}

// === USER API TYPES ===
export interface UserCreateRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'user' | 'admin' | 'moderator';
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisible: boolean;
    emailVisible: boolean;
    phoneVisible: boolean;
  };
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  phoneVerified: boolean;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// === JOB API TYPES ===
export interface JobCreateRequest {
  title: string;
  description: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  remote: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  skills: string[];
  requirements?: string[];
  benefits?: string[];
  applicationDeadline?: string;
  contactEmail?: string;
  externalUrl?: string;
}

export interface JobUpdateRequest extends Partial<JobCreateRequest> {
  status?: 'draft' | 'published' | 'closed';
}

export interface JobResponse {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  remote: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  skills: string[];
  requirements?: string[];
  benefits?: string[];
  status: 'draft' | 'published' | 'closed';
  applicationDeadline?: string;
  contactEmail?: string;
  externalUrl?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  closedAt?: string;
  createdBy: string;
  applicationsCount: number;
  viewsCount: number;
  featuredUntil?: string;
}

export interface JobSearchRequest extends PaginatedRequest {
  location?: string;
  type?: string[];
  remote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  company?: string;
  datePosted?: 'today' | 'week' | 'month' | 'all';
}

// === APPLICATION API TYPES ===
export interface ApplicationCreateRequest {
  jobId: string;
  applicantName: string;
  email: string;
  phone: string;
  resume: {
    filename: string;
    contentType: string;
    size: number;
    url?: string;
  };
  coverLetter?: string;
  experience: number;
  availability?: string;
  expectedSalary?: number;
  additionalInfo?: string;
  source?: string;
}

export interface ApplicationUpdateRequest {
  status?: 'pending' | 'reviewing' | 'interviewed' | 'accepted' | 'rejected';
  notes?: string;
  interviewDate?: string;
  rejectionReason?: string;
  feedback?: string;
}

export interface ApplicationResponse {
  id: string;
  jobId: string;
  job: Pick<JobResponse, 'id' | 'title' | 'company'>;
  applicantName: string;
  email: string;
  phone: string;
  resume: {
    filename: string;
    contentType: string;
    size: number;
    url: string;
  };
  coverLetter?: string;
  experience: number;
  availability?: string;
  expectedSalary?: number;
  additionalInfo?: string;
  status: 'pending' | 'reviewing' | 'interviewed' | 'accepted' | 'rejected';
  notes?: string;
  interviewDate?: string;
  rejectionReason?: string;
  feedback?: string;
  source?: string;
  appliedAt: string;
  updatedAt: string;
  reviewedAt?: string;
  interviewedAt?: string;
  decidedAt?: string;
}

// === ORGANIZATION API TYPES ===
export interface OrganizationCreateRequest {
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  industry?: string;
  size?: string;
  location?: string;
  settings?: OrganizationSettings;
}

export interface OrganizationSettings {
  allowPublicJobPosting: boolean;
  requireApprovalForJobs: boolean;
  enableApplicationTracking: boolean;
  customBranding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    favicon?: string;
  };
  integrations: {
    emailProvider?: string;
    smsProvider?: string;
    analyticsProvider?: string;
  };
}

export interface OrganizationResponse {
  id: string;
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  industry?: string;
  size?: string;
  location?: string;
  settings: OrganizationSettings;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  membersCount: number;
  jobsCount: number;
  applicationsCount: number;
}

// === ANALYTICS API TYPES ===
export interface AnalyticsRequest {
  startDate?: string;
  endDate?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  metrics?: string[];
  dimensions?: string[];
  filters?: Record<string, any>;
}

export interface AnalyticsResponse {
  metrics: Record<string, number>;
  dimensions: Record<string, any>;
  timeSeries: Array<{
    timestamp: string;
    values: Record<string, number>;
  }>;
  summary: {
    totalPeriod: string;
    comparisonPeriod?: string;
    change?: number;
    changePercent?: number;
  };
}

// === FILE UPLOAD TYPES ===
export interface FileUploadRequest {
  file: File;
  category: 'avatar' | 'resume' | 'logo' | 'document';
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  category: string;
  metadata?: Record<string, any>;
  uploadedAt: string;
  expiresAt?: string;
}

// === WEBHOOK TYPES ===
export interface WebhookCreateRequest {
  url: string;
  events: string[];
  secret?: string;
  active?: boolean;
  metadata?: Record<string, any>;
}

export interface WebhookResponse {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  failureCount: number;
}

export interface WebhookPayload {
  id: string;
  event: string;
  timestamp: string;
  data: any;
  signature?: string;
  attempt: number;
  organizationId?: string;
}

// === AUDIT LOG TYPES ===
export interface AuditLogResponse {
  id: string;
  userId?: string;
  user?: Pick<UserResponse, 'id' | 'email' | 'firstName' | 'lastName'>;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, { from: any; to: any }>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// === TYPED API CLIENT INTERFACE ===
export interface TypedApiClient {
  // User endpoints
  users: {
    create: (data: UserCreateRequest) => Promise<ApiResponse<UserResponse>>;
    update: (id: string, data: UserUpdateRequest) => Promise<ApiResponse<UserResponse>>;
    get: (id: string) => Promise<ApiResponse<UserResponse>>;
    list: (params?: PaginatedRequest) => Promise<ApiResponse<UserResponse[]>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };

  // Job endpoints
  jobs: {
    create: (data: JobCreateRequest) => Promise<ApiResponse<JobResponse>>;
    update: (id: string, data: JobUpdateRequest) => Promise<ApiResponse<JobResponse>>;
    get: (id: string) => Promise<ApiResponse<JobResponse>>;
    list: (params?: JobSearchRequest) => Promise<ApiResponse<JobResponse[]>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
    search: (params: JobSearchRequest) => Promise<ApiResponse<JobResponse[]>>;
  };

  // Application endpoints
  applications: {
    create: (data: ApplicationCreateRequest) => Promise<ApiResponse<ApplicationResponse>>;
    update: (id: string, data: ApplicationUpdateRequest) => Promise<ApiResponse<ApplicationResponse>>;
    get: (id: string) => Promise<ApiResponse<ApplicationResponse>>;
    list: (params?: PaginatedRequest) => Promise<ApiResponse<ApplicationResponse[]>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };

  // File upload
  files: {
    upload: (data: FileUploadRequest) => Promise<ApiResponse<FileUploadResponse>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
  };

  // Analytics
  analytics: {
    get: (params: AnalyticsRequest) => Promise<ApiResponse<AnalyticsResponse>>;
  };
}

// === ADDITIONAL APPLICATION TYPES ===
export type ApplicationStatus = 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected';

export interface ApplicationFilters {
  job_id?: string;
  status?: ApplicationStatus | 'all';
  search?: string;
  organization_id?: string;
  client_id?: string;
  source?: string;
  city?: string;
  state?: string;
  cdl_license?: boolean;
  veteran_status?: boolean;
  experience_years_min?: number;
  applied_after?: string;
  applied_before?: string;
}

// === BULK ACTION TYPES ===
export interface BulkActionProgress {
  current: number;
  total: number;
  percentage: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface BulkActionRequest<T = unknown> {
  action: string;
  ids: string[];
  data?: T;
}

export interface BulkActionResult {
  success: number;
  failed: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

// === EXPORT TYPES ===
export type ExportFormat = 'pdf' | 'csv' | 'xlsx';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  fields?: string[];
  filters?: Record<string, unknown>;
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  downloadUrl?: string;
}