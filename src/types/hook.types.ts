/**
 * Hook Type Definitions
 * Type-safe interfaces for custom React hooks
 */

import { UseQueryResult, UseMutationResult, QueryKey } from '@tanstack/react-query';

// ============= Query Hook Types =============

export interface UseQueryOptions<T = unknown> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  retry?: boolean | number;
  retryDelay?: number | ((attemptIndex: number) => number);
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  select?: (data: T) => unknown;
}

export interface UseQueryResponse<T = unknown> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  status: 'idle' | 'loading' | 'error' | 'success';
}

// ============= Mutation Hook Types =============

export interface UseMutationOptions<TData = unknown, TVariables = unknown> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onMutate?: (variables: TVariables) => Promise<unknown> | unknown;
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables
  ) => void;
  retry?: boolean | number;
  retryDelay?: number | ((attemptIndex: number) => number);
}

export interface UseMutationResponse<TData = unknown, TVariables = unknown> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isPending: boolean;
  error: Error | null;
  data: TData | undefined;
  reset: () => void;
  status: 'idle' | 'loading' | 'error' | 'success';
}

// ============= Paginated Query Types =============

export interface UsePaginatedQueryOptions<T = unknown> extends UseQueryOptions<T> {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedData<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface UsePaginatedQueryResponse<T = unknown> extends UseQueryResponse<PaginatedData<T>> {
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ============= Infinite Query Types =============

export interface UseInfiniteQueryOptions<T = unknown> {
  queryKey: QueryKey;
  queryFn: (context: { pageParam?: number }) => Promise<PaginatedData<T>>;
  getNextPageParam?: (lastPage: PaginatedData<T>) => number | undefined;
  getPreviousPageParam?: (firstPage: PaginatedData<T>) => number | undefined;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

export interface UseInfiniteQueryResponse<T = unknown> {
  data: T[] | undefined;
  fetchNextPage: () => Promise<unknown>;
  fetchPreviousPage: () => Promise<unknown>;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

// ============= Form Hook Types =============

export interface UseFormOptions<T = Record<string, unknown>> {
  initialValues: T;
  validationSchema?: ValidationSchema<T>;
  onSubmit: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface ValidationSchema<T> {
  validate(values: T): ValidationErrors;
}

export type ValidationErrors = Record<string, string | undefined>;

export interface UseFormResponse<T = Record<string, unknown>> {
  values: T;
  errors: ValidationErrors;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (field: keyof T, value: unknown) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: unknown) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  resetForm: () => void;
  validateField: (field: keyof T) => Promise<void>;
  validateForm: () => Promise<ValidationErrors>;
}

// ============= Auth Hook Types =============

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
  fullName?: string;
  avatar?: string;
}

export interface UseAuthResponse {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
}

// ============= Storage Hook Types =============

export interface UseLocalStorageOptions<T> {
  key: string;
  initialValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

export interface UseLocalStorageResponse<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  remove: () => void;
}

// ============= Debounce Hook Types =============

export interface UseDebounceOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

// ============= Async Hook Types =============

export interface UseAsyncOptions<T, TParams extends unknown[] = []> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  immediate?: boolean;
}

export interface UseAsyncResponse<T, TParams extends unknown[] = []> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  execute: (...params: TParams) => Promise<T>;
  reset: () => void;
}

// ============= Selection Hook Types =============

export interface UseSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export interface UseSelectionResponse {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  toggleItem: (id: string) => void;
  toggleAll: () => void;
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  getSelectedItems: <T>(items: T[], getId: (item: T) => string) => T[];
}

// ============= Filter Hook Types =============

export interface UseFiltersOptions<T = Record<string, unknown>> {
  initialFilters?: T;
  onFilterChange?: (filters: T) => void;
}

export interface UseFiltersResponse<T = Record<string, unknown>> {
  filters: T;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  setFilters: (filters: Partial<T>) => void;
  clearFilter: (key: keyof T) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

// ============= Type Guards =============

export function isUseQueryResponse<T>(
  response: unknown
): response is UseQueryResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    'isLoading' in response &&
    'isError' in response
  );
}

export function isUseMutationResponse<TData, TVariables>(
  response: unknown
): response is UseMutationResponse<TData, TVariables> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'mutate' in response &&
    'isLoading' in response &&
    'isSuccess' in response
  );
}
