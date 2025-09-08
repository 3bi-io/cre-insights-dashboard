/**
 * Enhanced Input Component with Complete Type Safety and Design System Integration
 */

import React, { forwardRef, useState, useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X, type LucideIcon } from 'lucide-react';

const inputVariants = cva(
  [
    "flex h-9 w-full rounded-lg border bg-background px-3 py-1 text-sm shadow-sm",
    "transition-colors duration-150 ease-smooth",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:cursor-not-allowed disabled:opacity-50"
  ],
  {
    variants: {
      variant: {
        default: "border-input focus-visible:ring-ring",
        filled: "border-0 bg-muted focus-visible:bg-background",
        outline: "border-2 border-border focus-visible:border-ring",
        ghost: "border-0 bg-transparent focus-visible:bg-muted",
        error: "border-destructive focus-visible:ring-destructive text-destructive",
        success: "border-success focus-visible:ring-success"
      },
      size: {
        sm: "h-8 px-2 text-xs",
        md: "h-9 px-3 text-sm", 
        lg: "h-10 px-4 text-base",
        xl: "h-12 px-4 text-base"
      },
      hasLeftIcon: {
        true: "pl-9",
        false: ""
      },
      hasRightIcon: {
        true: "pr-9",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      hasLeftIcon: false,
      hasRightIcon: false
    }
  }
);

export interface EnhancedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Left icon */
  leftIcon?: LucideIcon;
  /** Right icon */
  rightIcon?: LucideIcon;
  /** Clear button */
  clearable?: boolean;
  /** Error message */
  error?: string;
  /** Success message */
  successMessage?: string;
  /** Input label */
  label?: string;
  /** Help text */
  description?: string;
  /** Loading state */
  isLoading?: boolean;
}

const Input = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({
    className,
    type = "text",
    variant,
    size,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    clearable = false,
    error,
    successMessage,
    label,
    description,
    isLoading = false,
    value,
    onChange,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState(value || '');
    
    // Determine variant based on state
    const currentVariant = error ? 'error' : successMessage ? 'success' : variant;
    
    // Handle clear button
    const handleClear = useCallback(() => {
      const syntheticEvent = {
        target: { value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      
      setInternalValue('');
      onChange?.(syntheticEvent);
    }, [onChange]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    }, [onChange]);

    const showClearButton = clearable && (value || internalValue) && !props.disabled && !isLoading;
    const hasLeftIcon = Boolean(LeftIcon);
    const hasRightIcon = Boolean(RightIcon) || showClearButton;

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {LeftIcon && (
            <LeftIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          
          <input
            type={type}
            className={cn(
              inputVariants({
                variant: currentVariant,
                size,
                hasLeftIcon,
                hasRightIcon,
                className
              })
            )}
            ref={ref}
            value={value ?? internalValue}
            onChange={handleChange}
            {...props}
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <div className="loading-spinner h-4 w-4" />
            )}
            
            {showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {RightIcon && !showClearButton && (
              <RightIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        
        {error && (
          <p className="text-xs text-destructive font-medium">
            {error}
          </p>
        )}
        
        {successMessage && !error && (
          <p className="text-xs text-success font-medium">
            {successMessage}
          </p>
        )}
        
        {description && !error && !successMessage && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
export type { EnhancedInputProps as InputProps };