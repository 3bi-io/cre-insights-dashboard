/**
 * Service Layer Type Definitions
 * Types for data transformations and service operations
 */

import type { LucideIcon } from 'lucide-react';

// ============= Generic Service Types =============

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedServiceResponse<T = unknown> extends ServiceResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============= Filter Types =============

export interface BaseFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeFilter {
  dateFrom?: string;
  dateTo?: string;
}

export interface StatusFilter {
  status?: string | string[];
}

export interface OrganizationFilter {
  organizationId?: string;
}

// ============= Application Service Types =============

export interface ApplicationFilters extends BaseFilters, DateRangeFilter, StatusFilter, OrganizationFilter {
  jobListingId?: string;
  recruiterId?: string;
  source?: string;
  cdl?: string;
  experience?: string;
  tenstreetSyncStatus?: string;
}

export interface ApplicationServiceData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  applicant_email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  cdl: string | null;
  exp: string | null;
  age: string | null;
  source: string | null;
  status: string | null;
  job_listing_id: string | null;
  recruiter_id: string | null;
  created_at: string | null;
  applied_at: string | null;
  tenstreet_sync_status: string | null;
  tenstreet_last_sync: string | null;
}

// ============= Job Service Types =============

export interface JobFilters extends BaseFilters, StatusFilter, OrganizationFilter {
  category?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
}

export interface JobServiceData {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  salary_range: string | null;
  status: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

// ============= Analytics Service Types =============

export interface AnalyticsFilters extends DateRangeFilter, OrganizationFilter {
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  metrics?: string[];
}

export interface ApplicationAnalytics {
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  applicationsBySource: Record<string, number>;
  applicationsByDay: Array<{
    date: string;
    count: number;
  }>;
  conversionRate: number;
  averageTimeToHire: number;
}

export interface SpendAnalytics {
  totalSpend: number;
  spendByPlatform: Record<string, number>;
  spendByDay: Array<{
    date: string;
    amount: number;
  }>;
  costPerApplication: number;
  costPerHire: number;
  roi: number;
}

// ============= User Service Types =============

export interface UserFilters extends BaseFilters, OrganizationFilter {
  role?: string;
  enabled?: boolean;
}

export interface UserServiceData {
  id: string;
  email: string;
  full_name: string | null;
  enabled: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  organization_id: string | null;
  role?: string;
}

// ============= Organization Service Types =============

export interface OrganizationFilters extends BaseFilters {
  subscriptionStatus?: string;
  hasCredentials?: boolean;
}

export interface OrganizationServiceData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  subscription_status: string | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ============= Tenstreet Service Types =============

export interface TenstreetApplicantData {
  driverId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  cdl: string | null;
  experience: string | null;
  status: string;
  appliedAt: string;
}

export interface TenstreetXchangeData {
  requestId: string;
  requestType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  driverId: string;
  referenceNumber: string | null;
  requestDate: string;
  completionDate: string | null;
  resultData: Record<string, unknown> | null;
}

export interface TenstreetSyncStatus {
  lastSyncTime: string | null;
  syncedCount: number;
  pendingCount: number;
  errorCount: number;
  connectionHealth: 'active' | 'inactive' | 'error' | 'unknown';
}

// ============= Webhook Service Types =============

export interface WebhookServiceData {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  sourceFilter: string[];
  headers: Record<string, string> | null;
  createdAt: string;
  lastTriggeredAt: string | null;
  successCount: number;
  failureCount: number;
}

export interface WebhookLogEntry {
  id: string;
  webhookId: string;
  eventType: string;
  statusCode: number;
  responseTime: number;
  error: string | null;
  deliveredAt: string;
}

// ============= Cache Service Types =============

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  createdAt: string;
  expiresAt: string;
  provider: string;
  processingType: string;
  confidence?: number;
}

export interface CacheConfig {
  defaultTTL: number;
  maxEntries: number;
  cleanupInterval: number;
}

// ============= Error Service Types =============

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  service: string;
  operation: string;
}

export interface ErrorLogEntry {
  id: string;
  error: ServiceError;
  userId?: string;
  organizationId?: string;
  stackTrace?: string;
  resolved: boolean;
  resolvedAt?: string;
}

// ============= Metric Types =============

export interface MetricCardData {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
}

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  metadata?: Record<string, unknown>;
}

// ============= Export/Import Types =============

export interface ExportConfig {
  format: 'csv' | 'excel' | 'json' | 'pdf';
  fields: string[];
  filters?: Record<string, unknown>;
  includeHeaders: boolean;
  dateFormat?: string;
}

export interface ImportConfig {
  format: 'csv' | 'excel' | 'json';
  mapping: Record<string, string>;
  validateOnly?: boolean;
  skipDuplicates?: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    error: string;
  }>;
}

// ============= Bulk Operation Types =============

export interface BulkOperationConfig {
  batchSize: number;
  concurrency: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface BulkOperationProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining: number;
}

export interface BulkOperationResult<T = unknown> {
  success: boolean;
  results: T[];
  errors: Array<{
    index: number;
    error: string;
  }>;
  duration: number;
}
