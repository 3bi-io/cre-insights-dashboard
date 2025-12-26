/**
 * Base ATS Adapter
 * Abstract base class that all ATS adapters must extend
 */

import type { 
  AdapterConfig, 
  ApplicationData, 
  ATSResponse,
  ATSCredentials,
  FieldMapping 
} from './types.ts';

export abstract class BaseATSAdapter {
  protected config: AdapterConfig;
  protected credentials: ATSCredentials;
  protected baseEndpoint: string;

  constructor(config: AdapterConfig) {
    this.config = config;
    this.credentials = config.connection.credentials;
    this.baseEndpoint = config.system.base_endpoint || '';
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
      
      default:
        return value;
    }
  }

  /**
   * Sanitize data for logging (redact PII)
   */
  protected sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ['ssn', 'password', 'api_key', 'apiKey', 'secret', 'token', 'date_of_birth'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Build full name from parts
   */
  protected buildFullName(application: ApplicationData): string {
    if (application.full_name) return application.full_name;
    const parts = [application.first_name, application.last_name].filter(Boolean);
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
   * Format date to ISO string
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
   * Get adapter name for logging
   */
  protected get adapterName(): string {
    return this.config.system.slug;
  }

  /**
   * Log with adapter context
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
    const logData = {
      adapter: this.adapterName,
      connection_id: this.config.connection.id,
      mode: this.config.connection.mode,
      ...data
    };
    
    console[level](`[${this.adapterName}] ${message}`, JSON.stringify(logData));
  }
}
