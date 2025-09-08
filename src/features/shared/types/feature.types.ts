// Shared feature architecture types
export interface BaseFeatureConfig {
  name: string;
  route: string;
  enabled: boolean;
  permissions?: string[];
  requiresAuth?: boolean;
  organizationFeature?: string;
}

export interface FeatureError {
  code: string;
  message: string;
  feature: string;
  context?: Record<string, any>;
  timestamp: Date;
}

export interface FeatureState<T = any> {
  data: T | null;
  loading: boolean;
  error: FeatureError | null;
  initialized: boolean;
}

export type ApiResponse<T = any> = {
  data: T;
  error: null;
} | {
  data: null;
  error: FeatureError;
};

export interface PaginatedResponse<T = any> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface FilterOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface FeatureHookReturn<T = any> extends FeatureState<T> {
  refresh: () => Promise<void>;
  reset: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setData: (data: T | null) => void;
  setError: (error: FeatureError | null) => void;
}