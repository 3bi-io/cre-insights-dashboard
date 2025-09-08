/**
 * Enhanced Button Component with Complete Type Safety and Design System Integration
 */

import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ButtonProps, A11yProps } from '@/types/ui.types';

const buttonVariants = cva(
  // Base styles using comprehensive design tokens
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-all duration-normal ease-smooth",
    "focus-ring disabled:pointer-events-none disabled:opacity-50",
    "relative overflow-hidden",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0"
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary-hover active:bg-primary-active",
          "shadow-sm hover:shadow-md"
        ],
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90 active:bg-destructive",
          "shadow-sm hover:shadow-md"
        ],
        outline: [
          "border border-border bg-background text-foreground",
          "hover:bg-muted hover:text-muted-foreground",
          "active:bg-muted/80"
        ],
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary-hover active:bg-secondary-active",
          "shadow-sm hover:shadow-md"
        ],
        ghost: [
          "text-foreground hover:bg-muted hover:text-muted-foreground",
          "active:bg-muted/80"
        ],
        link: [
          "text-primary underline-offset-4 hover:underline",
          "active:text-primary-active"
        ],
        success: [
          "bg-success text-success-foreground",
          "hover:bg-success/90 active:bg-success/80",
          "shadow-sm hover:shadow-md"
        ],
        warning: [
          "bg-warning text-warning-foreground", 
          "hover:bg-warning/90 active:bg-warning/80",
          "shadow-sm hover:shadow-md"
        ],
        info: [
          "bg-info text-info-foreground",
          "hover:bg-info/90 active:bg-info/80", 
          "shadow-sm hover:shadow-md"
        ],
        premium: [
          "bg-gradient-primary text-primary-foreground",
          "shadow-primary hover:shadow-glow",
          "hover:scale-105 active:scale-95"
        ],
        gradient: [
          "bg-gradient-accent text-accent-foreground",
          "shadow-md hover:shadow-lg",
          "hover:scale-105 active:scale-95"
        icon: [
          "aspect-square p-0 rounded-lg",
          "[&_svg]:h-4 [&_svg]:w-4"
        ]
        xs: [
          "h-7 px-2.5 text-xs rounded-md",
          "[&_svg]:h-3 [&_svg]:w-3"
        ],
        sm: [
          "h-8 px-3 text-xs rounded-md",
          "[&_svg]:h-3.5 [&_svg]:w-3.5"
        ],
        md: [
          "h-9 px-4 text-sm rounded-lg",
          "[&_svg]:h-4 [&_svg]:w-4"
        ],
        lg: [
          "h-10 px-6 text-sm rounded-lg",
          "[&_svg]:h-4 [&_svg]:w-4"
        ],
        xl: [
          "h-12 px-8 text-base rounded-xl",
          "[&_svg]:h-5 [&_svg]:w-5"
        ],
        xxl: [
          "h-14 px-10 text-lg rounded-xl",
          "[&_svg]:h-6 [&_svg]:w-6"
        ],
        icon: [
          "aspect-square p-0 rounded-lg",
          "[&_svg]:h-4 [&_svg]:w-4"
        ]
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto"
      },
      loading: {
        true: "pointer-events-none opacity-80",
        false: ""
      },
      animation: {
        none: "",
        fade: "animate-fade-in",
        scale: "hover:animate-scale-in active:animate-scale-out",
        bounce: "hover:animate-bounce-in",
        glow: "animate-pulse-glow"
      }
    },
    compoundVariants: [
      // Size-specific icon variants
      {
        size: ["xs", "sm"],
        variant: "icon",
        className: "h-7 w-7"
      },
      {
        size: "md",
        variant: "icon", 
        className: "h-9 w-9"
      },
      {
        size: ["lg", "xl"],
        variant: "icon",
        className: "h-10 w-10"
      },
      {
        size: "xxl",
        variant: "icon",
        className: "h-12 w-12"
      },
      // Loading state adjustments
      {
        loading: true,
        variant: ["premium", "gradient"],
        className: "hover:scale-100"
      }
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      fullWidth: false,
      loading: false,
      animation: "none"
    }
  }
);

export interface EnhancedButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'aria-disabled'>,
    VariantProps<typeof buttonVariants> {
  /** Render as child component */
  asChild?: boolean;
  /** Left icon */
  leftIcon?: LucideIcon;
  /** Right icon */
  rightIcon?: LucideIcon;
  /** Loading state */
  isLoading?: boolean;
  /** Loading text override */
  loadingText?: string;
  /** Icon only mode (hides text) */
  iconOnly?: boolean;
  /** Tooltip text */
  tooltip?: string;
  /** Press animation */
  pressAnimation?: boolean;
  /** Accessibility label */
  'aria-label'?: string;
  /** ARIA disabled */
  'aria-disabled'?: boolean;
}
}

const Button = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    loading: loadingProp,
    isLoading,
    animation,
    asChild = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    loadingText,
    iconOnly = false,
    pressAnimation = false,
    children,
    disabled,
    'aria-label': ariaLabel,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Normalize loading state
    const loading = loadingProp || isLoading || false;
    const isDisabled = disabled || loading;
    
    // Determine if this is an icon-only button
    const isIconButton = iconOnly || (!children && (LeftIcon || RightIcon));
    
    // Animation logic
    const buttonAnimation = pressAnimation ? 'scale' : animation;
    
    const buttonContent = () => {
      if (loading) {
        return (
          <>
            <Loader2 className="animate-spin" />
            {!isIconButton && (loadingText || children)}
          </>
        );
      }
      
      return (
        <>
          {LeftIcon && <LeftIcon />}
          {!isIconButton && children}
          {RightIcon && <RightIcon />}
        </>
      );
    };
    
    // Enhanced accessibility
    const accessibilityProps = {
      'aria-label': ariaLabel || (isIconButton ? String(children) : undefined),
      'aria-disabled': isDisabled,
      'aria-busy': loading,
      ...props
    };

    return (
      <Comp
        className={cn(buttonVariants({ 
          variant, 
          size: isIconButton ? 'icon' : size, 
          fullWidth, 
          loading, 
          animation: buttonAnimation,
          className 
        }))}
        ref={ref}
        disabled={isDisabled}
        {...accessibilityProps}
      >
        {buttonContent()}
      </Comp>
    );
  }
);

Button.displayName = "Button";

// Button group for related actions
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Button group orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Button group size (applies to all buttons) */
  size?: VariantProps<typeof buttonVariants>['size'];
  /** Button group variant (applies to all buttons) */
  variant?: VariantProps<typeof buttonVariants>['variant'];
  /** Attached buttons (no gap) */
  attached?: boolean;
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = 'horizontal', attached = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex",
        orientation === 'horizontal' ? "flex-row" : "flex-col",
        attached ? "divide-border" : "gap-1",
        attached && orientation === 'horizontal' && "divide-x [&>button:not(:first-child)]:rounded-l-none [&>button:not(:last-child)]:rounded-r-none",
        attached && orientation === 'vertical' && "divide-y [&>button:not(:first-child)]:rounded-t-none [&>button:not(:last-child)]:rounded-b-none",
        className
      )}
      role="group"
      {...props}
    >
      {children}
    </div>
  )
);

ButtonGroup.displayName = "ButtonGroup";

export { Button, buttonVariants };
export type { EnhancedButtonProps as ButtonProps };