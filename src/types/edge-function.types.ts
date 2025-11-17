/**
 * Edge Function Type Definitions
 * Type-safe interfaces for Supabase Edge Functions
 */

import { z } from 'zod';

// ============= Base Edge Function Types =============

export interface EdgeFunctionRequest<T = unknown> {
  method: string;
  headers: Headers;
  body?: T;
  url: string;
}

export interface EdgeFunctionResponse<T = unknown> {
  data?: T;
  error?: EdgeFunctionError;
  success: boolean;
  timestamp?: string;
}

export interface EdgeFunctionError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface EdgeFunctionContext {
  userId?: string;
  organizationId?: string;
  requestId: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
}

// ============= Auth Types =============

export interface AuthenticatedRequest<T = unknown> {
  userId: string;
  organizationId?: string;
  body: T;
  headers: Headers;
}

export interface AuthResult {
  userId: string;
  organizationId?: string;
  role?: string;
  email?: string;
}

// ============= Generic Response Builders =============

export type SuccessResponse<T = unknown> = {
  data: T;
  success: true;
  timestamp: string;
};

export type ErrorResponse = {
  error: EdgeFunctionError;
  success: false;
  timestamp: string;
};

export type EdgeResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// ============= Validation Types =============

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============= Rate Limiting Types =============

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetAt?: number;
  retryAfter?: number;
}

// ============= Webhook Types =============

export interface WebhookPayload<T = unknown> {
  event: string;
  data: T;
  timestamp: string;
  signature?: string;
}

export interface WebhookResponse {
  received: boolean;
  processed?: boolean;
  error?: string;
}

// ============= AI Provider Types =============

export interface AIProviderRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIProviderResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

// ============= Meta/Facebook Types =============

export interface MetaAdAccountRequest {
  accessToken: string;
  accountId: string;
}

export interface MetaCampaignData {
  id: string;
  name: string;
  status: string;
  objective?: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
}

// ============= Tenstreet Types =============

export interface TenstreetCredentials {
  clientId: string;
  password: string;
  mode: 'DEV' | 'TEST' | 'PROD';
  apiEndpoint: string;
}

export interface TenstreetSyncRequest {
  organizationId: string;
  action: 'sync' | 'push' | 'pull';
  applicantIds?: string[];
}

export interface TenstreetSyncResponse {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors?: string[];
}

// ============= File Upload Types =============

export interface FileUploadRequest {
  file: File | Blob;
  bucket: string;
  path: string;
  contentType?: string;
}

export interface FileUploadResponse {
  url: string;
  path: string;
  size: number;
  contentType: string;
}

// ============= Analytics Types =============

export interface AnalyticsEventRequest {
  eventName: string;
  properties: Record<string, string | number | boolean>;
  userId?: string;
  organizationId?: string;
  timestamp?: string;
}

export interface AnalyticsQueryRequest {
  startDate: string;
  endDate: string;
  metrics: string[];
  dimensions?: string[];
  filters?: Record<string, string | number>;
}

export interface AnalyticsQueryResponse {
  data: Record<string, unknown>[];
  totalRows: number;
  aggregations?: Record<string, number>;
}

// ============= Cron Job Types =============

export interface CronJobContext {
  scheduledTime: string;
  actualTime: string;
  jobName: string;
}

export interface CronJobResult {
  success: boolean;
  itemsProcessed: number;
  errors?: string[];
  duration: number;
}

// ============= Email Types =============

export interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface EmailResponse {
  messageId: string;
  accepted: string[];
  rejected?: string[];
}

// ============= SMS Types =============

export interface SMSRequest {
  to: string;
  message: string;
  from?: string;
}

export interface SMSResponse {
  messageId: string;
  status: 'queued' | 'sent' | 'failed';
  to: string;
}

// ============= Type Guards =============

export function isSuccessResponse<T>(
  response: EdgeResponse<T>
): response is SuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse(
  response: EdgeResponse<unknown>
): response is ErrorResponse {
  return response.success === false;
}

export function isAuthenticatedRequest<T>(
  request: unknown
): request is AuthenticatedRequest<T> {
  return (
    typeof request === 'object' &&
    request !== null &&
    'userId' in request &&
    typeof (request as AuthenticatedRequest).userId === 'string'
  );
}

// ============= Zod Schema Helpers =============

export const EdgeFunctionRequestSchema = z.object({
  method: z.string(),
  headers: z.custom<Headers>(),
  url: z.string().url(),
});

export const AuthenticatedRequestSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  body: z.unknown(),
  headers: z.custom<Headers>(),
});

export const PaginationSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(1000).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ============= Error Factory =============

export function createEdgeFunctionError(
  message: string,
  code: string,
  statusCode: number = 500,
  details?: Record<string, unknown>
): EdgeFunctionError {
  return {
    message,
    code,
    statusCode,
    details,
    stack: new Error().stack,
  };
}

export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    data,
    success: true,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(error: EdgeFunctionError): ErrorResponse {
  return {
    error,
    success: false,
    timestamp: new Date().toISOString(),
  };
}
