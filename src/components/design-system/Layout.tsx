/**
 * Comprehensive Layout System with Responsive Design and Type Safety
 */

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { ContainerProps, StackProps, FlexProps, GridProps, A11yProps } from '@/types/ui.types';

// === CONTAINER COMPONENT ===
const containerVariants = cva(
  ["w-full mx-auto"],
  {
    variants: {
      size: {
        sm: "max-w-2xl",
        md: "max-w-4xl", 
        lg: "max-w-6xl",
        xl: "max-w-7xl",
        full: "max-w-none"
      },
      padding: {
        none: "px-0",
        xs: "px-2",
        sm: "px-4",
        md: "px-6",
        lg: "px-8",
        xl: "px-10",
        xxl: "px-12"
      },
      center: {
        true: "flex flex-col items-center",
        false: ""
      }
    },
    defaultVariants: {
      size: "xl",
      padding: "md",
      center: false
    }
  }
);

export interface EnhancedContainerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'size' | 'aria-disabled'>,
    VariantProps<typeof containerVariants> {
  /** Responsive padding overrides */
  responsivePadding?: {
    sm?: VariantProps<typeof containerVariants>['padding'];
    md?: VariantProps<typeof containerVariants>['padding'];
    lg?: VariantProps<typeof containerVariants>['padding'];
    xl?: VariantProps<typeof containerVariants>['padding'];
  };
}

export const Container = forwardRef<HTMLDivElement, EnhancedContainerProps>(
  ({ className, size, padding, center, responsivePadding, ...props }, ref) => {
    // Build responsive padding classes
    const responsiveClasses = responsivePadding ? [
      responsivePadding.sm && `sm:px-${responsivePadding.sm}`,
      responsivePadding.md && `md:px-${responsivePadding.md}`, 
      responsivePadding.lg && `lg:px-${responsivePadding.lg}`,
      responsivePadding.xl && `xl:px-${responsivePadding.xl}`
    ].filter(Boolean).join(' ') : '';

    return (
      <div
        ref={ref}
        className={cn(
          containerVariants({ size, padding, center }),
          responsiveClasses,
          className
        )}
        {...props}
      />
    );
  }
);

Container.displayName = "Container";

// === FLEX COMPONENT ===
const flexVariants = cva(
  ["flex"],
  {
    variants: {
      direction: {
        row: "flex-row",
        column: "flex-col",
        "row-reverse": "flex-row-reverse",
        "column-reverse": "flex-col-reverse"
      },
      wrap: {
        nowrap: "flex-nowrap",
        wrap: "flex-wrap", 
        "wrap-reverse": "flex-wrap-reverse"
      },
      justify: {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
        around: "justify-around",
        evenly: "justify-evenly"
      },
      align: {
        start: "items-start",
        center: "items-center",
        end: "items-end",
        stretch: "items-stretch",
        baseline: "items-baseline"
      },
      gap: {
        none: "gap-0",
        xs: "gap-1",
        sm: "gap-2",
        md: "gap-4",
        lg: "gap-6",
        xl: "gap-8",
        xxl: "gap-12"
      }
    },
    defaultVariants: {
      direction: "row",
      wrap: "nowrap",
      justify: "start",
      align: "stretch",
      gap: "md"
    }
  }
);

export interface EnhancedFlexProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flexVariants> {
  /** Responsive flex properties */
  responsive?: {
    sm?: Partial<VariantProps<typeof flexVariants>>;
    md?: Partial<VariantProps<typeof flexVariants>>;
    lg?: Partial<VariantProps<typeof flexVariants>>;
    xl?: Partial<VariantProps<typeof flexVariants>>;
  };
}

export const Flex = forwardRef<HTMLDivElement, EnhancedFlexProps>(
  ({ className, direction, wrap, justify, align, gap, responsive, ...props }, ref) => {
    // Build responsive classes
    const responsiveClasses = responsive ? [
      responsive.sm && Object.entries(responsive.sm).map(([key, value]) => 
        `sm:${flexVariants({ [key]: value }).split(' ').find(cls => cls.includes(key))}`
      ).join(' '),
      responsive.md && Object.entries(responsive.md).map(([key, value]) => 
        `md:${flexVariants({ [key]: value }).split(' ').find(cls => cls.includes(key))}`
      ).join(' '),
      responsive.lg && Object.entries(responsive.lg).map(([key, value]) => 
        `lg:${flexVariants({ [key]: value }).split(' ').find(cls => cls.includes(key))}`
      ).join(' '),
      responsive.xl && Object.entries(responsive.xl).map(([key, value]) => 
        `xl:${flexVariants({ [key]: value }).split(' ').find(cls => cls.includes(key))}`
      ).join(' ')
    ].filter(Boolean).join(' ') : '';

    return (
      <div
        ref={ref}
        className={cn(
          flexVariants({ direction, wrap, justify, align, gap }),
          responsiveClasses,
          className
        )}
        {...props}
      />
    );
  }
);

Flex.displayName = "Flex";

// === GRID COMPONENT ===
const gridVariants = cva(
  ["grid"],
  {
    variants: {
      cols: {
        1: "grid-cols-1",
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
        5: "grid-cols-5",
        6: "grid-cols-6",
        7: "grid-cols-7",
        8: "grid-cols-8",
        9: "grid-cols-9",
        10: "grid-cols-10",
        11: "grid-cols-11",
        12: "grid-cols-12"
      },
      rows: {
        1: "grid-rows-1",
        2: "grid-rows-2", 
        3: "grid-rows-3",
        4: "grid-rows-4",
        5: "grid-rows-5",
        6: "grid-rows-6"
      },
      gap: {
        none: "gap-0",
        xs: "gap-1",
        sm: "gap-2",
        md: "gap-4",
        lg: "gap-6", 
        xl: "gap-8",
        xxl: "gap-12"
      }
    },
    defaultVariants: {
      cols: 1,
      gap: "md"
    }
  }
);

export interface EnhancedGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
  /** Responsive grid properties */
  responsive?: {
    sm?: { cols?: number; rows?: number; gap?: VariantProps<typeof gridVariants>['gap'] };
    md?: { cols?: number; rows?: number; gap?: VariantProps<typeof gridVariants>['gap'] };
    lg?: { cols?: number; rows?: number; gap?: VariantProps<typeof gridVariants>['gap'] };
    xl?: { cols?: number; rows?: number; gap?: VariantProps<typeof gridVariants>['gap'] };
  };
}

export const Grid = forwardRef<HTMLDivElement, EnhancedGridProps>(
  ({ className, cols, rows, gap, responsive, ...props }, ref) => {
    // Build responsive classes
    const responsiveClasses = responsive ? [
      responsive.sm && [
        responsive.sm.cols && `sm:grid-cols-${responsive.sm.cols}`,
        responsive.sm.rows && `sm:grid-rows-${responsive.sm.rows}`,
        responsive.sm.gap && `sm:gap-${responsive.sm.gap === 'none' ? '0' : responsive.sm.gap}`
      ].filter(Boolean).join(' '),
      responsive.md && [
        responsive.md.cols && `md:grid-cols-${responsive.md.cols}`,
        responsive.md.rows && `md:grid-rows-${responsive.md.rows}`,
        responsive.md.gap && `md:gap-${responsive.md.gap === 'none' ? '0' : responsive.md.gap}`
      ].filter(Boolean).join(' '),
      responsive.lg && [
        responsive.lg.cols && `lg:grid-cols-${responsive.lg.cols}`,
        responsive.lg.rows && `lg:grid-rows-${responsive.lg.rows}`,
        responsive.lg.gap && `lg:gap-${responsive.lg.gap === 'none' ? '0' : responsive.lg.gap}`
      ].filter(Boolean).join(' '),
      responsive.xl && [
        responsive.xl.cols && `xl:grid-cols-${responsive.xl.cols}`,
        responsive.xl.rows && `xl:grid-rows-${responsive.xl.rows}`,
        responsive.xl.gap && `xl:gap-${responsive.xl.gap === 'none' ? '0' : responsive.xl.gap}`
      ].filter(Boolean).join(' ')
    ].filter(Boolean).join(' ') : '';

    return (
      <div
        ref={ref}
        className={cn(
          gridVariants({ cols, rows, gap }),
          responsiveClasses,
          className
        )}
        {...props}
      />
    );
  }
);

Grid.displayName = "Grid";

// === STACK COMPONENT ===
export interface EnhancedStackProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Stack spacing */
  spacing?: VariantProps<typeof flexVariants>['gap'];
  /** Stack direction */
  direction?: 'vertical' | 'horizontal';
  /** Stack alignment */
  align?: VariantProps<typeof flexVariants>['align'];
  /** Divider between items */
  divider?: React.ReactNode;
}

export const Stack = forwardRef<HTMLDivElement, EnhancedStackProps>(
  ({ className, spacing = 'md', direction = 'vertical', align = 'stretch', divider, children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children).filter(Boolean);
    
    return (
      <Flex
        ref={ref}
        direction={direction === 'vertical' ? 'column' : 'row'}
        align={align}
        gap={divider ? 'none' : spacing}
        className={className}
        {...props}
      >
        {divider ? (
          childrenArray.map((child, index) => (
            <React.Fragment key={index}>
              {child}
              {index < childrenArray.length - 1 && (
                <div className={cn(
                  direction === 'vertical' ? 'w-full' : 'h-full',
                  spacing === 'xs' && (direction === 'vertical' ? 'my-1' : 'mx-1'),
                  spacing === 'sm' && (direction === 'vertical' ? 'my-2' : 'mx-2'),
                  spacing === 'md' && (direction === 'vertical' ? 'my-4' : 'mx-4'),
                  spacing === 'lg' && (direction === 'vertical' ? 'my-6' : 'mx-6'),
                  spacing === 'xl' && (direction === 'vertical' ? 'my-8' : 'mx-8'),
                  spacing === 'xxl' && (direction === 'vertical' ? 'my-12' : 'mx-12')
                )}>
                  {divider}
                </div>
              )}
            </React.Fragment>
          ))
        ) : (
          children
        )}
      </Flex>
    );
  }
);

Stack.displayName = "Stack";

// === SECTION COMPONENT ===
export interface SectionProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Section padding */
  padding?: VariantProps<typeof containerVariants>['padding'];
  /** Section background variant */
  background?: 'default' | 'muted' | 'accent' | 'primary' | 'transparent';
  /** Full width section */
  fullWidth?: boolean;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ className, padding = 'lg', background = 'default', fullWidth = false, ...props }, ref) => {
    const backgroundClasses = {
      default: 'bg-background',
      muted: 'bg-muted/30',
      accent: 'bg-accent/10',
      primary: 'bg-primary/5',
      transparent: 'bg-transparent'
    };

    return (
      <section
        ref={ref}
        className={cn(
          backgroundClasses[background],
          !fullWidth && containerVariants({ padding }),
          fullWidth && 'w-full',
          className
        )}
        {...props}
      />
    );
  }
);

Section.displayName = "Section";

// Export all variants for external use
export {
  containerVariants,
  flexVariants,
  gridVariants
};

export type {
  EnhancedContainerProps as ContainerProps,
  EnhancedFlexProps as FlexProps, 
  EnhancedGridProps as GridProps,
  EnhancedStackProps as StackProps
};