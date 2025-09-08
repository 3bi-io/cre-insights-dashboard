/**
 * Standardized Button Component with consistent patterns
 */

import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const standardButtonVariants = cva(
  // Base styles using design system tokens
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-smooth focus-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-background text-foreground hover:bg-muted hover:text-muted-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active",
        ghost: "text-foreground hover:bg-muted hover:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "btn-success",
        warning: "btn-warning", 
        info: "btn-info",
        premium: "bg-gradient-primary text-primary-foreground shadow-primary hover:shadow-glow"
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        default: "h-9 px-4 py-2 rounded-lg",
        lg: "h-10 px-6 rounded-lg",
        xl: "h-12 px-8 text-base rounded-xl",
        icon: "h-9 w-9 rounded-lg"
      },
      loading: {
        true: "btn-loading",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false
    }
  }
);

export interface StandardButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof standardButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const StandardButton = forwardRef<HTMLButtonElement, StandardButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const isDisabled = disabled || loading;
    
    const buttonContent = loading ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        {loadingText || children}
      </>
    ) : (
      <>
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </>
    );

    return (
      <Comp
        className={cn(standardButtonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {buttonContent}
      </Comp>
    );
  }
);

StandardButton.displayName = "StandardButton";

export { StandardButton, standardButtonVariants };
export default StandardButton;