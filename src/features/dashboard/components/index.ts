// Main dashboard layouts
export { DashboardLayout } from './DashboardLayout';
export { SuperAdminDashboard } from './SuperAdminDashboard';
export { RegularUserDashboard } from './RegularUserDashboard';

// Shared components
export * from './shared';

// Legacy dashboard components (still used in other parts of the app)
export { default as DashboardTabs } from '@/components/dashboard/DashboardTabs';
export { default as DashboardContent } from '@/components/dashboard/DashboardContent';
export { DashboardMetrics } from './DashboardMetrics';
export { default as DashboardCharts } from '@/components/dashboard/DashboardCharts';
export { default as DashboardLoading } from '@/components/dashboard/DashboardLoading';
export { default as NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
export { default as SettingsPanel } from '@/components/dashboard/SettingsPanel';
export { default as FilterDialog } from '@/components/dashboard/FilterDialog';
export { default as DateRangePicker } from '@/components/dashboard/DateRangePicker';