/**
 * Base Background Check Adapter
 * Abstract class providing common functionality for all BGC provider integrations
 */

import {
  BGCAdapterConfig,
  BGCRequest,
  BGCResponse,
  BGCReport,
  BGCStatus,
  BGCError,
  CandidateData,
  WebhookValidationResult,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
} from './types.ts';

export abstract class BaseBGCAdapter {
  protected config: BGCAdapterConfig;
  protected correlationId: string;
  
  constructor(config: BGCAdapterConfig) {
    this.config = config;
    this.correlationId = config.correlationId || crypto.randomUUID();
  }
  
  // ============================================================================
  // Abstract Methods - Must be implemented by each provider
  // ============================================================================
  
  /**
   * Create a candidate/subject in the provider's system
   */
  abstract createCandidate(candidate: CandidateData): Promise<BGCResponse>;
  
  /**
   * Initiate a background check for a candidate
   */
  abstract initiateCheck(request: BGCRequest): Promise<BGCResponse>;
  
  /**
   * Get the current status of a background check
   */
  abstract getStatus(externalId: string): Promise<BGCResponse>;
  
  /**
   * Get the full report for a completed check
   */
  abstract getReport(externalId: string): Promise<BGCReport>;
  
  /**
   * Validate and parse an incoming webhook payload
   */
  abstract validateWebhook(
    payload: string,
    signature: string,
    secret: string
  ): WebhookValidationResult;
  
  /**
   * Test the connection credentials
   */
  abstract testConnection(): Promise<BGCResponse>;
  
  // ============================================================================
  // Shared Helper Methods
  // ============================================================================
  
  /**
   * Execute an operation with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        this.log('info', `Executing ${operationName}`, { attempt });
        const result = await operation();
        this.log('info', `${operationName} succeeded`, { attempt });
        return result;
      } catch (error) {
        lastError = error as Error;
        const isRetryable = this.isRetryableError(error);
        
        this.log('warn', `${operationName} failed`, {
          attempt,
          error: lastError.message,
          retryable: isRetryable,
        });
        
        if (!isRetryable || attempt === retryConfig.maxAttempts) {
          break;
        }
        
        const delay = Math.min(
          retryConfig.baseDelayMs * Math.pow(2, attempt - 1),
          retryConfig.maxDelayMs
        );
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }
  
  /**
   * Check if an error is retryable
   */
  protected isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('econnreset') ||
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('503') ||
        message.includes('502')
      );
    }
    return false;
  }
  
  /**
   * Sleep for specified milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Build authorization header based on auth type
   */
  protected getAuthHeaders(): Record<string, string> {
    const { credentials } = this.config.connection;
    const { auth_type } = this.config.provider;
    
    switch (auth_type) {
      case 'basic_auth':
        const basicAuth = btoa(`${credentials.api_key}:`);
        return { 'Authorization': `Basic ${basicAuth}` };
        
      case 'api_key':
        return { 'Authorization': `Bearer ${credentials.api_key}` };
        
      case 'oauth2':
        return { 'Authorization': `Bearer ${credentials.access_token}` };
        
      default:
        return {};
    }
  }
  
  /**
   * Build full URL for API endpoint
   */
  protected buildUrl(path: string, params?: Record<string, string>): string {
    const baseUrl = this.config.provider.base_url.replace(/\/$/, '');
    let url = `${baseUrl}${path}`;
    
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    
    return url;
  }
  
  /**
   * Make HTTP request with common headers
   */
  protected async makeRequest<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildUrl(path);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...this.getAuthHeaders(),
      ...(options.headers as Record<string, string> || {}),
    };
    
    this.log('debug', 'Making request', { 
      url, 
      method: options.method || 'GET',
      hasBody: !!options.body 
    });
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    const responseText = await response.text();
    let responseData: unknown;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    if (!response.ok) {
      this.log('error', 'Request failed', { 
        status: response.status, 
        response: this.sanitizeForLogging(responseData as Record<string, unknown>)
      });
      
      throw new Error(`API request failed: ${response.status} - ${responseText}`);
    }
    
    return responseData as T;
  }
  
  /**
   * Create a standardized success response
   */
  protected createSuccessResponse(data: Partial<BGCResponse>): BGCResponse {
    return {
      success: true,
      provider: this.config.provider.slug,
      status: 'pending',
      timestamp: new Date().toISOString(),
      ...data,
    };
  }
  
  /**
   * Create a standardized error response
   */
  protected createErrorResponse(
    error: Error | string,
    code = 'UNKNOWN_ERROR',
    retryable = false
  ): BGCResponse {
    const message = error instanceof Error ? error.message : error;
    
    return {
      success: false,
      provider: this.config.provider.slug,
      status: 'error',
      error: {
        code,
        message,
        retryable,
      },
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Sanitize data for logging (remove PII)
   */
  protected sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = [
      'ssn', 'social_security_number', 'date_of_birth', 'dob',
      'driver_license_number', 'driver_license', 'dl_number',
      'api_key', 'secret', 'password', 'token', 'access_token',
      'refresh_token', 'client_secret',
    ];
    
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeForLogging(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  /**
   * Map internal status to BGC status
   */
  protected mapStatus(providerStatus: string): BGCStatus {
    const statusMap: Record<string, BGCStatus> = {
      'pending': 'pending',
      'created': 'pending',
      'initiated': 'pending',
      'in_progress': 'processing',
      'running': 'processing',
      'processing': 'processing',
      'waiting': 'waiting_on_candidate',
      'invitation_sent': 'waiting_on_candidate',
      'complete': 'completed',
      'completed': 'completed',
      'finished': 'completed',
      'suspended': 'suspended',
      'dispute': 'suspended',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'error': 'error',
      'failed': 'error',
    };
    
    return statusMap[providerStatus.toLowerCase()] || 'pending';
  }
  
  /**
   * Format date for provider API
   */
  protected formatDate(date?: string): string | undefined {
    if (!date) return undefined;
    
    try {
      const d = new Date(date);
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch {
      return date;
    }
  }
  
  /**
   * Format phone number to E.164
   */
  protected formatPhone(phone?: string): string | undefined {
    if (!phone) return undefined;
    
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    return phone;
  }
  
  /**
   * Centralized logging
   */
  protected log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      correlationId: this.correlationId,
      provider: this.config.provider.slug,
      organizationId: this.config.connection.organization_id,
      message,
      ...data,
    };
    
    switch (level) {
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      default:
        console.log(JSON.stringify(logEntry));
    }
  }
  
  /**
   * Get provider name for logging
   */
  protected get providerName(): string {
    return this.config.provider.name;
  }
  
  /**
   * Check if running in test mode
   */
  protected get isTestMode(): boolean {
    return this.config.connection.mode === 'test';
  }
}
