/**
 * Validation Hooks
 * React hooks for form and data validation with real-time feedback
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { z } from 'zod';
import { validateData, validatePartialData, ValidationResult } from '@/utils/validation';
import type { ValidationError } from '@/types/error.types';
import { logger } from '@/lib/logger';

export interface UseValidationOptions<T> {
  /** Validation schema */
  schema: z.ZodType<T>;
  /** Initial data */
  initialData?: Partial<T>;
  /** Validate on change */
  validateOnChange?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
  /** Debounce validation (ms) */
  debounceMs?: number;
  /** Custom validation function */
  customValidation?: (data: Partial<T>) => ValidationError[] | Promise<ValidationError[]>;
  /** Validation mode */
  mode?: 'strict' | 'partial';
}

export interface ValidationState<T> {
  /** Current form data */
  data: Partial<T>;
  /** Validation errors by field */
  errors: Record<string, string>;
  /** Field-level validation status */
  fieldErrors: Record<string, ValidationError[]>;
  /** Overall validation status */
  isValid: boolean;
  /** Currently validating */
  isValidating: boolean;
  /** Fields that have been touched */
  touchedFields: Set<string>;
  /** Fields that are currently dirty */
  dirtyFields: Set<string>;
}

export interface ValidationActions<T> {
  /** Update field value */
  setValue: (field: keyof T, value: any) => void;
  /** Update multiple fields */
  setValues: (values: Partial<T>) => void;
  /** Set field error */
  setFieldError: (field: keyof T, error: string) => void;
  /** Clear field error */
  clearFieldError: (field: keyof T) => void;
  /** Mark field as touched */
  setFieldTouched: (field: keyof T, touched?: boolean) => void;
  /** Validate specific field */
  validateField: (field: keyof T) => Promise<boolean>;
  /** Validate all fields */
  validateAll: () => Promise<boolean>;
  /** Reset form */
  reset: (data?: Partial<T>) => void;
  /** Clear all errors */
  clearErrors: () => void;
}

export function useValidation<T extends Record<string, any>>(
  options: UseValidationOptions<T>
) {
  const {
    schema,
    initialData = {},
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
    customValidation,
    mode = 'partial'
  } = options;

  // State
  const [state, setState] = useState<ValidationState<T>>({
    data: initialData,
    errors: {},
    fieldErrors: {},
    isValid: false,
    isValidating: false,
    touchedFields: new Set(),
    dirtyFields: new Set()
  });

  // Refs
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const validationRef = useRef<Promise<boolean> | null>(null);

  // Debounced validation
  const debouncedValidation = useCallback(async (data: Partial<T>) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    return new Promise<boolean>((resolve) => {
      debounceRef.current = setTimeout(async () => {
        const isValid = await performValidation(data);
        resolve(isValid);
      }, debounceMs);
    });
  }, [debounceMs]);

  // Core validation logic
  const performValidation = useCallback(async (data: Partial<T>): Promise<boolean> => {
    setState(prev => ({ ...prev, isValidating: true }));

    try {
      // Schema validation
      const result = mode === 'strict' 
        ? validateData(schema, data)
        : validatePartialData(schema, data);

      let allErrors: ValidationError[] = result.errors;
      let fieldErrors: Record<string, ValidationError[]> = {};
      let stringErrors: Record<string, string> = {};

      // Group errors by field
      result.errors.forEach(error => {
        if (!fieldErrors[error.field]) {
          fieldErrors[error.field] = [];
        }
        fieldErrors[error.field].push(error);
        stringErrors[error.field] = error.message;
      });

      // Custom validation
      if (customValidation) {
        try {
          const customErrors = await customValidation(data);
          allErrors = [...allErrors, ...customErrors];
          
          customErrors.forEach(error => {
            if (!fieldErrors[error.field]) {
              fieldErrors[error.field] = [];
            }
            fieldErrors[error.field].push(error);
            stringErrors[error.field] = error.message;
          });
        } catch (error) {
          logger.error('Custom validation error', error);
        }
      }

      const isValid = allErrors.length === 0;

      setState(prev => ({
        ...prev,
        errors: stringErrors,
        fieldErrors,
        isValid,
        isValidating: false
      }));

      return isValid;
    } catch (error) {
      logger.error('Validation error', error);
      setState(prev => ({
        ...prev,
        isValid: false,
        isValidating: false
      }));
      return false;
    }
  }, [schema, customValidation, mode]);

  // Actions
  const setValue = useCallback((field: keyof T, value: any) => {
    setState(prev => {
      const newData = { ...prev.data, [field]: value };
      const newDirtyFields = new Set(prev.dirtyFields);
      newDirtyFields.add(String(field));

      return {
        ...prev,
        data: newData,
        dirtyFields: newDirtyFields
      };
    });

    if (validateOnChange) {
      setState(prev => ({ ...prev, data: { ...prev.data, [field]: value } }));
      debouncedValidation({ ...state.data, [field]: value });
    }
  }, [validateOnChange, debouncedValidation, state.data]);

  const setValues = useCallback((values: Partial<T>) => {
    setState(prev => {
      const newData = { ...prev.data, ...values };
      const newDirtyFields = new Set(prev.dirtyFields);
      Object.keys(values).forEach(key => newDirtyFields.add(key));

      return {
        ...prev,
        data: newData,
        dirtyFields: newDirtyFields
      };
    });

    if (validateOnChange) {
      const newData = { ...state.data, ...values };
      debouncedValidation(newData);
    }
  }, [validateOnChange, debouncedValidation, state.data]);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
      fieldErrors: {
        ...prev.fieldErrors,
        [field]: [{ field: String(field), message: error, code: 'custom' }]
      },
      isValid: false
    }));
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setState(prev => {
      const newErrors = { ...prev.errors };
      const newFieldErrors = { ...prev.fieldErrors };
      delete newErrors[String(field)];
      delete newFieldErrors[String(field)];

      return {
        ...prev,
        errors: newErrors,
        fieldErrors: newFieldErrors,
        isValid: Object.keys(newErrors).length === 0
      };
    });
  }, []);

  const setFieldTouched = useCallback((field: keyof T, touched = true) => {
    setState(prev => {
      const newTouchedFields = new Set(prev.touchedFields);
      if (touched) {
        newTouchedFields.add(String(field));
      } else {
        newTouchedFields.delete(String(field));
      }

      return {
        ...prev,
        touchedFields: newTouchedFields
      };
    });

    if (validateOnBlur && touched) {
      debouncedValidation(state.data);
    }
  }, [validateOnBlur, debouncedValidation, state.data]);

  const validateField = useCallback(async (field: keyof T): Promise<boolean> => {
    // Create a minimal object with just the field to validate
    const fieldData = { [field]: state.data[field] };
    const result = await performValidation(fieldData as Partial<T>);
    return result;
  }, [state.data, performValidation]);

  const validateAll = useCallback(async (): Promise<boolean> => {
    if (validationRef.current) {
      return validationRef.current;
    }

    validationRef.current = performValidation(state.data);
    const result = await validationRef.current;
    validationRef.current = null;
    
    return result;
  }, [state.data, performValidation]);

  const reset = useCallback((data: Partial<T> = {}) => {
    setState({
      data: { ...initialData, ...data },
      errors: {},
      fieldErrors: {},
      isValid: false,
      isValidating: false,
      touchedFields: new Set(),
      dirtyFields: new Set()
    });
  }, [initialData]);

  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
      fieldErrors: {},
      isValid: true
    }));
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    // State
    ...state,
    // Actions
    setValue,
    setValues,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    validateField,
    validateAll,
    reset,
    clearErrors,
    // Computed
    hasErrors: Object.keys(state.errors).length > 0,
    isDirty: state.dirtyFields.size > 0,
    isFieldTouched: (field: keyof T) => state.touchedFields.has(String(field)),
    isFieldDirty: (field: keyof T) => state.dirtyFields.has(String(field)),
    getFieldError: (field: keyof T) => state.errors[String(field)],
    getFieldErrors: (field: keyof T) => state.fieldErrors[String(field)] || []
  };
}

// Specialized hook for form validation
export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodType<T>,
  options: Omit<UseValidationOptions<T>, 'schema'> = {}
) {
  const validation = useValidation({ schema, ...options });

  const handleSubmit = useCallback(
    (onSubmit: (data: T, isValid: boolean) => void | Promise<void>) =>
      async (e?: React.FormEvent) => {
        e?.preventDefault();
        
        const isValid = await validation.validateAll();
        
        if (isValid && validation.data) {
          await onSubmit(validation.data as T, isValid);
        } else {
          await onSubmit(validation.data as T, isValid);
        }
      },
    [validation]
  );

  return {
    ...validation,
    handleSubmit
  };
}

// Hook for validating individual fields
export function useFieldValidation<T>(
  fieldSchema: z.ZodType<T>,
  options: {
    initialValue?: T;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    debounceMs?: number;
  } = {}
) {
  const {
    initialValue,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300
  } = options;

  const [value, setValue] = useState<T | undefined>(initialValue);
  const [error, setError] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const validate = useCallback(async (val: T | undefined): Promise<boolean> => {
    if (val === undefined) {
      setError('');
      return true;
    }

    setIsValidating(true);
    
    try {
      const result = validateData(fieldSchema, val);
      setError(result.errors[0]?.message || '');
      setIsValidating(false);
      return result.success;
    } catch (err) {
      setError('Validation failed');
      setIsValidating(false);
      return false;
    }
  }, [fieldSchema]);

  const debouncedValidate = useCallback((val: T | undefined) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      validate(val);
    }, debounceMs);
  }, [validate, debounceMs]);

  const updateValue = useCallback((newValue: T | undefined) => {
    setValue(newValue);
    
    if (validateOnChange) {
      debouncedValidate(newValue);
    }
  }, [validateOnChange, debouncedValidate]);

  const handleBlur = useCallback(() => {
    setIsTouched(true);
    
    if (validateOnBlur) {
      validate(value);
    }
  }, [validateOnBlur, validate, value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    value,
    setValue: updateValue,
    error,
    isValidating,
    isTouched,
    isValid: !error,
    validate: () => validate(value),
    handleBlur,
    setTouched: setIsTouched,
    clearError: () => setError('')
  };
}