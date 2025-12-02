/**
 * Edge Function Type Definitions
 * Comprehensive types for all edge function requests and responses
 */

// ============= Base Types =============

export interface EdgeFunctionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface EdgeFunctionError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

// ============= AI Chat Types =============

export interface AIChatRequest {
  message: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIChatResponse {
  generatedText: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============= Application Types =============

export interface ApplicationData {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  applicant_email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  cdl?: string;
  exp?: string;
  age?: string;
  source?: string;
  notes?: string;
  job_listing_id?: string;
  [key: string]: unknown;
}

export interface ApplicationSubmitRequest {
  applicationData: ApplicationData;
  jobListingId?: string;
  organizationId?: string;
}

export interface ApplicationSubmitResponse {
  id: string;
  success: boolean;
  message?: string;
}

// ============= Tenstreet Types =============

export interface TenstreetSyncRequest {
  action: 'search_and_sync' | 'sync_applicant' | 'push_applicant';
  phone?: string;
  companyId?: string;
  applicationId?: string;
  driverId?: string;
}

export interface TenstreetSyncResponse {
  success: boolean;
  synced?: number;
  newApplicants?: number;
  updatedApplicants?: number;
  errors?: string[];
  applicantData?: Record<string, unknown>;
}

export interface TenstreetExplorerRequest {
  action: string;
  companyId?: string;
  driverId?: string;
  [key: string]: unknown;
}

export interface TenstreetExplorerResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============= Webhook Types =============

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  signature?: string;
}

export interface WebhookResponse {
  received: boolean;
  processed: boolean;
  applicationId?: string;
  error?: string;
}

export interface ClientWebhookRequest {
  webhookId: string;
  applicationData: ApplicationData;
  organizationId: string;
}

export interface ClientWebhookResponse {
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

// ============= Meta/Facebook Types =============

export interface MetaLeadsRequest {
  action: 'sync_leads' | 'get_campaigns' | 'get_ad_accounts';
  accountId?: string;
  campaignId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MetaLeadData {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
}

export interface MetaLeadsResponse {
  success: boolean;
  leads?: MetaLeadData[];
  totalCount?: number;
  error?: string;
}

export interface MetaAnalyticsRequest {
  action: 'get_spend' | 'get_performance' | 'get_insights';
  accountId: string;
  datePreset?: string;
  startDate?: string;
  endDate?: string;
  level?: 'account' | 'campaign' | 'adset' | 'ad';
}

export interface MetaSpendData {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpc: number;
  ctr: number;
  cpm: number;
}

export interface MetaAnalyticsResponse {
  success: boolean;
  data?: MetaSpendData[];
  summary?: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    avgCPC: number;
    avgCTR: number;
  };
  error?: string;
}

// ============= ElevenLabs Types =============

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  preview_url?: string;
}

export interface ElevenLabsRequest {
  action: 'get_voices' | 'text_to_speech' | 'get_usage' | 'test_connection';
  text?: string;
  voiceId?: string;
  modelId?: string;
  settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface ElevenLabsResponse {
  success: boolean;
  voices?: ElevenLabsVoice[];
  audioUrl?: string;
  usage?: {
    character_count: number;
    character_limit: number;
  };
  error?: string;
}

// ============= Analytics Types =============

export interface AnalyticsQueryRequest {
  type: 'applications' | 'sources' | 'performance' | 'trends';
  organizationId?: string;
  dateFrom?: string;
  dateTo?: string;
  groupBy?: 'day' | 'week' | 'month';
  filters?: Record<string, unknown>;
}

export interface AnalyticsQueryResponse<T = unknown> {
  success: boolean;
  data?: T;
  metadata?: {
    totalRecords: number;
    dateRange: {
      from: string;
      to: string;
    };
  };
  error?: string;
}

// ============= Export Types =============

export interface ExportRequest {
  type: 'applications' | 'analytics' | 'audit_logs';
  format: 'csv' | 'excel' | 'json' | 'pdf';
  filters?: Record<string, unknown>;
  fields?: string[];
  organizationId?: string;
}

export interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  expiresAt?: string;
  error?: string;
}

// ============= Rate Limiting Types =============

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface RateLimitedResponse<T = unknown> extends EdgeFunctionResponse<T> {
  rateLimit?: RateLimitInfo;
}

// ============= Screening Types =============

export interface ScreeningRequest {
  applicationId: string;
  screeningType: 'mvr' | 'drug_test' | 'background' | 'employment';
  options?: Record<string, unknown>;
}

export interface ScreeningResponse {
  success: boolean;
  requestId?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedCompletion?: string;
  error?: string;
}

// ============= SMS Types =============

export interface SMSRequest {
  to: string;
  message: string;
  applicationId?: string;
  templateId?: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  status?: 'queued' | 'sent' | 'delivered' | 'failed';
  error?: string;
}

// ============= Document Types =============

export interface DocumentUploadRequest {
  applicationId: string;
  documentType: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface DocumentUploadResponse {
  success: boolean;
  documentId?: string;
  uploadUrl?: string;
  expiresAt?: string;
  error?: string;
}

// ============= Utility Types =============

export type EdgeFunctionName =
  | 'anthropic-chat'
  | 'openai-chat'
  | 'grok-chat'
  | 'submit-application'
  | 'tenstreet-integration'
  | 'tenstreet-explorer'
  | 'tenstreet-sync'
  | 'meta-ads-analytics'
  | 'elevenlabs-api'
  | 'send-sms'
  | 'client-webhook'
  | 'inbound-applications';

export interface EdgeFunctionInvokeOptions<T = unknown> {
  body?: T;
  headers?: Record<string, string>;
}
