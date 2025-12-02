import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PublicLayout from "@/components/public/PublicLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";

// Public pages
const LandingPage = React.lazy(() => import("@/pages/public/LandingPage"));
const JobsPage = React.lazy(() => import("@/pages/public/JobsPage"));
const FeaturesPage = React.lazy(() => import("@/pages/public/FeaturesPage"));
const PricingPage = React.lazy(() => import("@/pages/public/PricingPage"));
const ContactPage = React.lazy(() => import("@/pages/public/ContactPage"));
const ResourcesPage = React.lazy(() => import("@/pages/public/ResourcesPage"));
const PrivacyPolicyPage = React.lazy(() => import("@/pages/public/PrivacyPolicyPage"));
const TermsOfServicePage = React.lazy(() => import("@/pages/public/TermsOfServicePage"));
const CookiePolicyPage = React.lazy(() => import("@/pages/public/CookiePolicyPage"));
const SitemapPage = React.lazy(() => import("@/pages/public/SitemapPage"));

// Authentication pages
const Auth = React.lazy(() => import("@/pages/Auth"));
const Onboarding = React.lazy(() => import("@/pages/Onboarding"));
const Apply = React.lazy(() => import("@/pages/Apply"));
const DetailedApply = React.lazy(() => import("@/pages/DetailedApply"));
const ThankYou = React.lazy(() => import("@/pages/ThankYou"));

// Main application pages
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));

const CandidateDashboard = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.CandidateDashboard })));
const CandidateLayout = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.CandidateLayout })));
const MyApplicationsPage = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.MyApplicationsPage })));
const JobSearchPage = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.JobSearchPage })));
const SavedJobsPage = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.SavedJobsPage })));
const MessagesPage = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.MessagesPage })));
const ProfilePage = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.ProfilePage })));
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

// Consolidated pages
const ATSCommandCenterPage = React.lazy(() => import("@/features/ats").then(m => ({ default: m.ATSCommandCenterPage })));
const MetaAnalyticsPage = React.lazy(() => import("@/features/analytics").then(m => ({ default: m.MetaAnalyticsPage })));
const AIConfigurationPage = React.lazy(() => import("@/features/settings").then(m => ({ default: m.AIConfigurationPage })));

// Remaining pages
const TenstreetIntegration = React.lazy(() => import("@/pages/TenstreetIntegration"));
const RoutesPage = React.lazy(() => import("@/features/routes/pages/RoutesPage"));
const Platforms = React.lazy(() => import("@/pages/Platforms"));
const FeedsManagement = React.lazy(() => import("@/pages/FeedsManagement"));
const ClientsPage = React.lazy(() => import("@/features/clients").then(m => ({ default: m.ClientsPage })));
const Organizations = React.lazy(() => import("@/pages/Organizations"));
const Settings = React.lazy(() => import("@/pages/Settings"));
const Media = React.lazy(() => import("@/pages/Media"));
const UserManagement = React.lazy(() => import("@/pages/UserManagement"));
const SuperAdminFeeds = React.lazy(() => import("@/pages/SuperAdminFeeds"));
const WebhookManagement = React.lazy(() => import("@/pages/WebhookManagement"));
const EdgeFunctionsTest = React.lazy(() => import("@/pages/EdgeFunctionsTest"));
const HayesDataPopulation = React.lazy(() => import("@/pages/HayesDataPopulation"));
const Support = React.lazy(() => import("@/pages/Support"));
const VisitorAnalytics = React.lazy(() => import("@/pages/VisitorAnalytics"));
const UniversalFeeds = React.lazy(() => import("@/pages/UniversalFeeds"));
const AccessDenied = React.lazy(() => import("@/pages/AccessDenied"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));
const Install = React.lazy(() => import("@/pages/Install"));
const Offline = React.lazy(() => import("@/pages/Offline"));

// Settings pages
const ProfileSettings = React.lazy(() => import("@/pages/settings/ProfileSettings"));
const OrganizationSettings = React.lazy(() => import("@/pages/settings/OrganizationSettings"));
const SecuritySettings = React.lazy(() => import("@/pages/settings/SecuritySettings"));
const BillingSettings = React.lazy(() => import("@/pages/settings/BillingSettings"));

// Candidate settings
const CandidateAccountSettings = React.lazy(() => import("@/features/candidate/pages/AccountSettings"));
const CandidateNotifications = React.lazy(() => import("@/features/candidate/pages/NotificationsPage"));

// Loading fallback component
const PageSkeleton = React.memo(() => (
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
));

PageSkeleton.displayName = "PageSkeleton";

// Route wrapper with Suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageSkeleton />}>
    {children}
  </Suspense>
);

// Protected route wrapper
const ProtectedRouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <RouteWrapper>{children}</RouteWrapper>
  </ProtectedRoute>
);

// Layout wrapper for admin routes
const LayoutWrapper = React.memo(() => (
  <ProtectedRoute>
    <Layout />
  </ProtectedRoute>
));

LayoutWrapper.displayName = "LayoutWrapper";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<RouteWrapper><LandingPage /></RouteWrapper>} />
        <Route path="jobs" element={<RouteWrapper><JobsPage /></RouteWrapper>} />
        <Route path="features" element={<RouteWrapper><FeaturesPage /></RouteWrapper>} />
        <Route path="pricing" element={<RouteWrapper><PricingPage /></RouteWrapper>} />
        <Route path="contact" element={<RouteWrapper><ContactPage /></RouteWrapper>} />
        <Route path="resources" element={<RouteWrapper><ResourcesPage /></RouteWrapper>} />
        <Route path="privacy-policy" element={<RouteWrapper><PrivacyPolicyPage /></RouteWrapper>} />
        <Route path="terms-of-service" element={<RouteWrapper><TermsOfServicePage /></RouteWrapper>} />
        <Route path="cookie-policy" element={<RouteWrapper><CookiePolicyPage /></RouteWrapper>} />
        <Route path="sitemap" element={<RouteWrapper><SitemapPage /></RouteWrapper>} />
      </Route>

      {/* Application Routes (no auth required) */}
      <Route path="/apply" element={<RouteWrapper><Apply /></RouteWrapper>} />
      <Route path="/apply/detailed" element={<RouteWrapper><DetailedApply /></RouteWrapper>} />
      <Route path="/thank-you" element={<RouteWrapper><ThankYou /></RouteWrapper>} />
      <Route path="/auth" element={<RouteWrapper><Auth /></RouteWrapper>} />
      <Route path="/onboarding" element={<ProtectedRouteWrapper><Onboarding /></ProtectedRouteWrapper>} />

      {/* Dashboard Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute requireSubscription={false}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<RouteWrapper><Dashboard /></RouteWrapper>} />
      </Route>

      {/* Candidate Routes */}
      <Route path="/my-jobs" element={
        <ProtectedRoute requireSubscription={false}>
          <RouteWrapper><CandidateLayout /></RouteWrapper>
        </ProtectedRoute>
      }>
        <Route index element={<RouteWrapper><CandidateDashboard /></RouteWrapper>} />
        <Route path="applications" element={<RouteWrapper><MyApplicationsPage /></RouteWrapper>} />
        <Route path="search" element={<RouteWrapper><JobSearchPage /></RouteWrapper>} />
        <Route path="saved" element={<RouteWrapper><SavedJobsPage /></RouteWrapper>} />
        <Route path="messages" element={<RouteWrapper><MessagesPage /></RouteWrapper>} />
        <Route path="profile" element={<RouteWrapper><ProfilePage /></RouteWrapper>} />
        <Route path="settings" element={<RouteWrapper><CandidateAccountSettings /></RouteWrapper>} />
        <Route path="notifications" element={<RouteWrapper><CandidateNotifications /></RouteWrapper>} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<LayoutWrapper />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="jobs" element={<ProtectedRouteWrapper><Jobs /></ProtectedRouteWrapper>} />
        <Route path="campaigns" element={<ProtectedRouteWrapper><Campaigns /></ProtectedRouteWrapper>} />
        <Route path="job-groups" element={<ProtectedRouteWrapper><JobGroups /></ProtectedRouteWrapper>} />
        <Route path="applications" element={<ProtectedRouteWrapper><Applications /></ProtectedRouteWrapper>} />
        <Route path="applications/import" element={<ProtectedRouteWrapper><ImportApplications /></ProtectedRouteWrapper>} />
        <Route path="ai-impact" element={<ProtectedRouteWrapper><AIImpactDashboard /></ProtectedRouteWrapper>} />
        <Route path="ai-analytics" element={<ProtectedRouteWrapper><AIAnalytics /></ProtectedRouteWrapper>} />
        <Route path="ai-tools" element={<ProtectedRouteWrapper><AITools /></ProtectedRouteWrapper>} />
        <Route path="voice-agent" element={<ProtectedRouteWrapper><VoiceAgent /></ProtectedRouteWrapper>} />
        <Route path="elevenlabs-admin" element={<ProtectedRouteWrapper><ElevenLabsAdmin /></ProtectedRouteWrapper>} />
        
        {/* Consolidated Routes */}
        <Route path="ats-command" element={<ProtectedRouteWrapper><ATSCommandCenterPage /></ProtectedRouteWrapper>} />
        <Route path="meta-analytics" element={<ProtectedRouteWrapper><MetaAnalyticsPage /></ProtectedRouteWrapper>} />
        <Route path="ai-configuration" element={<ProtectedRouteWrapper><AIConfigurationPage /></ProtectedRouteWrapper>} />
        
        {/* Legacy routes - redirect to consolidated pages */}
        <Route path="tenstreet" element={<Navigate to="/admin/ats-command" replace />} />
        <Route path="tenstreet-explorer" element={<Navigate to="/admin/ats-command" replace />} />
        <Route path="tenstreet/xchange" element={<Navigate to="/admin/ats-command" replace />} />
        <Route path="tenstreet/focus" element={<Navigate to="/admin/ats-command" replace />} />
        <Route path="tenstreet/bulk" element={<Navigate to="/admin/ats-command" replace />} />
        <Route path="tenstreet-credentials" element={<Navigate to="/admin/ats-command" replace />} />
        <Route path="meta-adset-report" element={<Navigate to="/admin/meta-analytics" replace />} />
        <Route path="meta-spend-analytics" element={<Navigate to="/admin/meta-analytics" replace />} />
        <Route path="ai-settings" element={<Navigate to="/admin/ai-configuration" replace />} />
        <Route path="privacy-controls" element={<Navigate to="/admin/ai-configuration" replace />} />
        
        {/* Remaining routes */}
        <Route path="tenstreet-integration" element={<ProtectedRouteWrapper><TenstreetIntegration /></ProtectedRouteWrapper>} />
        <Route path="routes" element={<ProtectedRouteWrapper><RoutesPage /></ProtectedRouteWrapper>} />
        <Route path="platforms" element={<ProtectedRouteWrapper><Platforms /></ProtectedRouteWrapper>} />
        <Route path="publishers" element={<ProtectedRouteWrapper><Platforms /></ProtectedRouteWrapper>} />
        <Route path="feeds" element={<ProtectedRouteWrapper><FeedsManagement /></ProtectedRouteWrapper>} />
        <Route path="universal-feeds" element={<ProtectedRouteWrapper><UniversalFeeds /></ProtectedRouteWrapper>} />
        <Route path="clients" element={<ProtectedRouteWrapper><ClientsPage /></ProtectedRouteWrapper>} />
        <Route path="organizations" element={<ProtectedRouteWrapper><Organizations /></ProtectedRouteWrapper>} />
        <Route path="settings" element={<ProtectedRouteWrapper><Settings /></ProtectedRouteWrapper>} />
        <Route path="media" element={<ProtectedRouteWrapper><Media /></ProtectedRouteWrapper>} />
        <Route path="user-management" element={<ProtectedRouteWrapper><UserManagement /></ProtectedRouteWrapper>} />
        <Route path="super-admin-feeds" element={<ProtectedRouteWrapper><SuperAdminFeeds /></ProtectedRouteWrapper>} />
        <Route path="webhook-management" element={<ProtectedRouteWrapper><WebhookManagement /></ProtectedRouteWrapper>} />
        <Route path="hayes-data" element={<ProtectedRouteWrapper><HayesDataPopulation /></ProtectedRouteWrapper>} />
        <Route path="visitor-analytics" element={<ProtectedRouteWrapper><VisitorAnalytics /></ProtectedRouteWrapper>} />
        <Route path="edge-functions-test" element={<ProtectedRouteWrapper><EdgeFunctionsTest /></ProtectedRouteWrapper>} />
        <Route path="support" element={<ProtectedRouteWrapper><Support /></ProtectedRouteWrapper>} />
        <Route path="grok" element={<ProtectedRouteWrapper><GrokChatPage /></ProtectedRouteWrapper>} />
        <Route path="settings/profile" element={<ProtectedRouteWrapper><ProfileSettings /></ProtectedRouteWrapper>} />
        <Route path="settings/organization" element={<ProtectedRouteWrapper><OrganizationSettings /></ProtectedRouteWrapper>} />
        <Route path="settings/security" element={<ProtectedRouteWrapper><SecuritySettings /></ProtectedRouteWrapper>} />
        <Route path="settings/billing" element={<ProtectedRouteWrapper><BillingSettings /></ProtectedRouteWrapper>} />
      </Route>

      {/* Access Denied Route */}
      <Route path="/access-denied" element={<RouteWrapper><AccessDenied /></RouteWrapper>} />

      {/* PWA Routes */}
      <Route path="/install" element={<RouteWrapper><Install /></RouteWrapper>} />
      <Route path="/offline" element={<RouteWrapper><Offline /></RouteWrapper>} />

      {/* 404 Route */}
      <Route path="*" element={<RouteWrapper><NotFound /></RouteWrapper>} />
    </Routes>
  );
};

export default AppRoutes;
