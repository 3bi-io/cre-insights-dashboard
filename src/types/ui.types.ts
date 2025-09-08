/**
 * Comprehensive UI Type Definitions
 * Provides type safety and reliability for all UI components
 */

import { type VariantProps } from 'class-variance-authority';
import { type LucideIcon } from 'lucide-react';

// === CORE UI TYPES ===
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
}

export interface ResponsiveProps {
  /** Responsive size variants */
  responsive?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

export interface InteractiveProps {
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  isDisabled?: boolean;
  /** Loading text override */
  loadingText?: string;
  /** Accessibility label */
  'aria-label'?: string;
}

// === SIZE SYSTEM ===
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type SpacingVariant = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

// === COLOR SYSTEM ===
export type ColorVariant = 
  | 'default'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info'
  | 'muted'
  | 'ghost';

export type StatusVariant = 
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending';

// === COMPONENT VARIANTS ===
export type ButtonVariant = 
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'success'
  | 'warning'
  | 'info'
  | 'premium'
  | 'gradient';

export type CardVariant =
  | 'default'
  | 'elevated'
  | 'interactive'
  | 'premium'
  | 'outline'
  | 'ghost'
  | 'bordered'
  | 'flat';

export type InputVariant =
  | 'default'
  | 'filled'
  | 'outline'
  | 'ghost'
  | 'error'
  | 'success';

// === ANIMATION TYPES ===
export type AnimationType =
  | 'none'
  | 'fade'
  | 'slide'
  | 'scale'
  | 'bounce'
  | 'spin'
  | 'pulse'
  | 'glow';

export interface AnimationProps {
  animation?: AnimationType;
  animationDuration?: 'fast' | 'normal' | 'slow';
  animationDelay?: number;
}

// === LAYOUT TYPES ===
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
export type JustifyContent = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type AlignItems = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

export interface FlexProps {
  direction?: FlexDirection;
  wrap?: FlexWrap;
  justify?: JustifyContent;
  align?: AlignItems;
  gap?: SpacingVariant;
}

export interface GridProps {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  rows?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: SpacingVariant;
  responsive?: {
    sm?: { cols?: number; rows?: number };
    md?: { cols?: number; rows?: number };
    lg?: { cols?: number; rows?: number };
    xl?: { cols?: number; rows?: number };
  };
}

// === FORM TYPES ===
export interface FormFieldProps extends BaseComponentProps {
  /** Field name for form handling */
  fieldName: string;
  /** Field label */
  label?: string;
  /** Help text */
  description?: string;
  /** Error message */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** Field variant */
  variant?: InputVariant;
}

export interface ValidationRule {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  validate?: (value: any) => boolean | string;
}

// === ICON TYPES ===
export interface IconProps extends BaseComponentProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Icon size */
  size?: SizeVariant;
  /** Icon color variant */
  variant?: ColorVariant;
  /** Custom icon color */
  color?: string;
  /** Rotation in degrees */
  rotation?: 0 | 90 | 180 | 270;
  /** Icon animation */
  animation?: 'spin' | 'pulse' | 'bounce' | 'none';
}

// === BUTTON TYPES ===
export interface ButtonProps extends 
  BaseComponentProps, 
  InteractiveProps, 
  AnimationProps,
  React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: SizeVariant;
  /** Render as child component */
  asChild?: boolean;
  /** Left icon */
  leftIcon?: LucideIcon;
  /** Right icon */
  rightIcon?: LucideIcon;
  /** Icon only mode */
  iconOnly?: boolean;
  /** Full width button */
  fullWidth?: boolean;
}

// === CARD TYPES ===
export interface CardProps extends 
  BaseComponentProps, 
  AnimationProps,
  React.HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: CardVariant;
  /** Card padding */
  padding?: SpacingVariant;
  /** Status indicator */
  status?: StatusVariant;
  /** Clickable card */
  clickable?: boolean;
  /** Hover effects */
  hoverable?: boolean;
}

// === INPUT TYPES ===
export interface InputProps extends 
  FormFieldProps,
  InteractiveProps,
  React.InputHTMLAttributes<HTMLInputElement> {
  /** Input size */
  size?: SizeVariant;
  /** Left icon */
  leftIcon?: LucideIcon;
  /** Right icon */
  rightIcon?: LucideIcon;
  /** Clear button */
  clearable?: boolean;
  /** Input addon text */
  addon?: {
    left?: string;
    right?: string;
  };
}

// === DROPDOWN TYPES ===
export interface DropdownProps extends BaseComponentProps {
  /** Dropdown trigger element */
  trigger: React.ReactNode;
  /** Dropdown items */
  items: DropdownItem[];
  /** Dropdown placement */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  /** Dropdown size */
  size?: SizeVariant;
  /** Close on select */
  closeOnSelect?: boolean;
  /** Dropdown variant */
  variant?: 'default' | 'ghost' | 'bordered';
}

export interface DropdownItem {
  /** Unique item key */
  key: string;
  /** Item label */
  label: string;
  /** Item icon */
  icon?: LucideIcon;
  /** Item description */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Item type */
  type?: 'item' | 'separator' | 'header';
  /** Click handler */
  onClick?: () => void;
  /** Item shortcut */
  shortcut?: string;
  /** Destructive action */
  destructive?: boolean;
}

// === TABLE TYPES ===
export interface TableColumn<T = any> {
  /** Column key */
  key: keyof T;
  /** Column header */
  header: string;
  /** Column width */
  width?: string | number;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Sortable column */
  sortable?: boolean;
  /** Column renderer */
  render?: (value: any, row: T, index: number) => React.ReactNode;
  /** Column type for default rendering */
  type?: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'avatar' | 'actions';
  /** Column meta information */
  meta?: {
    searchable?: boolean;
    filterable?: boolean;
    resizable?: boolean;
  };
}

export interface TableProps<T = any> extends BaseComponentProps {
  /** Table data */
  data: T[];
  /** Table columns */
  columns: TableColumn<T>[];
  /** Loading state */
  loading?: boolean;
  /** Empty state component */
  emptyState?: React.ReactNode;
  /** Row selection */
  selection?: {
    enabled?: boolean;
    selectedKeys?: Set<string>;
    onSelectionChange?: (keys: Set<string>) => void;
  };
  /** Pagination */
  pagination?: {
    enabled?: boolean;
    pageSize?: number;
    currentPage?: number;
    total?: number;
    onPageChange?: (page: number) => void;
  };
  /** Sorting */
  sorting?: {
    enabled?: boolean;
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
  };
}

// === MODAL TYPES ===
export interface ModalProps extends BaseComponentProps {
  /** Modal open state */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal description */
  description?: string;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Close on outside click */
  closeOnOutsideClick?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Modal footer */
  footer?: React.ReactNode;
}

// === TOAST TYPES ===
export interface ToastProps extends BaseComponentProps {
  /** Toast variant */
  variant?: StatusVariant;
  /** Toast title */
  title?: string;
  /** Toast description */
  description?: string;
  /** Toast duration in ms */
  duration?: number;
  /** Close handler */
  onClose?: () => void;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

// === LAYOUT TYPES ===
export interface ContainerProps extends BaseComponentProps {
  /** Container size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Center content */
  center?: boolean;
  /** Container padding */
  padding?: SpacingVariant;
}

export interface StackProps extends BaseComponentProps, FlexProps {
  /** Stack spacing */
  spacing?: SpacingVariant;
  /** Divider between items */
  divider?: React.ReactNode;
}

// === NAVIGATION TYPES ===
export interface NavigationItem {
  /** Item key */
  key: string;
  /** Item label */
  label: string;
  /** Item icon */
  icon?: LucideIcon;
  /** Navigation path */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Badge content */
  badge?: string | number;
  /** Disabled state */
  disabled?: boolean;
  /** Child items */
  children?: NavigationItem[];
}

export interface NavigationProps extends BaseComponentProps {
  /** Navigation items */
  items: NavigationItem[];
  /** Current active key */
  activeKey?: string;
  /** Navigation orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Navigation variant */
  variant?: 'default' | 'pills' | 'underline' | 'bordered';
}

// === TYPE GUARDS ===
export function isValidSize(value: any): value is SizeVariant {
  return ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(value);
}

export function isValidColor(value: any): value is ColorVariant {
  return [
    'default', 'primary', 'secondary', 'accent', 'destructive', 
    'success', 'warning', 'info', 'muted', 'ghost'
  ].includes(value);
}

export function isValidStatus(value: any): value is StatusVariant {
  return ['default', 'success', 'warning', 'error', 'info', 'pending'].includes(value);
}

// === COMPONENT STATE TYPES ===
export interface ComponentState<T = any> {
  /** Current value */
  value: T;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Validation state */
  validation: {
    isValid: boolean;
    errors: string[];
  };
}

export interface AsyncComponentState<T = any> extends ComponentState<T> {
  /** Last updated timestamp */
  lastUpdated: Date | null;
  /** Refresh function */
  refresh: () => Promise<void>;
}

// === THEME TYPES ===
export interface ThemeConfig {
  /** Color scheme */
  mode: 'light' | 'dark' | 'system';
  /** Primary colors */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  /** Typography scale */
  typography: {
    fontFamily: string;
    fontSize: Record<SizeVariant, string>;
    fontWeight: Record<'light' | 'normal' | 'medium' | 'semibold' | 'bold', number>;
  };
  /** Spacing scale */
  spacing: Record<SpacingVariant, string>;
  /** Border radius scale */
  radius: Record<SizeVariant, string>;
  /** Shadow scale */
  shadows: Record<SizeVariant, string>;
}

// === ACCESSIBILITY TYPES ===
export interface A11yProps {
  /** ARIA label */
  'aria-label'?: string;
  /** ARIA described by */
  'aria-describedby'?: string;
  /** ARIA labelled by */
  'aria-labelledby'?: string;
  /** ARIA expanded */
  'aria-expanded'?: boolean;
  /** ARIA selected */
  'aria-selected'?: boolean;
  /** ARIA disabled */
  'aria-disabled'?: boolean;
  /** Tab index */
  tabIndex?: number;
  /** Role */
  role?: string;
}

export interface KeyboardNavigationProps {
  /** Handle arrow key navigation */
  onArrowNavigation?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  /** Handle enter key */
  onEnter?: () => void;
  /** Handle escape key */
  onEscape?: () => void;
  /** Handle space key */
  onSpace?: () => void;
}