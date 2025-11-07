/**
 * Standardized Response Utilities for Edge Functions
 * Provides consistent response formatting across all functions
 */

import { getCorsHeaders } from './cors-config.ts';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, any>,
  origin?: string
): Response {
  const responseData: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { ...getCorsHeaders(origin || null), 'Content-Type': 'application/json' },
  });
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: string | Error,
  statusCode: number = 500,
  details?: Record<string, any>,
  origin?: string
): Response {
  const errorMessage = error instanceof Error ? error.message : error;
  
  const responseData: ApiResponse = {
    success: false,
    error: errorMessage,
    meta: {
      timestamp: new Date().toISOString(),
      ...details,
    },
  };

  return new Response(JSON.stringify(responseData), {
    status: statusCode,
    headers: { ...getCorsHeaders(origin || null), 'Content-Type': 'application/json' },
  });
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  errors: Array<{ field: string; message: string }> | string,
  origin?: string
): Response {
  const errorMessage = typeof errors === 'string' 
    ? errors 
    : 'Validation failed';
  
  const responseData: ApiResponse = {
    success: false,
    error: errorMessage,
    ...(Array.isArray(errors) && { data: { errors } }),
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return new Response(JSON.stringify(responseData), {
    status: 400,
    headers: { ...getCorsHeaders(origin || null), 'Content-Type': 'application/json' },
  });
}

/**
 * Create an authentication error response
 */
export function authErrorResponse(message: string = 'Authentication required'): Response {
  return errorResponse(message, 401);
}

/**
 * Create an authorization error response
 */
export function forbiddenResponse(message: string = 'Insufficient permissions'): Response {
  return errorResponse(message, 403);
}

/**
 * Create a not found error response
 */
export function notFoundResponse(resource: string = 'Resource'): Response {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Create a rate limit error response
 */
export function rateLimitResponse(retryAfter?: number, origin?: string): Response {
  const responseData: ApiResponse = {
    success: false,
    error: 'Rate limit exceeded',
    meta: {
      timestamp: new Date().toISOString(),
      ...(retryAfter && { retryAfter }),
    },
  };

  return new Response(JSON.stringify(responseData), {
    status: 429,
    headers: {
      ...getCorsHeaders(origin || null),
      'Content-Type': 'application/json',
      ...(retryAfter && { 'Retry-After': retryAfter.toString() }),
    },
  });
}
