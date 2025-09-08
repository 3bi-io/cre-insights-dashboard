/**
 * Data Validation Utilities
 * Runtime validation schemas and type guards
 */

import { z } from 'zod';
import type { ValidationError } from '@/types/error.types';

// === PRIMITIVE VALIDATORS ===
export const validators = {
  // String validators
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone number'),
  url: z.string().url('Invalid URL'),
  uuid: z.string().uuid('Invalid UUID'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  
  // Number validators
  positiveInteger: z.number().int().positive('Must be a positive integer'),
  nonNegativeInteger: z.number().int().min(0, 'Must be non-negative'),
  percentage: z.number().min(0).max(100, 'Must be between 0 and 100'),
  currency: z.number().min(0, 'Must be non-negative'),
  
  // Date validators
  futureDate: z.date().min(new Date(), 'Must be a future date'),
  pastDate: z.date().max(new Date(), 'Must be a past date'),
  
  // Array validators
  nonEmptyArray: <T>(schema: z.ZodType<T>) => 
    z.array(schema).min(1, 'Array cannot be empty'),
  uniqueArray: <T>(schema: z.ZodType<T>) => 
    z.array(schema).refine(arr => new Set(arr).size === arr.length, 'Array must contain unique values'),
  
  // Object validators
  nonEmptyObject: z.object({}).refine(obj => Object.keys(obj).length > 0, 'Object cannot be empty'),
  
  // File validators
  imageFile: z.object({
    type: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'Must be an image file'),
    size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB')
  }),
  
  // Password validators
  strongPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
};

// === FORM VALIDATION SCHEMAS ===
export const formSchemas = {
  // User schemas
  userRegistration: z.object({
    email: validators.email,
    password: validators.strongPassword,
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }),

  userProfile: z.object({
    email: validators.email,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: validators.phone.optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    website: validators.url.optional(),
    avatar: validators.imageFile.optional()
  }),

  // Job schemas
  jobPosting: z.object({
    title: z.string().min(1, 'Job title is required').max(100, 'Title too long'),
    description: z.string().min(50, 'Description must be at least 50 characters'),
    company: z.string().min(1, 'Company name is required'),
    location: z.string().min(1, 'Location is required'),
    salary: z.object({
      min: validators.currency,
      max: validators.currency,
      currency: z.enum(['USD', 'EUR', 'GBP'], { errorMap: () => ({ message: 'Invalid currency' }) })
    }).refine(data => data.max >= data.min, {
      message: 'Maximum salary must be greater than or equal to minimum salary',
      path: ['max']
    }).optional(),
    type: z.enum(['full-time', 'part-time', 'contract', 'internship'], {
      errorMap: () => ({ message: 'Invalid job type' })
    }),
    remote: z.boolean(),
    skills: validators.nonEmptyArray(z.string().min(1)),
    requirements: z.array(z.string().min(1)).optional(),
    benefits: z.array(z.string().min(1)).optional(),
    applicationDeadline: validators.futureDate.optional()
  }),

  // Application schemas
  jobApplication: z.object({
    applicantName: z.string().min(1, 'Name is required'),
    email: validators.email,
    phone: validators.phone,
    resume: z.object({
      name: z.string(),
      type: z.string().regex(/^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/, 'Resume must be PDF or Word document'),
      size: z.number().max(10 * 1024 * 1024, 'Resume size must be less than 10MB')
    }),
    coverLetter: z.string().min(100, 'Cover letter must be at least 100 characters').optional(),
    experience: validators.nonNegativeInteger,
    availability: validators.futureDate.optional(),
    expectedSalary: validators.currency.optional(),
    additionalInfo: z.string().max(1000, 'Additional info must be less than 1000 characters').optional()
  })
};

// === API RESPONSE VALIDATORS ===
export const apiSchemas = {
  // Common API response structure
  apiResponse: <T>(dataSchema: z.ZodType<T>) => z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      message: z.string(),
      code: z.string(),
      details: z.any().optional()
    }).optional(),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number()
    }).optional()
  }),

  // User API responses
  userResponse: z.object({
    id: validators.uuid,
    email: validators.email,
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    role: z.enum(['user', 'admin', 'moderator'])
  }),

  // Job API responses
  jobResponse: z.object({
    id: validators.uuid,
    title: z.string(),
    description: z.string(),
    company: z.string(),
    location: z.string(),
    type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
    remote: z.boolean(),
    salary: z.object({
      min: z.number(),
      max: z.number(),
      currency: z.string()
    }).optional(),
    skills: z.array(z.string()),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    status: z.enum(['draft', 'published', 'closed']),
    applicationsCount: z.number()
  }),

  // Application API responses
  applicationResponse: z.object({
    id: validators.uuid,
    jobId: validators.uuid,
    applicantName: z.string(),
    email: validators.email,
    phone: z.string(),
    status: z.enum(['pending', 'reviewing', 'interviewed', 'accepted', 'rejected']),
    appliedAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
};

// === VALIDATION UTILITIES ===
export class ValidationResult<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public errors: ValidationError[] = []
  ) {}

  static success<T>(data: T): ValidationResult<T> {
    return new ValidationResult(true, data);
  }

  static failure(errors: ValidationError[]): ValidationResult {
    return new ValidationResult(false, undefined, errors);
  }

  isValid(): this is ValidationResult<T> & { data: T } {
    return this.success && this.data !== undefined;
  }
}

export function validateData<T>(
  schema: z.ZodType<T>, 
  data: unknown,
  context?: string
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return ValidationResult.success(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        value: err.path.reduce((obj: any, key) => obj?.[key], data)
      }));

      return ValidationResult.failure(validationErrors);
    }

    // Unexpected error
    return ValidationResult.failure([{
      field: 'unknown',
      message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      code: 'validation_error'
    }]);
  }
}

export function validatePartialData<T extends Record<string, any>>(
  schema: z.ZodType<T>, 
  data: unknown
): ValidationResult<Partial<T>> {
  try {
    // Only object schemas have .partial() method
    if (schema instanceof z.ZodObject) {
      const partialSchema = schema.partial();
      const result = partialSchema.parse(data);
      return ValidationResult.success(result as Partial<T>);
    }
    
    // For non-object schemas, validate the full schema but allow partial data
    const result = schema.parse(data);
    return ValidationResult.success(result as Partial<T>);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        value: err.path.reduce((obj: any, key) => obj?.[key], data)
      }));

      return ValidationResult.failure(validationErrors);
    }

    return ValidationResult.failure([{
      field: 'unknown',
      message: `Partial validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      code: 'validation_error'
    }]);
  }
}

export async function validateDataAsync<T>(
  schema: z.ZodType<T>, 
  data: unknown
): Promise<ValidationResult<T>> {
  try {
    const result = await schema.parseAsync(data);
    return ValidationResult.success(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        value: err.path.reduce((obj: any, key) => obj?.[key], data)
      }));

      return ValidationResult.failure(validationErrors);
    }

    return ValidationResult.failure([{
      field: 'unknown',
      message: `Async validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      code: 'validation_error'
    }]);
  }
}

// === TYPE GUARDS ===
export const typeGuards = {
  isString: (value: unknown): value is string => typeof value === 'string',
  isNumber: (value: unknown): value is number => typeof value === 'number' && !isNaN(value),
  isBoolean: (value: unknown): value is boolean => typeof value === 'boolean',
  isArray: (value: unknown): value is unknown[] => Array.isArray(value),
  isObject: (value: unknown): value is Record<string, unknown> => 
    typeof value === 'object' && value !== null && !Array.isArray(value),
  isDate: (value: unknown): value is Date => value instanceof Date && !isNaN(value.getTime()),
  isEmail: (value: unknown): value is string => 
    typeGuards.isString(value) && validators.email.safeParse(value).success,
  isUrl: (value: unknown): value is string => 
    typeGuards.isString(value) && validators.url.safeParse(value).success,
  isUuid: (value: unknown): value is string => 
    typeGuards.isString(value) && validators.uuid.safeParse(value).success,
  isNonEmptyString: (value: unknown): value is string => 
    typeGuards.isString(value) && value.trim().length > 0,
  isPositiveNumber: (value: unknown): value is number => 
    typeGuards.isNumber(value) && value > 0,
  isNonNegativeNumber: (value: unknown): value is number => 
    typeGuards.isNumber(value) && value >= 0
};

// === SANITIZATION UTILITIES ===
export const sanitizers = {
  trimString: (value: string): string => value.trim(),
  normalizeEmail: (email: string): string => email.toLowerCase().trim(),
  normalizePhone: (phone: string): string => phone.replace(/[\s\-\(\)]/g, ''),
  slugify: (text: string): string => 
    text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, ''),
  sanitizeHtml: (html: string): string => {
    // Basic HTML sanitization - in production, use a proper HTML sanitizer like DOMPurify
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
               .replace(/on\w+="[^"]*"/gi, '');
  }
};