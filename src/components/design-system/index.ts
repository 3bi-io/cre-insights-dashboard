/**
 * Design System Component Library
 * Centralized export for all enhanced UI components with complete type safety
 */

// === CORE COMPONENTS ===
export { Button, ButtonGroup, buttonVariants } from './Button';
export type { ButtonProps } from './Button';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants
} from './Card';
export type { CardProps } from './Card';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  SimpleDropdown,
  dropdownContentVariants,
  dropdownItemVariants
} from './DropdownMenu';
export type { SimpleDropdownProps } from './DropdownMenu';

// === LAYOUT COMPONENTS ===
export {
  Container,
  Flex,
  Grid,
  Stack,
  Section,
  containerVariants,
  flexVariants,
  gridVariants
} from './Layout';
export type {
  ContainerProps,
  FlexProps,
  GridProps,
  StackProps,
  SectionProps
} from './Layout';

// Re-export components for compatibility
export { StandardButton, StandardCard } from '@/components/common';
export { LazyImage, MemoizedCard } from '@/components/optimized';

// === DESIGN TOKENS ===
export const designTokens = {
  // Spacing scale
  spacing: {
    none: '0',
    xs: '0.25rem',
    sm: '0.5rem', 
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  
  // Size scale
  sizes: {
    xs: 'xs',
    sm: 'sm',
    md: 'md', 
    lg: 'lg',
    xl: 'xl',
    xxl: 'xxl'
  },
  
  // Color variants
  colors: {
    default: 'default',
    primary: 'primary',
    secondary: 'secondary',
    accent: 'accent',
    destructive: 'destructive',
    success: 'success',
    warning: 'warning',
    info: 'info',
    muted: 'muted',
    ghost: 'ghost'
  },
  
  // Status variants
  status: {
    default: 'default',
    success: 'success', 
    warning: 'warning',
    error: 'error',
    info: 'info',
    pending: 'pending'
  },
  
  // Animation durations
  durations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  
  // Border radius
  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem', 
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px'
  },
  
  // Shadows
  shadows: {
    xs: 'var(--shadow-xs)',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)', 
    xl: 'var(--shadow-xl)',
    '2xl': 'var(--shadow-2xl)',
    primary: 'var(--shadow-primary)',
    glow: 'var(--shadow-glow)'
  },
  
  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1400px'
  }
} as const;

// === RESPONSIVE UTILITIES ===
export const responsive = {
  // Responsive padding helper
  padding: (base: keyof typeof designTokens.spacing, overrides?: {
    sm?: keyof typeof designTokens.spacing;
    md?: keyof typeof designTokens.spacing;
    lg?: keyof typeof designTokens.spacing;
    xl?: keyof typeof designTokens.spacing;
  }) => ({
    padding: base,
    responsivePadding: overrides
  }),
  
  // Responsive grid helper
  grid: (baseCols: number, overrides?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  }) => ({
    cols: baseCols as any,
    responsive: overrides ? {
      sm: overrides.sm ? { cols: overrides.sm } : undefined,
      md: overrides.md ? { cols: overrides.md } : undefined,
      lg: overrides.lg ? { cols: overrides.lg } : undefined,
      xl: overrides.xl ? { cols: overrides.xl } : undefined
    } : undefined
  }),
  
  // Responsive flex helper
  flex: (baseDirection: 'row' | 'column', overrides?: {
    sm?: 'row' | 'column';
    md?: 'row' | 'column';
    lg?: 'row' | 'column';
    xl?: 'row' | 'column';
  }) => ({
    direction: baseDirection,
    responsive: overrides ? {
      sm: overrides.sm ? { direction: overrides.sm } : undefined,
      md: overrides.md ? { direction: overrides.md } : undefined,
      lg: overrides.lg ? { direction: overrides.lg } : undefined,
      xl: overrides.xl ? { direction: overrides.xl } : undefined
    } : undefined
  })
};

// === COMPONENT PRESETS ===
export const presets = {
  // Button presets
  buttons: {
    primary: { variant: 'default' as const, size: 'md' as const },
    secondary: { variant: 'secondary' as const, size: 'md' as const },
    destructive: { variant: 'destructive' as const, size: 'md' as const },
    ghost: { variant: 'ghost' as const, size: 'md' as const },
    premium: { variant: 'premium' as const, size: 'lg' as const, animation: 'glow' as const }
  },
  
  // Card presets
  cards: {
    default: { variant: 'default' as const, padding: 'md' as const },
    elevated: { variant: 'elevated' as const, padding: 'lg' as const },
    interactive: { variant: 'interactive' as const, padding: 'md' as const },
    premium: { variant: 'premium' as const, padding: 'lg' as const, animation: 'glow' as const }
  },
  
  // Layout presets
  layouts: {
    page: { size: 'xl' as const, padding: 'lg' as const },
    narrow: { size: 'md' as const, padding: 'md' as const, center: true },
    wide: { size: 'full' as const, padding: 'xl' as const }
  }
};

// === TYPE EXPORTS ===
export type * from '@/types/ui.types';