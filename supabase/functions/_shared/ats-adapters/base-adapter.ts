/**
 * Base ATS Adapter
 * Abstract base class that all ATS adapters must extend
 * Enhanced with retry logic, correlation IDs, and comprehensive logging
 */

import type { 
  AdapterConfig, 
  ApplicationData, 
  ATSResponse,
  ATSCredentials,
  FieldMapping 
} from './types.ts';
import { createLogger, type EdgeLogger } from '../logger.ts';

// Retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

export abstract class BaseATSAdapter {
  protected config: AdapterConfig;
  protected credentials: ATSCredentials;
  protected baseEndpoint: string;
  protected correlationId: string;
  protected logger: EdgeLogger;

  constructor(config: AdapterConfig) {
    this.config = config;
    this.credentials = config.connection.credentials;
    this.baseEndpoint = config.system.base_endpoint || '';
    this.correlationId = this.generateCorrelationId();
    this.logger = createLogger(`ats-${this.adapterName}`, {
      correlationId: this.correlationId,
      connectionId: config.connection.id,
      mode: config.connection.mode
    });
  }

  /**
   * Generate unique correlation ID for request tracking
   */
  protected generateCorrelationId(): string {
    return `ats-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Test the connection to the ATS
   */
  abstract testConnection(): Promise<ATSResponse>;

  /**
   * Send an application to the ATS
   */
  abstract sendApplication(application: ApplicationData): Promise<ATSResponse>;

  /**
   * Sync status from the ATS (if supported)
   */
  async syncStatus(externalId: string): Promise<ATSResponse> {
    return {
      success: false,
      error: 'Status sync not supported by this adapter',
      error_code: 'NOT_SUPPORTED'
    };
  }

  /**
   * Search for applicants in the ATS (if supported)
   */
  async search(criteria: Record<string, string>): Promise<ATSResponse> {
    return {
      success: false,
      error: 'Search not supported by this adapter',
      error_code: 'NOT_SUPPORTED'
    };
  }

  /**
   * Get jobs from the ATS (if supported)
   */
  async getJobs(): Promise<ATSResponse> {
    return {
      success: false,
      error: 'Get jobs not supported by this adapter',
      error_code: 'NOT_SUPPORTED'
    };
  }

  /**
   * Execute HTTP request with retry logic and exponential backoff
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        this.log('info', `${operationName} attempt ${attempt}/${retryConfig.maxRetries}`);
        const result = await operation();
        
        if (attempt > 1) {
          this.log('info', `${operationName} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          this.log('error', `${operationName} failed with non-retryable error`, {
            error: lastError.message,
            attempt
          });
          throw error;
        }
        
        if (attempt < retryConfig.maxRetries) {
          const delay = Math.min(
            retryConfig.baseDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
            retryConfig.maxDelayMs
          );
          
          this.log('warn', `${operationName} failed, retrying in ${delay}ms`, {
            error: lastError.message,
            attempt,
            nextAttemptIn: delay
          });
          
          await this.sleep(delay);
        }
      }
    }
    
    this.log('error', `${operationName} failed after ${retryConfig.maxRetries} attempts`, {
      error: lastError?.message
    });
    
    throw lastError;
  }

  /**
   * Determine if an error is retryable
   */
  protected isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      // Network errors
      if (message.includes('network') || 
          message.includes('timeout') || 
          message.includes('econnreset') ||
          message.includes('enotfound') ||
          message.includes('fetch failed')) {
        return true;
      }
      
      // Rate limiting
      if (message.includes('429') || message.includes('rate limit')) {
        return true;
      }
      
      // Server errors (5xx)
      if (message.includes('500') || 
          message.includes('502') || 
          message.includes('503') || 
          message.includes('504')) {
        return true;
      }
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
   * Apply field mappings to transform application data
   */
  protected applyFieldMappings(
    application: ApplicationData, 
    mapping?: FieldMapping
  ): Record<string, unknown> {
    if (!mapping || !mapping.field_mappings) {
      return application as Record<string, unknown>;
    }

    const mapped: Record<string, unknown> = {};
    
    for (const [targetField, sourceConfig] of Object.entries(mapping.field_mappings)) {
      if (typeof sourceConfig === 'string') {
        // Simple field mapping
        mapped[targetField] = application[sourceConfig];
      } else if (sourceConfig && typeof sourceConfig === 'object') {
        // Complex mapping with transform
        const value = application[sourceConfig.source_field];
        mapped[targetField] = this.applyTransform(value, sourceConfig.transform, mapping.transform_rules);
      }
    }

    return mapped;
  }

  /**
   * Apply a transform to a field value
   */
  protected applyTransform(
    value: unknown, 
    transformName?: string,
    transformRules?: Record<string, { type: string; config: Record<string, unknown> }>
  ): unknown {
    if (!transformName || !transformRules || !transformRules[transformName]) {
      return value;
    }

    const rule = transformRules[transformName];
    
    switch (rule.type) {
      case 'concat':
        if (Array.isArray(value)) {
          return value.join(rule.config.separator as string || ', ');
        }
        return value;
      
      case 'map':
        const mapping = rule.config.mapping as Record<string, unknown>;
        return mapping[String(value)] ?? value;
      
      case 'format':
        // Simple date/string formatting
        return String(value);
      
      case 'uppercase':
        return String(value).toUpperCase();
      
      case 'lowercase':
        return String(value).toLowerCase();
      
      case 'trim':
        return String(value).trim();
      
      case 'date_format':
        try {
          const date = new Date(value as string);
          const format = rule.config.format as string || 'ISO';
          if (format === 'ISO') return date.toISOString();
          if (format === 'DATE') return date.toISOString().split('T')[0];
          return date.toISOString();
        } catch {
          return value;
        }
      
      default:
        return value;
    }
  }

  /**
   * Sanitize data for logging (redact PII)
   */
  protected sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = [
      'ssn', 'social_security', 'social_security_number',
      'password', 'api_key', 'apiKey', 'secret', 'token',
      'date_of_birth', 'dob', 'birth_date',
      'driver_license', 'license_number',
      'bank_account', 'routing_number',
      'credit_card', 'card_number'
    ];
    
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    // Also check nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeForLogging(value as Record<string, unknown>);
      }
    }
    
    return sanitized;
  }

  /**
   * Build full name from parts
   */
  protected buildFullName(application: ApplicationData): string {
    if (application.full_name) return application.full_name;
    const parts = [
      application.prefix,
      application.first_name,
      application.middle_name,
      application.last_name,
      application.suffix
    ].filter(Boolean);
    return parts.join(' ');
  }

  /**
   * Format phone number to E.164
   */
  protected formatPhone(phone?: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return phone;
  }

  /**
   * Format date to ISO string (date only)
   */
  protected formatDate(date?: string): string {
    if (!date) return '';
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch {
      return date;
    }
  }

  /**
   * Format date to ISO string with time
   */
  protected formatDateTime(date?: string): string {
    if (!date) return '';
    try {
      return new Date(date).toISOString();
    } catch {
      return date;
    }
  }

  /**
   * Validate required fields
   */
  protected validateRequiredFields(
    application: ApplicationData,
    requiredFields: string[]
  ): { valid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (!application[field]) {
        missingFields.push(field);
      }
    }
    
    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Get adapter name for logging
   */
  protected get adapterName(): string {
    return this.config.system.slug;
  }

  /**
   * Log with adapter context
   */
  protected log(
    level: 'info' | 'warn' | 'error', 
    message: string, 
    data?: Record<string, unknown>
  ): void {
    const logData = {
      adapter: this.adapterName,
      ...data
    };
    
    switch (level) {
      case 'info':
        this.logger.info(message, logData);
        break;
      case 'warn':
        this.logger.warn(message, logData);
        break;
      case 'error':
        this.logger.error(message, undefined, logData);
        break;
    }
  }

  /**
   * Create standardized error response
   */
  protected createErrorResponse(
    error: Error | string,
    errorCode: string,
    details?: Record<string, unknown>
  ): ATSResponse {
    const errorMessage = error instanceof Error ? error.message : error;
    
    this.log('error', `Request failed: ${errorMessage}`, {
      error_code: errorCode,
      ...details
    });
    
    return {
      success: false,
      error: errorMessage,
      error_code: errorCode,
      data: details
    };
  }

  /**
   * Create standardized success response
   */
  protected createSuccessResponse(
    data?: Record<string, unknown>,
    externalId?: string
  ): ATSResponse {
    this.log('info', 'Request succeeded', {
      external_id: externalId,
      has_data: !!data
    });
    
    return {
      success: true,
      external_id: externalId,
      data
    };
  }
}
