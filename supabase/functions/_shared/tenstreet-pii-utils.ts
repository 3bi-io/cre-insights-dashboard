/**
 * PII (Personally Identifiable Information) Protection Utilities
 * Provides data masking, redaction, and sanitization for logging and security
 */

/**
 * Redact SSN for logging (show last 4 digits only)
 */
export function redactSSN(ssn: string | null | undefined): string {
  if (!ssn) return '';
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length !== 9) return '***-**-****';
  return `***-**-${cleaned.slice(-4)}`;
}

/**
 * Mask email address for logging
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 
    ? local.slice(0, 2) + '***' 
    : '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number (show last 4 digits)
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '***-***-****';
  return `***-***-${cleaned.slice(-4)}`;
}

/**
 * Redact date of birth (show only year)
 */
export function redactDOB(dob: string | null | undefined): string {
  if (!dob) return '';
  const year = dob.split('-')[0] || dob.split('/')[2];
  return year ? `****-**-** (${year})` : '****-**-**';
}

/**
 * Mask address (show only city and state)
 */
export function maskAddress(address: string | null | undefined, city?: string, state?: string): string {
  if (!address && !city && !state) return '';
  return city && state ? `***, ${city}, ${state}` : '***';
}

/**
 * Sanitize object for logging by redacting sensitive fields
 */
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') return data;

  // Create shallow copy
  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  // List of sensitive field names to redact
  const sensitiveFields = [
    'ssn', 'social_security_number', 'social_security',
    'password', 'secret', 'token', 'api_key', 'apikey',
    'government_id', 'governmentId', 'drivers_license',
    'credit_card', 'creditCard', 'card_number',
    'bank_account', 'routing_number'
  ];

  // List of fields to mask (not fully redact)
  const maskableFields = [
    'email', 'applicant_email', 'internetEmailAddress',
    'phone', 'primaryPhone', 'secondaryPhone', 'mobile',
    'date_of_birth', 'dateOfBirth', 'dob',
    'address', 'address_1', 'address_2', 'street'
  ];

  // Recursively sanitize nested objects
  const sanitizeValue = (value: any, key: string): any => {
    const lowerKey = key.toLowerCase();

    // Check if this is a sensitive field
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      return '[REDACTED]';
    }

    // Check if this is a maskable field
    if (lowerKey.includes('ssn')) {
      return redactSSN(value);
    }
    if (lowerKey.includes('email')) {
      return maskEmail(value);
    }
    if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
      return maskPhone(value);
    }
    if (lowerKey.includes('birth') || lowerKey === 'dob') {
      return redactDOB(value);
    }
    if (lowerKey.includes('address') || lowerKey.includes('street')) {
      return typeof value === 'string' ? '*** [ADDRESS MASKED]' : value;
    }

    // Recursively sanitize nested objects/arrays
    if (value && typeof value === 'object') {
      return sanitizeForLogging(value);
    }

    return value;
  };

  // Process each key
  for (const key in sanitized) {
    if (sanitized.hasOwnProperty(key)) {
      sanitized[key] = sanitizeValue(sanitized[key], key);
    }
  }

  return sanitized;
}

/**
 * Redact sensitive fields from application data
 */
export function redactApplicationData(application: any): any {
  if (!application) return null;

  return {
    ...application,
    ssn: application.ssn ? redactSSN(application.ssn) : undefined,
    government_id: application.government_id ? '[REDACTED]' : undefined,
    date_of_birth: application.date_of_birth ? redactDOB(application.date_of_birth) : undefined,
    applicant_email: application.applicant_email ? maskEmail(application.applicant_email) : undefined,
    phone: application.phone ? maskPhone(application.phone) : undefined,
    secondary_phone: application.secondary_phone ? maskPhone(application.secondary_phone) : undefined,
    address_1: application.address_1 ? '*** [REDACTED]' : undefined,
    address_2: application.address_2 ? '*** [REDACTED]' : undefined,
  };
}

/**
 * Check if a string contains potential PII
 */
export function containsPII(text: string): boolean {
  if (!text) return false;

  // SSN pattern (XXX-XX-XXXX or XXXXXXXXX)
  const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/;
  
  // Email pattern
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  
  // Phone pattern (various formats)
  const phonePattern = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  
  // Credit card pattern (simple check)
  const ccPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/;

  return ssnPattern.test(text) || 
         emailPattern.test(text) || 
         phonePattern.test(text) || 
         ccPattern.test(text);
}

/**
 * Remove PII from text (replace with [REDACTED])
 */
export function stripPII(text: string): string {
  if (!text) return '';

  let sanitized = text;

  // Redact SSNs
  sanitized = sanitized.replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, '[SSN REDACTED]');
  
  // Redact emails
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL REDACTED]');
  
  // Redact phones
  sanitized = sanitized.replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE REDACTED]');
  
  // Redact credit cards
  sanitized = sanitized.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CC REDACTED]');

  return sanitized;
}

/**
 * Get list of sensitive fields that should never be logged
 */
export function getSensitiveFieldNames(): string[] {
  return [
    'ssn',
    'social_security_number',
    'government_id',
    'governmentId',
    'drivers_license',
    'password',
    'api_key',
    'apikey',
    'secret',
    'token',
    'credit_card',
    'creditCard',
    'bank_account',
    'routing_number'
  ];
}

/**
 * Get list of fields that should be masked (not fully redacted) in logs
 */
export function getMaskableFieldNames(): string[] {
  return [
    'email',
    'applicant_email',
    'internetEmailAddress',
    'phone',
    'primaryPhone',
    'secondaryPhone',
    'mobile',
    'date_of_birth',
    'dateOfBirth',
    'dob',
    'address',
    'address_1',
    'address_2',
    'street_address'
  ];
}
