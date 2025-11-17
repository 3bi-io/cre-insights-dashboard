/**
 * Error Handling Type Definitions
 */

import { ErrorInfo, ReactNode } from 'react';

export type ErrorLevel = 'warning' | 'error' | 'critical';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Boundary identifier for logging */
  name?: string;
  /** Error severity level */
  level?: ErrorLevel;
  /** Show technical details to users */
  showDetails?: boolean;
  /** Tags for error categorization */
  tags?: Record<string, string>;
  /** Additional error context */
  extraData?: Record<string, unknown>;
  /** Custom fallback render function */
  fallback?: (error: Error | null, retry: () => void, errorId: string | null) => ReactNode;
  /** Props for default fallback component */
  fallbackProps?: {
    title?: string;
    description?: string;
  };
  /** Error callback */
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  /** Retry callback */
  onRetry?: () => void;
}

export interface ErrorFallbackProps {
  error: Error | null;
  errorId?: string | null;
  componentStack?: string;
  onRetry?: () => void;
  onReport?: () => void;
  onNavigateHome?: () => void;
  onGoBack?: () => void;
  level?: ErrorLevel;
  showDetails?: boolean;
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

export interface ErrorContext {
  errorId: string;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  componentStack?: string;
  errorBoundary?: string;
  level: ErrorLevel;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  userReported?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

export interface NetworkError extends Error {
  statusCode?: number;
  response?: unknown;
  requestId?: string;
}

export interface SupabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
}

export interface DatabaseError extends Error {
  code: string;
  table?: string;
  column?: string;
  constraint?: string;
}

export interface ErrorServiceConfig {
  apiEndpoint?: string;
  apiKey?: string;
  environment: 'development' | 'staging' | 'production';
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  maxErrorsPerSession: number;
  rateLimitMs: number;
}

export interface ErrorReportPayload {
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  context: ErrorContext;
  environment: {
    userAgent: string;
    url: string;
    timestamp: string;
    viewport: {
      width: number;
      height: number;
    };
    screen: {
      width: number;
      height: number;
    };
  };
  user?: {
    id?: string;
    email?: string;
  };
}