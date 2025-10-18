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
const PrivacyPolicyPage = React.lazy(() => import("@/pages/public/PrivacyPolicyPage"));
const TermsOfServicePage = React.lazy(() => import("@/pages/public/TermsOfServicePage"));
const CookiePolicyPage = React.lazy(() => import("@/pages/public/CookiePolicyPage"));

// Authentication pages
const Auth = React.lazy(() => import("@/pages/Auth"));
const Apply = React.lazy(() => import("@/pages/Apply"));
const DetailedApply = React.lazy(() => import("@/pages/DetailedApply"));
const ThankYou = React.lazy(() => import("@/pages/ThankYou"));

// Main application pages
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const AdminDashboard = React.lazy(() => import("@/pages/AdminDashboard"));
const Jobs = React.lazy(() => import("@/features/jobs").then(m => ({ default: m.JobsPage })));
const Campaigns = React.lazy(() => import("@/features/campaigns").then(m => ({ default: m.CampaignsPage })));
const JobGroups = React.lazy(() => import("@/pages/JobGroups"));
const AdminApplications = React.lazy(() => import("@/features/applications/pages/AdminApplicationsPage"));
const ImportApplications = React.lazy(() => import("@/pages/ImportApplications"));
const AIAnalytics = React.lazy(() => import("@/features/ai-analytics/pages/AIAnalyticsPage"));
const AIImpactDashboard = React.lazy(() => import("@/pages/AIImpactDashboard"));
const AITools = React.lazy(() => import("@/features/ai-tools").then(m => ({ default: m.AIToolsPage })));
const VoiceAgent = React.lazy(() => import("@/pages/VoiceAgent"));
const ElevenLabsAdmin = React.lazy(() => import("@/pages/ElevenLabsAdmin"));
const TenstreetIntegration = React.lazy(() => import("@/pages/TenstreetIntegration"));
const TenstreetExplorer = React.lazy(() => import("@/pages/TenstreetExplorer"));
const AIPlatformSettings = React.lazy(() => import("@/pages/AIPlatformSettings"));
const RoutesPage = React.lazy(() => import("@/features/routes/pages/RoutesPage"));
const Platforms = React.lazy(() => import("@/pages/Platforms"));
const ClientsPage = React.lazy(() => import("@/features/clients").then(m => ({ default: m.ClientsPage })));
const Organizations = React.lazy(() => import("@/pages/Organizations"));
const Settings = React.lazy(() => import("@/pages/Settings"));
const Media = React.lazy(() => import("@/pages/Media"));
const UserManagement = React.lazy(() => import("@/pages/UserManagement"));
const MetaAdSetReportPage = React.lazy(() => import("@/pages/MetaAdSetReportPage"));
const MetaSpendAnalytics = React.lazy(() => import("@/pages/MetaSpendAnalytics"));
const SuperAdminFeeds = React.lazy(() => import("@/pages/SuperAdminFeeds"));
const WebhookManagement = React.lazy(() => import("@/pages/WebhookManagement"));
const HayesDataPopulation = React.lazy(() => import("@/pages/HayesDataPopulation"));
const PrivacyControls = React.lazy(() => import("@/pages/PrivacyControls"));
const Support = React.lazy(() => import("@/pages/Support"));
const VisitorAnalytics = React.lazy(() => import("@/pages/VisitorAnalytics"));
const AccessDenied = React.lazy(() => import("@/pages/AccessDenied"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

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
        <Route path="privacy-policy" element={<RouteWrapper><PrivacyPolicyPage /></RouteWrapper>} />
        <Route path="terms-of-service" element={<RouteWrapper><TermsOfServicePage /></RouteWrapper>} />
        <Route path="cookie-policy" element={<RouteWrapper><CookiePolicyPage /></RouteWrapper>} />
      </Route>

      {/* Application Routes (no auth required) */}
      <Route path="/apply" element={<RouteWrapper><Apply /></RouteWrapper>} />
      <Route path="/apply/detailed" element={<RouteWrapper><DetailedApply /></RouteWrapper>} />
      <Route path="/thank-you" element={<RouteWrapper><ThankYou /></RouteWrapper>} />
      <Route path="/auth" element={<RouteWrapper><Auth /></RouteWrapper>} />

      {/* Dashboard Routes */}
      <Route path="/dashboard" element={<LayoutWrapper />}>
        <Route index element={<RouteWrapper><Dashboard /></RouteWrapper>} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<LayoutWrapper />}>
        <Route index element={<ProtectedRouteWrapper><AdminDashboard /></ProtectedRouteWrapper>} />
        <Route path="jobs" element={<ProtectedRouteWrapper><Jobs /></ProtectedRouteWrapper>} />
        <Route path="campaigns" element={<ProtectedRouteWrapper><Campaigns /></ProtectedRouteWrapper>} />
        <Route path="job-groups" element={<ProtectedRouteWrapper><JobGroups /></ProtectedRouteWrapper>} />
        <Route path="applications" element={<ProtectedRouteWrapper><AdminApplications /></ProtectedRouteWrapper>} />
        <Route path="applications/import" element={<ProtectedRouteWrapper><ImportApplications /></ProtectedRouteWrapper>} />
        <Route path="ai-impact" element={<ProtectedRouteWrapper><AIImpactDashboard /></ProtectedRouteWrapper>} />
        <Route path="ai-analytics" element={<ProtectedRouteWrapper><AIAnalytics /></ProtectedRouteWrapper>} />
        <Route path="ai-tools" element={<ProtectedRouteWrapper><AITools /></ProtectedRouteWrapper>} />
        <Route path="privacy-controls" element={<ProtectedRouteWrapper><PrivacyControls /></ProtectedRouteWrapper>} />
        <Route path="voice-agent" element={<ProtectedRouteWrapper><VoiceAgent /></ProtectedRouteWrapper>} />
        <Route path="elevenlabs-admin" element={<ProtectedRouteWrapper><ElevenLabsAdmin /></ProtectedRouteWrapper>} />
        <Route path="tenstreet" element={<ProtectedRouteWrapper><TenstreetIntegration /></ProtectedRouteWrapper>} />
        <Route path="tenstreet-explorer" element={<ProtectedRouteWrapper><TenstreetExplorer /></ProtectedRouteWrapper>} />
        <Route path="ai-settings" element={<ProtectedRouteWrapper><AIPlatformSettings /></ProtectedRouteWrapper>} />
        <Route path="routes" element={<ProtectedRouteWrapper><RoutesPage /></ProtectedRouteWrapper>} />
        <Route path="platforms" element={<ProtectedRouteWrapper><Platforms /></ProtectedRouteWrapper>} />
        <Route path="publishers" element={<ProtectedRouteWrapper><Platforms /></ProtectedRouteWrapper>} />
        <Route path="clients" element={<ProtectedRouteWrapper><ClientsPage /></ProtectedRouteWrapper>} />
        <Route path="organizations" element={<ProtectedRouteWrapper><Organizations /></ProtectedRouteWrapper>} />
        <Route path="settings" element={<ProtectedRouteWrapper><Settings /></ProtectedRouteWrapper>} />
        <Route path="media" element={<ProtectedRouteWrapper><Media /></ProtectedRouteWrapper>} />
        <Route path="user-management" element={<ProtectedRouteWrapper><UserManagement /></ProtectedRouteWrapper>} />
        <Route path="super-admin-feeds" element={<ProtectedRouteWrapper><SuperAdminFeeds /></ProtectedRouteWrapper>} />
        <Route path="webhook-management" element={<ProtectedRouteWrapper><WebhookManagement /></ProtectedRouteWrapper>} />
        <Route path="hayes-data" element={<ProtectedRouteWrapper><HayesDataPopulation /></ProtectedRouteWrapper>} />
        <Route path="meta-adset-report" element={<ProtectedRouteWrapper><MetaAdSetReportPage /></ProtectedRouteWrapper>} />
        <Route path="meta-spend-analytics" element={<ProtectedRouteWrapper><MetaSpendAnalytics /></ProtectedRouteWrapper>} />
        <Route path="visitor-analytics" element={<ProtectedRouteWrapper><VisitorAnalytics /></ProtectedRouteWrapper>} />
        <Route path="support" element={<ProtectedRouteWrapper><Support /></ProtectedRouteWrapper>} />
      </Route>

      {/* Access Denied Route */}
      <Route path="/access-denied" element={<RouteWrapper><AccessDenied /></RouteWrapper>} />

      {/* 404 Route */}
      <Route path="*" element={<RouteWrapper><NotFound /></RouteWrapper>} />
    </Routes>
  );
};

export default AppRoutes;