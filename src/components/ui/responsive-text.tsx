/**
 * Responsive Text Component
 * Provides consistent, mobile-first responsive typography
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

interface ResponsiveTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: TextSize;
  weight?: TextWeight;
  variant?: 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'destructive';
  responsive?: boolean;
}

const sizeClasses: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-sm sm:text-base',
  lg: 'text-base sm:text-lg',
  xl: 'text-lg sm:text-xl',
  '2xl': 'text-xl sm:text-2xl',
  '3xl': 'text-2xl sm:text-3xl',
  '4xl': 'text-3xl sm:text-4xl',
};

const weightClasses: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const variantClasses = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

export const ResponsiveText = React.forwardRef<HTMLElement, ResponsiveTextProps>(
  ({ 
    as: Component = 'p', 
    size = 'base', 
    weight = 'normal',
    variant = 'default',
    responsive = true,
    className,
    children,
    ...props 
  }, ref) => {
    const textClasses = cn(
      responsive ? sizeClasses[size] : `text-${size}`,
      weightClasses[weight],
      variantClasses[variant],
      'leading-normal',
      className
    );

    return (
      <Component ref={ref as any} className={textClasses} {...props}>
        {children}
      </Component>
    );
  }
);

ResponsiveText.displayName = "ResponsiveText";

// Convenient heading components
export const H1 = React.forwardRef<HTMLHeadingElement, Omit<ResponsiveTextProps, 'as' | 'size'>>(
  (props, ref) => <ResponsiveText as="h1" size="4xl" weight="bold" {...props} ref={ref as any} />
);
H1.displayName = "H1";

export const H2 = React.forwardRef<HTMLHeadingElement, Omit<ResponsiveTextProps, 'as' | 'size'>>(
  (props, ref) => <ResponsiveText as="h2" size="3xl" weight="semibold" {...props} ref={ref as any} />
);
H2.displayName = "H2";

export const H3 = React.forwardRef<HTMLHeadingElement, Omit<ResponsiveTextProps, 'as' | 'size'>>(
  (props, ref) => <ResponsiveText as="h3" size="2xl" weight="semibold" {...props} ref={ref as any} />
);
H3.displayName = "H3";

export const H4 = React.forwardRef<HTMLHeadingElement, Omit<ResponsiveTextProps, 'as' | 'size'>>(
  (props, ref) => <ResponsiveText as="h4" size="xl" weight="semibold" {...props} ref={ref as any} />
);
H4.displayName = "H4";
