/**
 * Tenstreet Type Definitions
 * Central export point for all Tenstreet-related types
 */

// API Contracts (edge function request/response types)
export type {
  TenstreetMode,
  TenstreetServiceType,
  XchangeServiceType,
  XchangeRequest,
  XchangeResponse,
  SyncApplicantsRequest,
  PushApplicantRequest,
  UpdateStatusRequest,
  SearchAndSyncRequest,
  TenstreetSyncRequest,
  SyncResponse,
  ExplorerAction,
  ExplorerRequest,
  ExplorerResponse,
  BulkOperationRequest,
  BulkOperationResponse,
  AnalyticsType,
  AnalyticsRequest,
  AnalyticsResponse
} from './api-contracts';

export type { BulkOperationType as APIBulkOperationType } from './api-contracts';

// Database types
export type {
  XchangeRequestStatus,
  XchangeRequestDB,
  BulkOperationStatus,
  BulkOperationDB,
  TenstreetCredentialsDB,
  AnalyticsCacheDB
} from './database';

export type { BulkOperationType as DBBulkOperationType } from './database';

// Legacy types (for backward compatibility)
export * from '../tenstreet';
