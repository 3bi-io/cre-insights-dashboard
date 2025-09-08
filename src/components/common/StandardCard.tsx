/**
 * Standardized Card Component with consistent patterns
 */

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const standardCardVariants = cva(
  // Base styles using design system tokens
  "rounded-lg border border-border bg-card text-card-foreground transition-smooth",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        elevated: "card-elevated",
        interactive: "card-interactive hover:shadow-md",
        premium: "card-premium",
        outline: "border-2",
        ghost: "border-0 shadow-none bg-transparent"
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6", 
        lg: "p-8"
      },
      status: {
        none: "",
        success: "border-success bg-success-light",
        warning: "border-warning bg-warning-light", 
        destructive: "border-destructive bg-destructive-light",
        info: "border-info bg-info-light"
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      status: "none"
    }
  }
);

export interface StandardCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof standardCardVariants> {}

const StandardCard = forwardRef<HTMLDivElement, StandardCardProps>(
  ({ className, variant, padding, status, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(standardCardVariants({ variant, padding, status, className }))}
      {...props}
    />
  )
);

StandardCard.displayName = "StandardCard";

const StandardCardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));

StandardCardHeader.displayName = "StandardCardHeader";

const StandardCardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));

StandardCardTitle.displayName = "StandardCardTitle";

const StandardCardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));

StandardCardDescription.displayName = "StandardCardDescription";

const StandardCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
));

StandardCardContent.displayName = "StandardCardContent";

const StandardCardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-0", className)}
    {...props}
  />
));

StandardCardFooter.displayName = "StandardCardFooter";

export {
  StandardCard,
  StandardCardHeader,
  StandardCardTitle,
  StandardCardDescription,
  StandardCardContent,
  StandardCardFooter,
  standardCardVariants
};

export default StandardCard;