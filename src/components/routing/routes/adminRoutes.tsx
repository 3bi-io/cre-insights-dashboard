import React from 'react';
import { Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Skeleton } from '@/components/ui/skeleton';

// Admin pages
const AdminDashboard = React.lazy(() => import("@/pages/AdminDashboard"));
const GrokChatPage = React.lazy(() => import("@/features/ai-chat").then(m => ({ default: m.GrokChatPage })));
const Jobs = React.lazy(() => import("@/features/jobs").then(m => ({ default: m.JobsPage })));
const Campaigns = React.lazy(() => import("@/features/campaigns").then(m => ({ default: m.CampaignsPage })));
const JobGroups = React.lazy(() => import("@/pages/JobGroups"));
const Applications = React.lazy(() => import("@/features/applications").then(m => ({ default: m.ApplicationsPage })));
const ImportApplications = React.lazy(() => import("@/pages/ImportApplications"));
const AIAnalytics = React.lazy(() => import("@/features/ai-analytics/pages/AIAnalyticsPage"));
const AIImpactDashboard = React.lazy(() => import("@/pages/AIImpactDashboard"));
const AITools = React.lazy(() => import("@/features/ai-tools").then(m => ({ default: m.AIToolsPage })));
const VoiceAgent = React.lazy(() => import("@/pages/VoiceAgent"));
const ElevenLabsAdmin = React.lazy(() => import("@/pages/ElevenLabsAdmin"));
const TenstreetDashboard = React.lazy(() => import("@/pages/TenstreetDashboard"));
const TenstreetIntegration = React.lazy(() => import("@/pages/TenstreetIntegration"));
const TenstreetExplorer = React.lazy(() => import("@/pages/TenstreetExplorer"));
const TenstreetXchange = React.lazy(() => import("@/pages/TenstreetXchange"));
const TenstreetFocus = React.lazy(() => import("@/pages/TenstreetFocus"));
const TenstreetBulk = React.lazy(() => import("@/pages/TenstreetBulk"));
const TenstreetCredentialsManagement = React.lazy(() => import("@/pages/TenstreetCredentialsManagement"));
const AIPlatformSettings = React.lazy(() => import("@/pages/AIPlatformSettings"));
const RoutesPage = React.lazy(() => import("@/features/routes/pages/RoutesPage"));
const Platforms = React.lazy(() => import("@/pages/Platforms"));
const FeedsManagement = React.lazy(() => import("@/pages/FeedsManagement"));
const ClientsPage = React.lazy(() => import("@/features/clients").then(m => ({ default: m.ClientsPage })));
const Organizations = React.lazy(() => import("@/pages/Organizations"));
const Settings = React.lazy(() => import("@/pages/Settings"));
const Media = React.lazy(() => import("@/pages/Media"));
const UserManagement = React.lazy(() => import("@/pages/UserManagement"));
const MetaAdSetReportPage = React.lazy(() => import("@/pages/MetaAdSetReportPage"));
const MetaSpendAnalytics = React.lazy(() => import("@/pages/MetaSpendAnalytics"));
const SuperAdminFeeds = React.lazy(() => import("@/pages/SuperAdminFeeds"));
const WebhookManagement = React.lazy(() => import("@/pages/WebhookManagement"));
const EdgeFunctionsTest = React.lazy(() => import("@/pages/EdgeFunctionsTest"));
const HayesDataPopulation = React.lazy(() => import("@/pages/HayesDataPopulation"));
const PrivacyControls = React.lazy(() => import("@/pages/PrivacyControls"));
const Support = React.lazy(() => import("@/pages/Support"));
const VisitorAnalytics = React.lazy(() => import("@/pages/VisitorAnalytics"));
const UniversalFeeds = React.lazy(() => import("@/pages/UniversalFeeds"));

// Loading fallback
const PageSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  </div>
);

const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <React.Suspense fallback={<PageSkeleton />}>
    {children}
  </React.Suspense>
);

const ProtectedRouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <RouteWrapper>{children}</RouteWrapper>
  </ProtectedRoute>
);

const LayoutWrapper = React.memo(() => (
  <ProtectedRoute>
    <Layout />
  </ProtectedRoute>
));

LayoutWrapper.displayName = "LayoutWrapper";

export const adminRoutes = (
  <>
    {/* Admin Routes - /admin/* */}
    <Route path="/admin" element={<LayoutWrapper />}>
      <Route index element={<ProtectedRouteWrapper><AdminDashboard /></ProtectedRouteWrapper>} />
      
      {/* Core Management */}
      <Route path="jobs" element={<ProtectedRouteWrapper><Jobs /></ProtectedRouteWrapper>} />
      <Route path="campaigns" element={<ProtectedRouteWrapper><Campaigns /></ProtectedRouteWrapper>} />
      <Route path="job-groups" element={<ProtectedRouteWrapper><JobGroups /></ProtectedRouteWrapper>} />
      <Route path="applications" element={<ProtectedRouteWrapper><Applications /></ProtectedRouteWrapper>} />
      <Route path="applications/import" element={<ProtectedRouteWrapper><ImportApplications /></ProtectedRouteWrapper>} />
      <Route path="clients" element={<ProtectedRouteWrapper><ClientsPage /></ProtectedRouteWrapper>} />
      
      {/* AI & Analytics */}
      <Route path="ai-impact" element={<ProtectedRouteWrapper><AIImpactDashboard /></ProtectedRouteWrapper>} />
      <Route path="ai-analytics" element={<ProtectedRouteWrapper><AIAnalytics /></ProtectedRouteWrapper>} />
      <Route path="ai-tools" element={<ProtectedRouteWrapper><AITools /></ProtectedRouteWrapper>} />
      <Route path="ai-settings" element={<ProtectedRouteWrapper><AIPlatformSettings /></ProtectedRouteWrapper>} />
      <Route path="grok" element={<ProtectedRouteWrapper><GrokChatPage /></ProtectedRouteWrapper>} />
      
      {/* Voice & ElevenLabs */}
      <Route path="voice-agent" element={<ProtectedRouteWrapper><VoiceAgent /></ProtectedRouteWrapper>} />
      <Route path="elevenlabs-admin" element={<ProtectedRouteWrapper><ElevenLabsAdmin /></ProtectedRouteWrapper>} />
      
      {/* Tenstreet Integration */}
      <Route path="tenstreet-integration" element={<ProtectedRouteWrapper><TenstreetIntegration /></ProtectedRouteWrapper>} />
      <Route path="tenstreet" element={<ProtectedRouteWrapper><TenstreetDashboard /></ProtectedRouteWrapper>} />
      <Route path="tenstreet-explorer" element={<ProtectedRouteWrapper><TenstreetExplorer /></ProtectedRouteWrapper>} />
      <Route path="tenstreet/xchange" element={<ProtectedRouteWrapper><TenstreetXchange /></ProtectedRouteWrapper>} />
      <Route path="tenstreet/focus" element={<ProtectedRouteWrapper><TenstreetFocus /></ProtectedRouteWrapper>} />
      <Route path="tenstreet/bulk" element={<ProtectedRouteWrapper><TenstreetBulk /></ProtectedRouteWrapper>} />
      <Route path="tenstreet-credentials" element={<ProtectedRouteWrapper><TenstreetCredentialsManagement /></ProtectedRouteWrapper>} />
      
      {/* Platforms & Feeds */}
      <Route path="routes" element={<ProtectedRouteWrapper><RoutesPage /></ProtectedRouteWrapper>} />
      <Route path="platforms" element={<ProtectedRouteWrapper><Platforms /></ProtectedRouteWrapper>} />
      <Route path="publishers" element={<ProtectedRouteWrapper><Platforms /></ProtectedRouteWrapper>} />
      <Route path="feeds" element={<ProtectedRouteWrapper><FeedsManagement /></ProtectedRouteWrapper>} />
      <Route path="universal-feeds" element={<ProtectedRouteWrapper><UniversalFeeds /></ProtectedRouteWrapper>} />
      <Route path="super-admin-feeds" element={<ProtectedRouteWrapper><SuperAdminFeeds /></ProtectedRouteWrapper>} />
      
      {/* Settings & Configuration */}
      <Route path="settings" element={<ProtectedRouteWrapper><Settings /></ProtectedRouteWrapper>} />
      <Route path="media" element={<ProtectedRouteWrapper><Media /></ProtectedRouteWrapper>} />
      <Route path="privacy-controls" element={<ProtectedRouteWrapper><PrivacyControls /></ProtectedRouteWrapper>} />
      <Route path="webhook-management" element={<ProtectedRouteWrapper><WebhookManagement /></ProtectedRouteWrapper>} />
      
      {/* Super Admin Only */}
      <Route path="organizations" element={<ProtectedRouteWrapper><Organizations /></ProtectedRouteWrapper>} />
      <Route path="user-management" element={<ProtectedRouteWrapper><UserManagement /></ProtectedRouteWrapper>} />
      
      {/* Analytics & Reporting */}
      <Route path="meta-adset-report" element={<ProtectedRouteWrapper><MetaAdSetReportPage /></ProtectedRouteWrapper>} />
      <Route path="meta-spend-analytics" element={<ProtectedRouteWrapper><MetaSpendAnalytics /></ProtectedRouteWrapper>} />
      <Route path="visitor-analytics" element={<ProtectedRouteWrapper><VisitorAnalytics /></ProtectedRouteWrapper>} />
      
      {/* Development & Support */}
      <Route path="hayes-data" element={<ProtectedRouteWrapper><HayesDataPopulation /></ProtectedRouteWrapper>} />
      <Route path="edge-functions-test" element={<ProtectedRouteWrapper><EdgeFunctionsTest /></ProtectedRouteWrapper>} />
      <Route path="support" element={<ProtectedRouteWrapper><Support /></ProtectedRouteWrapper>} />
    </Route>
  </>
);
