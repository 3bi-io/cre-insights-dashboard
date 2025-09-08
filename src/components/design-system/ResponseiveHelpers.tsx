/**
 * Responsive Design Utilities and Helpers
 * Standardized responsive patterns across the application
 */

import React from 'react';
import { cn } from '@/lib/utils';

// === RESPONSIVE BREAKPOINT UTILITIES ===
export const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px'
} as const;

// === RESPONSIVE GRID SYSTEM ===
interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Base number of columns */
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  /** Responsive column overrides */
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  };
  /** Grid gap */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  className,
  cols = 1,
  responsive = {},
  gap = 'md',
  children,
  ...props
}) => {
  const baseClass = `grid-cols-${cols}`;
  const gapClass = gap === 'none' ? 'gap-0' : `gap-${gap}`;
  
  const responsiveClasses = [
    responsive.sm && `sm:grid-cols-${responsive.sm}`,
    responsive.md && `md:grid-cols-${responsive.md}`, 
    responsive.lg && `lg:grid-cols-${responsive.lg}`,
    responsive.xl && `xl:grid-cols-${responsive.xl}`
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cn(
        'grid',
        baseClass,
        gapClass,
        responsiveClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// === RESPONSIVE TEXT ===
interface ResponsiveTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Base text size */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  /** Responsive size overrides */
  responsive?: {
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    xl?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  };
  /** Text weight */
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  /** Text color variant */
  variant?: 'default' | 'muted' | 'primary' | 'secondary' | 'accent' | 'destructive' | 'success' | 'warning';
  /** Text alignment */
  align?: 'left' | 'center' | 'right' | 'justify';
  /** Component to render as */
  as?: keyof JSX.IntrinsicElements;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  className,
  size = 'base',
  responsive = {},
  weight = 'normal',
  variant = 'default',
  align = 'left',
  as: Component = 'div',
  children,
  ...props
}) => {
  const sizeClass = `text-${size}`;
  const weightClass = `font-${weight}`;
  const alignClass = `text-${align}`;
  
  const variantClasses = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    destructive: 'text-destructive',
    success: 'text-success',
    warning: 'text-warning'
  };
  
  const responsiveClasses = [
    responsive.sm && `sm:text-${responsive.sm}`,
    responsive.md && `md:text-${responsive.md}`,
    responsive.lg && `lg:text-${responsive.lg}`,
    responsive.xl && `xl:text-${responsive.xl}`
  ].filter(Boolean).join(' ');

  return (
    React.createElement(Component, {
      className: cn(
        sizeClass,
        weightClass,
        alignClass,
        variantClasses[variant],
        responsiveClasses,
        className
      ),
      ...props
    }, children)
  );
};

// === RESPONSIVE SPACING ===
interface ResponsiveSpacingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Base spacing */
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /** Responsive spacing overrides */
  responsive?: {
    sm?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    md?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    lg?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    xl?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  };
  /** Spacing type */
  type?: 'padding' | 'margin' | 'gap';
  /** Spacing direction */
  direction?: 'all' | 'x' | 'y' | 'top' | 'right' | 'bottom' | 'left';
}

export const ResponsiveSpacing: React.FC<ResponsiveSpacingProps> = ({
  className,
  spacing = 'md',
  responsive = {},
  type = 'padding',
  direction = 'all',
  children,
  ...props
}) => {
  const getSpacingClass = (spacingValue: string, prefix: string, dir: string) => {
    const directionMap = {
      all: '',
      x: 'x',
      y: 'y', 
      top: 't',
      right: 'r',
      bottom: 'b',
      left: 'l'
    };
    
    const dirSuffix = directionMap[dir as keyof typeof directionMap];
    const spacingMap = {
      none: '0',
      xs: '1',
      sm: '2',
      md: '4', 
      lg: '6',
      xl: '8',
      xxl: '12'
    };
    
    return `${prefix}${dirSuffix}-${spacingMap[spacingValue as keyof typeof spacingMap]}`;
  };
  
  const typePrefix = type === 'padding' ? 'p' : type === 'margin' ? 'm' : 'gap';
  const baseClass = getSpacingClass(spacing, typePrefix, direction);
  
  const responsiveClasses = [
    responsive.sm && `sm:${getSpacingClass(responsive.sm, typePrefix, direction)}`,
    responsive.md && `md:${getSpacingClass(responsive.md, typePrefix, direction)}`,
    responsive.lg && `lg:${getSpacingClass(responsive.lg, typePrefix, direction)}`,
    responsive.xl && `xl:${getSpacingClass(responsive.xl, typePrefix, direction)}`
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cn(
        baseClass,
        responsiveClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// === RESPONSIVE VISIBILITY ===
interface ResponsiveVisibilityProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show on small screens */
  showOn?: ('sm' | 'md' | 'lg' | 'xl' | '2xl')[];
  /** Hide on small screens */
  hideOn?: ('sm' | 'md' | 'lg' | 'xl' | '2xl')[];
}

export const ResponsiveVisibility: React.FC<ResponsiveVisibilityProps> = ({
  className,
  showOn = [],
  hideOn = [],
  children,
  ...props
}) => {
  const showClasses = showOn.map(breakpoint => `${breakpoint}:block`).join(' ');
  const hideClasses = hideOn.map(breakpoint => `${breakpoint}:hidden`).join(' ');
  
  // Default to hidden if showOn is specified
  const baseVisibility = showOn.length > 0 ? 'hidden' : 'block';

  return (
    <div
      className={cn(
        baseVisibility,
        showClasses,
        hideClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// === MEDIA QUERY HOOKS ===
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

// Breakpoint-specific hooks
export const useIsSmall = () => useMediaQuery(`(max-width: ${breakpoints.sm})`);
export const useIsMedium = () => useMediaQuery(`(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`);
export const useIsLarge = () => useMediaQuery(`(min-width: ${breakpoints.lg})`);
export const useIsExtraLarge = () => useMediaQuery(`(min-width: ${breakpoints.xl})`);

// === RESPONSIVE COMPONENT FACTORY ===
export function createResponsiveComponent<P extends object>(
  Component: React.ComponentType<P>,
  displayName: string
) {
  const ResponsiveComponent = React.forwardRef<any, P & ResponsiveVisibilityProps>(
    ({ showOn, hideOn, ...props }, ref) => {
      if (showOn?.length || hideOn?.length) {
        return (
          <ResponsiveVisibility showOn={showOn} hideOn={hideOn}>
            <Component {...props as P} ref={ref} />
          </ResponsiveVisibility>
        );
      }
      
      return <Component {...props as P} ref={ref} />;
    }
  );
  
  ResponsiveComponent.displayName = `Responsive${displayName}`;
  return ResponsiveComponent;
}