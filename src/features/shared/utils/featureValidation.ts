import { z } from 'zod';
import { FeatureError } from '../types/feature.types';

// Common validation schemas
export const commonSchemas = {
  id: z.string().uuid('Invalid ID format'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  url: z.string().url('Invalid URL format').optional(),
  date: z.string().datetime('Invalid date format').optional(),
  status: z.enum(['active', 'inactive', 'pending', 'archived'], {
    errorMap: () => ({ message: 'Invalid status' })
  }),
  organizationId: z.string().uuid('Invalid organization ID')
};

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').optional(),
  pageSize: z.number().min(1, 'Page size must be at least 1').max(100, 'Page size too large').optional(),
  search: z.string().max(100, 'Search term too long').optional(),
  sortBy: z.string().max(50, 'Sort field name too long').optional(),
  sortOrder: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Sort order must be asc or desc' })
  }).optional()
});

// Validation helper functions
export class FeatureValidator {
  static validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    featureName: string,
    operation = 'validation'
  ): { data: T; error: null } | { data: null; error: FeatureError } {
    try {
      const validatedData = schema.parse(data);
      return { data: validatedData, error: null };
    } catch (error) {
      const featureError: FeatureError = {
        code: 'VALIDATION_ERROR',
        message: this.formatValidationError(error as z.ZodError),
        feature: featureName,
        context: { operation, invalidData: data },
        timestamp: new Date()
      };
      
      return { data: null, error: featureError };
    }
  }

  static validatePagination(
    filters: unknown,
    featureName: string
  ): { data: any; error: null } | { data: null; error: FeatureError } {
    return this.validate(paginationSchema, filters, featureName, 'pagination');
  }

  private static formatValidationError(error: z.ZodError): string {
    const issues = error.issues.map(issue => 
      `${issue.path.join('.')}: ${issue.message}`
    ).join('; ');
    
    return `Validation failed: ${issues}`;
  }

  // Create a validator for specific feature data
  static createFeatureValidator<T>(
    schema: z.ZodSchema<T>,
    featureName: string
  ) {
    return {
      validate: (data: unknown, operation?: string) => 
        this.validate(schema, data, featureName, operation),
      
      validatePartial: (data: unknown, operation?: string) => {
        // Create a partial version of the schema
        const partialSchema = schema instanceof z.ZodObject ? schema.partial() : schema;
        return this.validate(partialSchema, data, featureName, operation);
      }
    };
  }
}

// Common validation patterns for typical features
export const createCrudValidation = <T>(
  createSchema: z.ZodSchema<T>,
  updateSchema: z.ZodSchema<Partial<T>>,
  featureName: string
) => ({
  validateCreate: (data: unknown) => 
    FeatureValidator.validate(createSchema, data, featureName, 'create'),
  
  validateUpdate: (data: unknown) => 
    FeatureValidator.validate(updateSchema, data, featureName, 'update'),
  
  validateId: (id: unknown) => 
    FeatureValidator.validate(commonSchemas.id, id, featureName, 'validateId')
});