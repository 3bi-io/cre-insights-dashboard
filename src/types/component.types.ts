/**
 * Component Type Definitions
 * Shared types for React components to eliminate 'any' usage
 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

// ============= Base Component Types =============

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean;
  loading?: boolean;
  'aria-label'?: string;
}

// ============= Icon Types =============

export type IconComponent = LucideIcon | React.ComponentType<{ className?: string }>;

export interface IconProps {
  icon: IconComponent;
  className?: string;
  size?: number | string;
  color?: string;
}

// ============= Form Types =============

export interface FormFieldProps extends BaseComponentProps {
  name: string;
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface FilterChangeHandler<T extends Record<string, unknown> = Record<string, unknown>> {
  (filters: T): void;
}

// ============= Table Types =============

export interface TableColumn<T = unknown> {
  key: string;
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => ReactNode;
}

export interface TableRowAction<T = unknown> {
  label: string;
  icon?: IconComponent;
  onClick: (row: T) => void;
  disabled?: boolean | ((row: T) => boolean);
  variant?: 'default' | 'destructive';
}

export interface TableProps<T = unknown> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowActions?: TableRowAction<T>[];
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (rows: T[]) => void;
}

// ============= Dialog Types =============

export interface DialogProps extends BaseComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export interface ConfirmDialogProps extends DialogProps {
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

// ============= Card Types =============

export interface MetricCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  icon?: IconComponent;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
}

export interface ActionCardProps extends BaseComponentProps {
  title: string;
  description?: string;
  icon?: IconComponent;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

// ============= Navigation Types =============

export interface NavItem {
  label: string;
  href?: string;
  icon?: IconComponent;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: string | number;
  children?: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ============= Filter Types =============

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean';
  options?: SelectOption[];
  placeholder?: string;
  defaultValue?: unknown;
}

export interface FilterPanelProps<T extends Record<string, unknown> = Record<string, unknown>> extends BaseComponentProps {
  filters: FilterConfig[];
  values: T;
  onChange: FilterChangeHandler<T>;
  onReset?: () => void;
}

// ============= List Types =============

export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: IconComponent;
  metadata?: Record<string, string | number>;
}

export interface ListProps<T extends ListItem = ListItem> extends BaseComponentProps {
  items: T[];
  loading?: boolean;
  emptyMessage?: string;
  onItemClick?: (item: T) => void;
  renderItem?: (item: T) => ReactNode;
}

// ============= Chart Types =============

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut';
  dataKey: string;
  nameKey?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
}

export interface ChartProps extends BaseComponentProps {
  data: ChartDataPoint[];
  config: ChartConfig;
  height?: number | string;
}

// ============= Skeleton/Loading Types =============

export interface SkeletonProps extends BaseComponentProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | 'none';
}

// ============= Toast/Notification Types =============

export interface ToastData {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============= Pagination Types =============

export interface PaginationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

// ============= Search Types =============

export interface SearchProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  onSearch?: (value: string) => void;
}

// ============= Status/Badge Types =============

export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface StatusBadgeProps extends BaseComponentProps {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
}

// ============= Avatar Types =============

export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// ============= Empty State Types =============

export interface EmptyStateProps extends BaseComponentProps {
  icon?: IconComponent;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============= Error Types =============

export interface ErrorDisplayProps extends BaseComponentProps {
  error: Error | string | null;
  title?: string;
  onRetry?: () => void;
  showDetails?: boolean;
}
