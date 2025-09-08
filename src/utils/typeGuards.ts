/**
 * Runtime Type Guards and Type Utilities
 * Provides runtime type checking and validation for TypeScript
 */

import type { 
  ApiResponse, 
  ApiError, 
  UserResponse, 
  JobResponse, 
  ApplicationResponse,
  PaginationInfo 
} from '@/types/api.types';

// === PRIMITIVE TYPE GUARDS ===
export const isPrimitive = {
  string: (value: unknown): value is string => typeof value === 'string',
  number: (value: unknown): value is number => typeof value === 'number' && !isNaN(value),
  boolean: (value: unknown): value is boolean => typeof value === 'boolean',
  undefined: (value: unknown): value is undefined => typeof value === 'undefined',
  null: (value: unknown): value is null => value === null,
  symbol: (value: unknown): value is symbol => typeof value === 'symbol',
  bigint: (value: unknown): value is bigint => typeof value === 'bigint',
  function: (value: unknown): value is Function => typeof value === 'function',
  object: (value: unknown): value is object => 
    typeof value === 'object' && value !== null && !Array.isArray(value),
  array: (value: unknown): value is unknown[] => Array.isArray(value),
};

// === ENHANCED TYPE GUARDS ===
export const isValidated = {
  // String validation
  nonEmptyString: (value: unknown): value is string => 
    isPrimitive.string(value) && value.trim().length > 0,
  
  email: (value: unknown): value is string => {
    if (!isPrimitive.string(value)) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  url: (value: unknown): value is string => {
    if (!isPrimitive.string(value)) return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  
  uuid: (value: unknown): value is string => {
    if (!isPrimitive.string(value)) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },
  
  // Number validation
  positiveNumber: (value: unknown): value is number => 
    isPrimitive.number(value) && value > 0,
  
  nonNegativeNumber: (value: unknown): value is number => 
    isPrimitive.number(value) && value >= 0,
  
  integer: (value: unknown): value is number => 
    isPrimitive.number(value) && Number.isInteger(value),
  
  // Date validation
  dateString: (value: unknown): value is string => {
    if (!isPrimitive.string(value)) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  },
  
  validDate: (value: unknown): value is Date => 
    value instanceof Date && !isNaN(value.getTime()),
  
  // Array validation
  nonEmptyArray: <T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] => {
    if (!isPrimitive.array(value) || value.length === 0) return false;
    if (!itemGuard) return true;
    return value.every(itemGuard);
  },
  
  arrayOf: <T>(
    itemGuard: (item: unknown) => item is T
  ) => (value: unknown): value is T[] => 
    isPrimitive.array(value) && value.every(itemGuard),
  
  // Object validation
  objectWithKeys: <T extends Record<string, unknown>>(
    requiredKeys: (keyof T)[]
  ) => (value: unknown): value is T => {
    if (!isPrimitive.object(value)) return false;
    return requiredKeys.every(key => key in value);
  },
  
  record: <T>(
    valueGuard: (value: unknown) => value is T
  ) => (value: unknown): value is Record<string, T> => {
    if (!isPrimitive.object(value)) return false;
    return Object.values(value).every(valueGuard);
  }
};

// === API TYPE GUARDS ===
export const isApiType = {
  apiResponse: <T>(
    value: unknown,
    dataGuard?: (data: unknown) => data is T
  ): value is ApiResponse<T> => {
    if (!isPrimitive.object(value)) return false;
    
    const obj = value as Record<string, unknown>;
    
    // Check required fields
    if (!isPrimitive.boolean(obj.success)) return false;
    
    // Check optional data field
    if (obj.data !== undefined && dataGuard && !dataGuard(obj.data)) {
      return false;
    }
    
    // Check optional error field
    if (obj.error !== undefined && !isApiType.apiError(obj.error)) {
      return false;
    }
    
    // Check optional pagination field
    if (obj.pagination !== undefined && !isApiType.paginationInfo(obj.pagination)) {
      return false;
    }
    
    return true;
  },
  
  apiError: (value: unknown): value is ApiError => {
    if (!isPrimitive.object(value)) return false;
    
    const obj = value as Record<string, unknown>;
    
    return (
      isValidated.nonEmptyString(obj.message) &&
      isValidated.nonEmptyString(obj.code) &&
      isValidated.positiveNumber(obj.statusCode) &&
      isValidated.dateString(obj.timestamp)
    );
  },
  
  paginationInfo: (value: unknown): value is PaginationInfo => {
    if (!isPrimitive.object(value)) return false;
    
    const obj = value as Record<string, unknown>;
    
    return (
      isValidated.nonNegativeNumber(obj.page) &&
      isValidated.positiveNumber(obj.limit) &&
      isValidated.nonNegativeNumber(obj.total) &&
      isValidated.nonNegativeNumber(obj.totalPages) &&
      isPrimitive.boolean(obj.hasNext) &&
      isPrimitive.boolean(obj.hasPrevious)
    );
  },
  
  userResponse: (value: unknown): value is UserResponse => {
    if (!isPrimitive.object(value)) return false;
    
    const obj = value as Record<string, unknown>;
    
    return (
      isValidated.uuid(obj.id) &&
      isValidated.email(obj.email) &&
      isValidated.nonEmptyString(obj.firstName) &&
      isValidated.nonEmptyString(obj.lastName) &&
      ['user', 'admin', 'moderator'].includes(obj.role as string) &&
      ['active', 'inactive', 'suspended'].includes(obj.status as string) &&
      isPrimitive.boolean(obj.emailVerified) &&
      isPrimitive.boolean(obj.phoneVerified) &&
      isValidated.dateString(obj.createdAt) &&
      isValidated.dateString(obj.updatedAt)
    );
  },
  
  jobResponse: (value: unknown): value is JobResponse => {
    if (!isPrimitive.object(value)) return false;
    
    const obj = value as Record<string, unknown>;
    
    return (
      isValidated.uuid(obj.id) &&
      isValidated.nonEmptyString(obj.title) &&
      isValidated.nonEmptyString(obj.description) &&
      isValidated.nonEmptyString(obj.company) &&
      isValidated.nonEmptyString(obj.location) &&
      ['full-time', 'part-time', 'contract', 'internship'].includes(obj.type as string) &&
      isPrimitive.boolean(obj.remote) &&
      isValidated.arrayOf(isPrimitive.string)(obj.skills) &&
      ['draft', 'published', 'closed'].includes(obj.status as string) &&
      isValidated.dateString(obj.createdAt) &&
      isValidated.dateString(obj.updatedAt) &&
      isValidated.uuid(obj.createdBy) &&
      isValidated.nonNegativeNumber(obj.applicationsCount) &&
      isValidated.nonNegativeNumber(obj.viewsCount)
    );
  },
  
  applicationResponse: (value: unknown): value is ApplicationResponse => {
    if (!isPrimitive.object(value)) return false;
    
    const obj = value as Record<string, unknown>;
    
    return (
      isValidated.uuid(obj.id) &&
      isValidated.uuid(obj.jobId) &&
      isValidated.nonEmptyString(obj.applicantName) &&
      isValidated.email(obj.email) &&
      isValidated.nonEmptyString(obj.phone) &&
      ['pending', 'reviewing', 'interviewed', 'accepted', 'rejected'].includes(obj.status as string) &&
      isValidated.nonNegativeNumber(obj.experience) &&
      isValidated.dateString(obj.appliedAt) &&
      isValidated.dateString(obj.updatedAt)
    );
  }
};

// === UTILITY TYPE GUARDS ===
export const isUtility = {
  // Check if value is one of the allowed values
  oneOf: <T extends readonly unknown[]>(
    allowedValues: T
  ) => (value: unknown): value is T[number] => 
    allowedValues.includes(value as T[number]),
  
  // Check if value matches a specific shape
  hasShape: <T extends Record<string, (value: unknown) => boolean>>(
    shape: T
  ) => (value: unknown): value is { [K in keyof T]: T[K] extends (value: unknown) => value is infer U ? U : never } => {
    if (!isPrimitive.object(value)) return false;
    
    const obj = value as Record<string, unknown>;
    
    return Object.entries(shape).every(([key, guard]) => {
      const propValue = obj[key];
      return guard(propValue);
    });
  },
  
  // Check if value is a partial match of a shape
  hasPartialShape: <T extends Record<string, (value: unknown) => boolean>>(
    shape: T
  ) => (value: unknown): value is Partial<{ [K in keyof T]: T[K] extends (value: unknown) => value is infer U ? U : never }> => {
    if (!isPrimitive.object(value)) return false;
    
    const obj = value as Record<string, unknown>;
    
    return Object.entries(obj).every(([key, val]) => {
      const guard = shape[key];
      return !guard || guard(val);
    });
  },
  
  // Check if all values in object pass a guard
  allValues: <T>(
    guard: (value: unknown) => value is T
  ) => (value: unknown): value is Record<string, T> => {
    if (!isPrimitive.object(value)) return false;
    return Object.values(value).every(guard);
  },
  
  // Check if value is not null or undefined
  defined: <T>(value: T | null | undefined): value is T => 
    value !== null && value !== undefined,
  
  // Safe access to nested properties
  safeGet: <T>(
    obj: unknown,
    path: string[],
    guard: (value: unknown) => value is T
  ): T | undefined => {
    let current = obj;
    
    for (const key of path) {
      if (!isPrimitive.object(current) || !(key in current)) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }
    
    return guard(current) ? current : undefined;
  }
};

// === ERROR TYPE GUARDS ===
export const isError = {
  error: (value: unknown): value is Error => value instanceof Error,
  
  withMessage: (value: unknown): value is { message: string } => 
    isPrimitive.object(value) && isValidated.nonEmptyString((value as any).message),
  
  withStack: (value: unknown): value is { stack: string } => 
    isPrimitive.object(value) && isPrimitive.string((value as any).stack),
  
  apiError: (value: unknown): value is ApiError & Error => 
    isError.error(value) && isApiType.apiError(value),
  
  networkError: (value: unknown): value is Error & { statusCode?: number } => 
    isError.error(value) && 
    (isPrimitive.undefined((value as any).statusCode) || 
     isValidated.positiveNumber((value as any).statusCode))
};

// === ASSERTION FUNCTIONS ===
export function assertIsType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage?: string
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(errorMessage || `Value failed type assertion`);
  }
}

export function assertIsArray<T>(
  value: unknown,
  itemGuard?: (item: unknown) => item is T,
  errorMessage?: string
): asserts value is T[] {
  if (!isPrimitive.array(value)) {
    throw new TypeError(errorMessage || 'Value is not an array');
  }
  
  if (itemGuard && !value.every(itemGuard)) {
    throw new TypeError(errorMessage || 'Array contains invalid items');
  }
}

export function assertIsObject<T extends Record<string, unknown>>(
  value: unknown,
  shape?: { [K in keyof T]?: (value: unknown) => value is T[K] },
  errorMessage?: string
): asserts value is T {
  if (!isPrimitive.object(value)) {
    throw new TypeError(errorMessage || 'Value is not an object');
  }
  
  if (shape) {
    const obj = value as Record<string, unknown>;
    for (const [key, guard] of Object.entries(shape)) {
      if (guard && !guard(obj[key])) {
        throw new TypeError(errorMessage || `Property ${key} failed validation`);
      }
    }
  }
}

// === TYPE NARROWING UTILITIES ===
export function narrow<T, U extends T>(
  value: T,
  predicate: (value: T) => value is U
): U | null {
  return predicate(value) ? value : null;
}

export function narrowArray<T, U extends T>(
  values: T[],
  predicate: (value: T) => value is U
): U[] {
  return values.filter(predicate);
}

export function exhaustiveCheck(value: never): never {
  throw new Error(`Exhaustive check failed. Received: ${value}`);
}

// === RUNTIME TYPE VALIDATION DECORATORS ===
export function validateParams<T extends any[]>(
  guards: { [K in keyof T]: (value: unknown) => value is T[K] }
) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: unknown[]) {
      guards.forEach((guard, index) => {
        if (!guard(args[index])) {
          throw new TypeError(`Parameter ${index} failed validation in ${propertyKey}`);
        }
      });
      
      return originalMethod.apply(this, args);
    };
  };
}

export function validateReturn<T>(
  guard: (value: unknown) => value is T
) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const result = originalMethod.apply(this, args);
      
      if (!guard(result)) {
        throw new TypeError(`Return value failed validation in ${propertyKey}`);
      }
      
      return result;
    };
  };
}