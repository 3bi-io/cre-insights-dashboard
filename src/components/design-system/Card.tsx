/**
 * Enhanced Card Component with Complete Type Safety and Design System Integration
 */

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { CardProps, A11yProps } from '@/types/ui.types';

const cardVariants = cva(
  [
    "relative rounded-lg border bg-card text-card-foreground",
    "transition-all duration-normal ease-smooth"
  ],
  {
    variants: {
      variant: {
        default: "shadow-sm",
        elevated: [
          "shadow-md hover:shadow-lg",
          "transform hover:-translate-y-1"
        ],
        interactive: [
          "cursor-pointer hover:bg-muted/50 hover:shadow-md",
          "active:scale-[0.98] active:shadow-sm"
        ],
        premium: [
          "bg-gradient-surface border-primary/20",
          "shadow-primary hover:shadow-glow"
        ],
        outline: "border-2 shadow-none",
        ghost: "border-0 shadow-none bg-transparent",
        bordered: "border-2 border-border",
        flat: "shadow-none border-0"
      },
      padding: {
        none: "p-0",
        xs: "p-2",
        sm: "p-4", 
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
        xxl: "p-12"
      },
      status: {
        default: "",
        success: [
          "border-success/30 bg-success-light/50",
          "dark:border-success/50 dark:bg-success-light/20"
        ],
        warning: [
          "border-warning/30 bg-warning-light/50",
          "dark:border-warning/50 dark:bg-warning-light/20"
        ],
        error: [
          "border-destructive/30 bg-destructive-light/50", 
          "dark:border-destructive/50 dark:bg-destructive-light/20"
        ],
        info: [
          "border-info/30 bg-info-light/50",
          "dark:border-info/50 dark:bg-info-light/20"
        ],
        pending: [
          "border-muted bg-muted/30",
          "animate-pulse-glow"
        ]
      },
      size: {
        sm: "max-w-sm",
        md: "max-w-md", 
        lg: "max-w-lg",
        xl: "max-w-xl",
        full: "w-full"
      },
      animation: {
        none: "",
        fade: "animate-fade-in",
        scale: "animate-scale-in",
        bounce: "animate-bounce-in",
        slide: "animate-slide-in-right"
      }
    },
    compoundVariants: [
      // Interactive states
      {
        variant: "interactive",
        status: ["success", "warning", "error", "info"],
        className: "hover:brightness-105"
      },
      // Premium variant adjustments
      {
        variant: "premium",
        status: ["success", "warning", "error", "info"],
        className: "border-opacity-50"
      }
    ],
    defaultVariants: {
      variant: "default",
      padding: "md",
      status: "default",
      size: "full",
      animation: "none"
    }
  }
);

export interface EnhancedCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'size' | 'aria-disabled'>,
    VariantProps<typeof cardVariants> {
  /** Clickable card handler */
  onClick?: () => void;
  /** Hoverable effects */
  hoverable?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  isDisabled?: boolean;
  /** Accessibility label */
  'aria-label'?: string;
  /** ARIA disabled */
  'aria-disabled'?: boolean;
}
}

const Card = forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ 
    className, 
    variant, 
    padding, 
    status, 
    size, 
    animation,
    onClick,
    hoverable = false,
    isLoading = false,
    isDisabled = false,
    children,
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    
    const isClickable = Boolean(onClick);
    const cardVariant = isClickable ? 'interactive' : variant;
    const cardAnimation = isLoading ? 'none' : animation;
    
    const accessibilityProps = {
      'aria-label': ariaLabel,
      'aria-disabled': isDisabled,
      'aria-busy': isLoading,
      role: isClickable ? 'button' : undefined,
      tabIndex: isClickable && !isDisabled ? 0 : undefined,
      ...props
    };
    
    const handleClick = () => {
      if (!isDisabled && !isLoading && onClick) {
        onClick();
      }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ 
            variant: cardVariant, 
            padding, 
            status, 
            size, 
            animation: cardAnimation, 
            className 
          }),
          isLoading && "pointer-events-none opacity-70",
          isDisabled && "pointer-events-none opacity-50",
          hoverable && !isClickable && "hover:shadow-md transition-shadow"
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...accessibilityProps}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="loading-spinner h-6 w-6" />
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Enhanced Card Header
const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /** Header variant */
    variant?: 'default' | 'compact' | 'loose';
    /** Header alignment */
    align?: 'left' | 'center' | 'right';
  }
>(({ className, variant = 'default', align = 'left', ...props }, ref) => {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
  
  const variantClasses = {
    default: 'space-y-1.5',
    compact: 'space-y-1',
    loose: 'space-y-2'
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col",
        variantClasses[variant],
        alignmentClasses[align],
        className
      )}
      {...props}
    />
  );
});

CardHeader.displayName = "CardHeader";

// Enhanced Card Title
const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    /** Title level */
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Title size override */
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }
>(({ className, level = 3, size, children, ...props }, ref) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  const sizeClasses = {
    sm: 'text-base font-medium',
    md: 'text-lg font-semibold', 
    lg: 'text-xl font-semibold',
    xl: 'text-2xl font-semibold'
  };
  
  const defaultSizeByLevel = {
    1: 'xl',
    2: 'lg', 
    3: 'md',
    4: 'md',
    5: 'sm',
    6: 'sm'
  } as const;
  
  const finalSize = size || defaultSizeByLevel[level];
  
  return (
    <Component
      ref={ref}
      className={cn(
        sizeClasses[finalSize],
        "leading-none tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

CardTitle.displayName = "CardTitle";

// Enhanced Card Description  
const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    /** Description size */
    size?: 'xs' | 'sm' | 'md';
  }
>(({ className, size = 'sm', ...props }, ref) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm', 
    md: 'text-base'
  };
  
  return (
    <p
      ref={ref}
      className={cn(
        sizeClasses[size],
        "text-muted-foreground leading-relaxed",
        className
      )}
      {...props}
    />
  );
});

CardDescription.displayName = "CardDescription";

// Enhanced Card Content
const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /** Content padding override */
    padding?: VariantProps<typeof cardVariants>['padding'];
  }
>(({ className, padding, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "pt-0",
      padding === 'none' && 'p-0',
      className
    )} 
    {...props} 
  />
));

CardContent.displayName = "CardContent";

// Enhanced Card Footer
const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /** Footer alignment */
    align?: 'left' | 'center' | 'right' | 'between';
  }
>(({ className, align = 'left', ...props }, ref) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center', 
    right: 'justify-end',
    between: 'justify-between'
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center pt-0",
        alignmentClasses[align],
        className
      )}
      {...props}
    />
  );
});

CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants
};

export type { EnhancedCardProps as CardProps };