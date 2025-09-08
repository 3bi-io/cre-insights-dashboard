import { lazy } from 'react';

// Lazy load heavy components for better performance
export const AIToolsPage = lazy(() => import('@/pages/AITools'));
export const ApplicationsPage = lazy(() => import('@/pages/Applications'));
export const DashboardPage = lazy(() => import('@/pages/Dashboard'));
export const JobsPage = lazy(() => import('@/pages/Jobs'));
export const PlatformsPage = lazy(() => import('@/pages/Platforms'));
export const OrganizationsPage = lazy(() => import('@/pages/Organizations'));
export const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
export const MetaSpendAnalyticsPage = lazy(() => import('@/pages/MetaSpendAnalytics'));
export const AIAnalyticsPage = lazy(() => import('@/pages/AIAnalytics'));
export const AIImpactDashboardPage = lazy(() => import('@/pages/AIImpactDashboard'));

// Lazy load heavy components within pages
export const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts'));
export const SpendChart = lazy(() => import('@/components/SpendChart'));
export const PlatformBreakdown = lazy(() => import('@/components/PlatformBreakdown'));
export const ChatBot = lazy(() => import('@/components/chat/ChatBot'));
export const MobileChatBot = lazy(() => import('@/components/chat/MobileChatBot'));

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