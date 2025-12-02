import { lazy } from 'react';

// Lazy load commonly used pages for better code splitting
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyApplications = lazy(() => import('@/features/applications').then(m => ({ default: m.ApplicationsPage })));
export const LazyPlatforms = lazy(() => import('@/pages/Platforms'));
export const LazySettings = lazy(() => import('@/pages/Settings'));
export const LazyAuth = lazy(() => import('@/pages/Auth'));
export const LazyApply = lazy(() => import('@/pages/Apply'));
export const LazyDetailedApply = lazy(() => import('@/pages/DetailedApply'));
export const LazyNotFound = lazy(() => import('@/pages/NotFound'));

// Lazy load heavy components within pages
export const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts'));
export const SpendChart = lazy(() => import('@/components/SpendChart'));
export const PlatformBreakdown = lazy(() => import('@/components/PlatformBreakdown'));
export const ChatBot = lazy(() => import('@/components/chat/MobileChatBot'));

// Lazy load dialog components
export const ApplicationDetailsDialog = lazy(() => import('@/components/applications/ApplicationDetailsDialog'));
export const SmsConversationDialog = lazy(() => import('@/components/applications/SmsConversationDialog'));
export const TenstreetUpdateModal = lazy(() => import('@/components/applications/TenstreetUpdateModal'));
export const JobAnalyticsDialog = lazy(() => import('@/components/JobAnalyticsDialog'));
export const JobEditDialog = lazy(() => import('@/components/JobEditDialog'));

// Loading fallback component
export const ComponentLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Page loading fallback component
export const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);