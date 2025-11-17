/**
 * Service Layer Type Definitions
 * Type-safe interfaces for service methods
 */

// ============= Generic Service Response Types =============

export interface ServiceResponse<T = unknown> {
  data: T | null;
  error: ServiceError | null;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  originalError?: Error;
}

export interface PaginatedServiceResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============= Query Options =============

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
  search?: string;
}

export interface FilterOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// ============= Mutation Options =============

export interface CreateOptions {
  skipValidation?: boolean;
  returnData?: boolean;
}

export interface UpdateOptions {
  partial?: boolean;
  skipValidation?: boolean;
  returnData?: boolean;
}

export interface DeleteOptions {
  cascade?: boolean;
  softDelete?: boolean;
}

// ============= Supabase Query Builder Types =============

export interface SupabaseQueryBuilder<T> {
  select: (columns?: string) => SupabaseQueryBuilder<T>;
  insert: (data: Partial<T> | Partial<T>[]) => SupabaseQueryBuilder<T>;
  update: (data: Partial<T>) => SupabaseQueryBuilder<T>;
  delete: () => SupabaseQueryBuilder<T>;
  eq: (column: keyof T, value: unknown) => SupabaseQueryBuilder<T>;
  neq: (column: keyof T, value: unknown) => SupabaseQueryBuilder<T>;
  gt: (column: keyof T, value: unknown) => SupabaseQueryBuilder<T>;
  gte: (column: keyof T, value: unknown) => SupabaseQueryBuilder<T>;
  lt: (column: keyof T, value: unknown) => SupabaseQueryBuilder<T>;
  lte: (column: keyof T, value: unknown) => SupabaseQueryBuilder<T>;
  like: (column: keyof T, pattern: string) => SupabaseQueryBuilder<T>;
  ilike: (column: keyof T, pattern: string) => SupabaseQueryBuilder<T>;
  in: (column: keyof T, values: unknown[]) => SupabaseQueryBuilder<T>;
  order: (column: keyof T, options?: { ascending?: boolean }) => SupabaseQueryBuilder<T>;
  limit: (count: number) => SupabaseQueryBuilder<T>;
  range: (from: number, to: number) => SupabaseQueryBuilder<T>;
  single: () => Promise<{ data: T | null; error: Error | null }>;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
  count?: number | null;
  status: number;
  statusText: string;
}

// ============= Base Service Interface =============

export interface IBaseService<T> {
  getAll(options?: FilterOptions): Promise<ServiceResponse<PaginatedServiceResponse<T>>>;
  getById(id: string): Promise<ServiceResponse<T>>;
  create(data: Partial<T>): Promise<ServiceResponse<T>>;
  update(id: string, data: Partial<T>): Promise<ServiceResponse<T>>;
  delete(id: string): Promise<ServiceResponse<void>>;
}

// ============= Validation Types =============

export interface ValidationSchema<T> {
  validate(data: unknown): ValidationResult<T>;
}

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ValidationFieldError[];
}

export interface ValidationFieldError {
  field: string;
  message: string;
  code: string;
}

// ============= Transform Types =============

export type DataTransformer<TInput, TOutput> = (data: TInput) => TOutput;

export interface TransformOptions {
  includeRelations?: boolean;
  excludeFields?: string[];
  includeFields?: string[];
}

// ============= Cache Types =============

export interface CacheOptions {
  key: string;
  ttl: number; // Time to live in seconds
  enabled?: boolean;
}

export interface CachedResponse<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

// ============= Audit Types =============

export interface AuditContext {
  userId: string;
  organizationId?: string;
  action: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============= Error Factory =============

export function createServiceError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  originalError?: Error
): ServiceError {
  return {
    code,
    message,
    details,
    originalError,
  };
}

export function isServiceError(error: unknown): error is ServiceError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}
