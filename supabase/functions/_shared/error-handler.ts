/**
 * Error Handling Utilities for Edge Functions
 * Provides structured error handling and logging
 */

import { errorResponse } from './response.ts';

/**
 * Log error with structured format
 */
export function logError(
  context: string,
  error: Error | unknown,
  details?: Record<string, any>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(`[${context}] Error:`, {
    message: errorMessage,
    stack,
    ...details,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Wrap async handler with error catching
 */
export function catchAsync(
  handler: (req: Request) => Promise<Response>,
  context: string = 'Handler'
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      logError(context, error, {
        method: req.method,
        url: req.url,
      });

      // Return appropriate error response
      if (error instanceof ValidationError) {
        return errorResponse(error.message, 400, { errors: error.errors });
      }

      if (error instanceof AuthenticationError) {
        return errorResponse(error.message, 401);
      }

      if (error instanceof AuthorizationError) {
        return errorResponse(error.message, 403);
      }

      if (error instanceof NotFoundError) {
        return errorResponse(error.message, 404);
      }

      if (error instanceof RateLimitError) {
        return errorResponse(error.message, 429, { retryAfter: error.retryAfter });
      }

      // Generic error
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, 500);
    }
  };
}

/**
 * Wrap handler with full error handling and logging
 */
export function wrapHandler(
  handler: (req: Request) => Promise<Response>,
  options: {
    context?: string;
    logRequests?: boolean;
  } = {}
): (req: Request) => Promise<Response> {
  const { context = 'EdgeFunction', logRequests = false } = options;

  return async (req: Request) => {
    const startTime = Date.now();

    if (logRequests) {
      console.log(`[${context}] ${req.method} ${req.url}`);
    }

    try {
      const response = await handler(req);

      if (logRequests) {
        const duration = Date.now() - startTime;
        console.log(`[${context}] Completed in ${duration}ms - Status: ${response.status}`);
      }

      return response;
    } catch (error) {
      logError(context, error, {
        method: req.method,
        url: req.url,
        duration: Date.now() - startTime,
      });

      return errorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  };
}

/**
 * Custom error classes for better error handling
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ExternalAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ExternalAPIError';
  }
}
