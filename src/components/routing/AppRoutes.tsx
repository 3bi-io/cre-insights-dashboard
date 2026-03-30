import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PublicLayout from "@/components/public/PublicLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";
const JobsPage = React.lazy(() => import("@/pages/public/JobsPage"));
const PublicClientsPage = React.lazy(() => import("@/pages/public/ClientsPage"));
const FeaturesPage = React.lazy(() => import("@/pages/public/FeaturesPage"));
const ContactPage = React.lazy(() => import("@/pages/public/ContactPage"));
const ResourcesPage = React.lazy(() => import("@/pages/public/ResourcesPage"));

// Public pages
const LandingPage = React.lazy(() => import("@/pages/public/LandingPage"));
const JobDetailsPage = React.lazy(() => import("@/pages/public/JobDetailsPage"));
// PricingPage removed - all features available to all users
const PrivacyPolicyPage = React.lazy(() => import("@/pages/public/PrivacyPolicyPage"));
const TermsOfServicePage = React.lazy(() => import("@/pages/public/TermsOfServicePage"));
const CookiePolicyPage = React.lazy(() => import("@/pages/public/CookiePolicyPage"));
const SitemapPage = React.lazy(() => import("@/pages/public/SitemapPage"));
const DemoPage = React.lazy(() => import("@/pages/public/DemoPage"));
const JobMapPage = React.lazy(() => import("@/pages/public/JobMapPage"));
const BlogPage = React.lazy(() => import("@/pages/public/BlogPage"));
const BlogPostPage = React.lazy(() => import("@/pages/public/BlogPostPage"));
const BlogAuthorPage = React.lazy(() => import("@/pages/public/BlogAuthorPage"));
const ApiDocsPage = React.lazy(() => import("@/pages/ApiDocsPage"));
const PartnerSetupGuidePage = React.lazy(() => import("@/pages/PartnerSetupGuidePage"));
const GuidePage = React.lazy(() => import("@/pages/public/GuidePage"));
const AiChatPage = React.lazy(() => import("@/pages/public/AiChatPage"));

// Authentication pages
const Auth = React.lazy(() => import("@/pages/Auth"));
const Onboarding = React.lazy(() => import("@/pages/Onboarding"));
const ChooseAccountType = React.lazy(() => import("@/pages/ChooseAccountType"));
const Apply = React.lazy(() => import("@/pages/Apply"));
const DetailedApply = React.lazy(() => import("@/pages/DetailedApply"));
const ThankYou = React.lazy(() => import("@/pages/ThankYou"));
const EmbedApply = React.lazy(() => import("@/pages/EmbedApply"));
const XApply = React.lazy(() => import("@/pages/XApply"));
const LinkedInApply = React.lazy(() => import("@/pages/LinkedInApply"));
const SocialApply = React.lazy(() => import("@/pages/SocialApply"));
const SocialEmbedApply = React.lazy(() => import("@/pages/SocialEmbedApply"));
const ShortLinkRedirect = React.lazy(() => import("@/pages/ShortLinkRedirect"));
const SharedVoicePage = React.lazy(() => import("@/pages/public/SharedVoicePage"));
const AudioShowcasePage = React.lazy(() => import("@/pages/public/AudioShowcasePage"));
const CalendarCallback = React.lazy(() => import("@/pages/CalendarCallback"));
const CalendarInviteConnect = React.lazy(() => import("@/pages/CalendarInviteConnect"));
const RecruiterCalendarPage = React.lazy(() => import("@/pages/RecruiterCalendarPage"));

// Main application pages
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));

const CandidateDashboard = React.lazy(() => import("@/features/candidate/pages/CandidateDashboard"));
const CandidateLayout = React.lazy(() => import("@/features/candidate/components/CandidateLayout"));
const MyApplicationsPage = React.lazy(() => import("@/features/candidate/pages/MyApplicationsPage"));
const JobSearchPage = React.lazy(() => import("@/features/candidate/pages/JobSearchPage"));
const SavedJobsPage = React.lazy(() => import("@/features/candidate/pages/SavedJobsPage"));

const ProfilePage = React.lazy(() => import("@/features/candidate/pages/ProfilePage"));
const JobDetailPage = React.lazy(() => import("@/features/candidate/pages/JobDetailPage"));
const GrokChatPage = React.lazy(() => import("@/features/ai-chat/pages/GrokChatPage").then(m => ({ default: m.GrokChatPage })));
const Jobs = React.lazy(() => import("@/features/jobs/pages/JobsPage"));
const Campaigns = React.lazy(() => import("@/features/campaigns/pages/CampaignsPage"));
const JobGroups = React.lazy(() => import("@/pages/JobGroups"));
const Applications = React.lazy(() => import("@/features/applications/pages/ApplicationsPage"));
const ImportApplications = React.lazy(() => import("@/pages/ImportApplications"));
const AIAnalytics = React.lazy(() => import("@/features/ai-analytics/pages/AIAnalyticsPage"));
const AIImpactDashboard = React.lazy(() => import("@/pages/AIImpactDashboard"));
const AITools = React.lazy(() => import("@/features/ai-tools/pages/AIToolsPage").then(m => ({ default: m.AIToolsPage })));
const VoiceAgent = React.lazy(() => import("@/pages/VoiceAgent"));
const VoiceAgentDemo = React.lazy(() => import("@/pages/VoiceAgentDemo"));
const ElevenLabsAdmin = React.lazy(() => import("@/pages/ElevenLabsAdmin"));

// Consolidated pages
const ATSCommandCenterPage = React.lazy(() => import("@/features/ats/pages/ATSCommandCenterPage"));
const MetaAnalyticsPage = React.lazy(() => import("@/features/analytics/pages/MetaAnalyticsPage"));
const AIConfigurationPage = React.lazy(() => import("@/features/settings/pages/AIConfigurationPage"));
const SocialEngagementDashboard = React.lazy(() => import("@/features/social-engagement/pages/SocialEngagementDashboard").then(m => ({ default: m.SocialEngagementDashboard })));
const SuperAdminSocialBeacons = React.lazy(() => import("@/features/social-engagement/pages/SuperAdminSocialBeacons").then(m => ({ default: m.SuperAdminSocialBeacons })));

// Remaining pages
const TenstreetIntegration = React.lazy(() => import("@/pages/TenstreetIntegration"));
const RoutesPage = React.lazy(() => import("@/features/routes/pages/RoutesPage"));
const Platforms = React.lazy(() => import("@/pages/Platforms"));
const AdNetworks = React.lazy(() => import("@/pages/AdNetworks"));
const JobBoards = React.lazy(() => import("@/pages/JobBoards"));
const FeedsManagement = React.lazy(() => import("@/pages/FeedsManagement"));
const SyndicationDashboard = React.lazy(() => import("@/pages/SyndicationDashboard"));
const ClientsPage = React.lazy(() => import("@/features/clients/pages/ClientsPage"));
const ClientDashboardsPage = React.lazy(() => import("@/pages/ClientDashboardsPage"));
const Organizations = React.lazy(() => import("@/pages/Organizations"));
const Settings = React.lazy(() => import("@/pages/Settings"));
const Media = React.lazy(() => import("@/pages/Media"));
const BrandAssets = React.lazy(() => import("@/pages/BrandAssets"));
const UserManagement = React.lazy(() => import("@/pages/UserManagement"));
const SuperAdminFeeds = React.lazy(() => import("@/pages/SuperAdminFeeds"));
const WebhookManagement = React.lazy(() => import("@/pages/WebhookManagement"));
const ActiveJobIds = React.lazy(() => import("@/pages/ActiveJobIds"));
const TenstreetSyncDashboard = React.lazy(() => import("@/pages/TenstreetSyncDashboard"));
const DriverReachIntegration = React.lazy(() => import("@/pages/DriverReachIntegration"));
const DriverReachSyncDashboard = React.lazy(() => import("@/pages/DriverReachSyncDashboard"));
const EdgeFunctionsTest = React.lazy(() => import("@/pages/EdgeFunctionsTest"));
const WebScraperPage = React.lazy(() => import("@/pages/admin/WebScraperPage"));
const DataPopulation = React.lazy(() => import("@/pages/DataPopulation"));
const Support = React.lazy(() => import("@/pages/Support"));
const VisitorAnalytics = React.lazy(() => import("@/pages/VisitorAnalytics"));
const UniversalFeeds = React.lazy(() => import("@/pages/UniversalFeeds"));
const AccessDenied = React.lazy(() => import("@/pages/AccessDenied"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));
const Offline = React.lazy(() => import("@/pages/Offline"));

// Settings pages
const ProfileSettings = React.lazy(() => import("@/pages/settings/ProfileSettings"));
const OrganizationSettings = React.lazy(() => import("@/pages/settings/OrganizationSettings"));
const SecuritySettings = React.lazy(() => import("@/pages/settings/SecuritySettings"));
// BillingSettings removed - no subscription tiers

// Candidate settings
const CandidateAccountSettings = React.lazy(() => import("@/features/candidate/pages/AccountSettings"));
const CandidateNotifications = React.lazy(() => import("@/features/candidate/pages/NotificationsPage"));

// Talent Pool pages
const TalentPoolsPage = React.lazy(() => import("@/features/talent/pages/TalentPoolsPage"));

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

// Route wrapper for admin child routes (auth already enforced by LayoutWrapper parent)
const AdminRouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteWrapper>{children}</RouteWrapper>
);

// Protected route wrapper for standalone routes outside admin layout
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
        <Route path="jobs/:id" element={<RouteWrapper><JobDetailsPage /></RouteWrapper>} />
        <Route path="clients" element={<RouteWrapper><PublicClientsPage /></RouteWrapper>} />
        <Route path="companies" element={<Navigate to="/clients" replace />} />
        <Route path="employers" element={<RouteWrapper><PublicClientsPage /></RouteWrapper>} />
        <Route path="features" element={<RouteWrapper><FeaturesPage /></RouteWrapper>} />
        
        <Route path="contact" element={<RouteWrapper><ContactPage /></RouteWrapper>} />
        <Route path="resources" element={<RouteWrapper><ResourcesPage /></RouteWrapper>} />
        <Route path="privacy-policy" element={<RouteWrapper><PrivacyPolicyPage /></RouteWrapper>} />
        <Route path="terms-of-service" element={<RouteWrapper><TermsOfServicePage /></RouteWrapper>} />
        <Route path="cookie-policy" element={<RouteWrapper><CookiePolicyPage /></RouteWrapper>} />
        <Route path="sitemap" element={<RouteWrapper><SitemapPage /></RouteWrapper>} />
        <Route path="demo" element={<RouteWrapper><DemoPage /></RouteWrapper>} />
        <Route path="map" element={<RouteWrapper><JobMapPage /></RouteWrapper>} />
        <Route path="blog" element={<RouteWrapper><BlogPage /></RouteWrapper>} />
        <Route path="blog/author/:id" element={<RouteWrapper><BlogAuthorPage /></RouteWrapper>} />
        <Route path="blog/:slug" element={<RouteWrapper><BlogPostPage /></RouteWrapper>} />
        <Route path="api-docs" element={<RouteWrapper><ApiDocsPage /></RouteWrapper>} />
        <Route path="partner-setup" element={<RouteWrapper><PartnerSetupGuidePage /></RouteWrapper>} />
        <Route path="guide" element={<RouteWrapper><GuidePage /></RouteWrapper>} />
        <Route path="ai-chat" element={<RouteWrapper><AiChatPage /></RouteWrapper>} />
        
      </Route>

      {/* Voice Agent Demo - redirect to consolidated demo page */}
      <Route path="/voice-demo" element={<Navigate to="/demo" replace />} />

      {/* Application Routes (no auth required) */}
      <Route path="/apply" element={<RouteWrapper><Apply /></RouteWrapper>} />
      <Route path="/apply/detailed" element={<RouteWrapper><DetailedApply /></RouteWrapper>} />
      <Route path="/thank-you" element={<RouteWrapper><ThankYou /></RouteWrapper>} />
      
      {/* Embeddable Apply Page (light mode only, for iframe embedding) */}
      <Route path="/embed/apply" element={<RouteWrapper><EmbedApply /></RouteWrapper>} />
      
      {/* Social Platform Apply Routes - cleaner URLs with tracking */}
      <Route path="/x/apply/:jobId" element={<RouteWrapper><XApply /></RouteWrapper>} />
      <Route path="/in/apply/:jobId" element={<RouteWrapper><LinkedInApply /></RouteWrapper>} />
      <Route path="/s/:platform/apply/:jobId" element={<RouteWrapper><SocialApply /></RouteWrapper>} />
      <Route path="/s/:platform/embed/apply" element={<RouteWrapper><SocialEmbedApply /></RouteWrapper>} />
      
      {/* Short Link Redirect */}
      <Route path="/j/:shortCode" element={<RouteWrapper><ShortLinkRedirect /></RouteWrapper>} />
      
      {/* Public Voice Conversation Share */}
      <Route path="/voice/:shareCode" element={<RouteWrapper><SharedVoicePage /></RouteWrapper>} />
      
      {/* Audio Showcase - Standalone full-screen experience */}
      <Route path="/audio/:id" element={<RouteWrapper><AudioShowcasePage /></RouteWrapper>} />
      
      {/* Calendar OAuth Callback */}
      <Route path="/calendar/callback" element={<RouteWrapper><CalendarCallback /></RouteWrapper>} />
      <Route path="/calendar/connect" element={<RouteWrapper><CalendarInviteConnect /></RouteWrapper>} />
      
      <Route path="/auth" element={<RouteWrapper><Auth /></RouteWrapper>} />
      
      {/* Legacy auth route redirects for backward compatibility */}
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/register" element={<Navigate to="/auth?signup=true" replace />} />
      <Route path="/choose-account-type" element={<ProtectedRouteWrapper><ChooseAccountType /></ProtectedRouteWrapper>} />
      <Route path="/onboarding" element={<ProtectedRouteWrapper><Onboarding /></ProtectedRouteWrapper>} />

      {/* Dashboard Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<RouteWrapper><Dashboard /></RouteWrapper>} />
      </Route>

      {/* Candidate Routes */}
      <Route path="/my-jobs" element={
        <ProtectedRoute>
          <RouteWrapper><CandidateLayout /></RouteWrapper>
        </ProtectedRoute>
      }>
        <Route index element={<RouteWrapper><CandidateDashboard /></RouteWrapper>} />
        <Route path="applications" element={<RouteWrapper><MyApplicationsPage /></RouteWrapper>} />
        <Route path="search" element={<RouteWrapper><JobSearchPage /></RouteWrapper>} />
        <Route path="saved" element={<RouteWrapper><SavedJobsPage /></RouteWrapper>} />
        <Route path="messages" element={<Navigate to="/my-jobs/notifications" replace />} />
        <Route path="profile" element={<RouteWrapper><ProfilePage /></RouteWrapper>} />
        <Route path="job/:jobId" element={<RouteWrapper><JobDetailPage /></RouteWrapper>} />
        <Route path="settings" element={<RouteWrapper><CandidateAccountSettings /></RouteWrapper>} />
        <Route path="notifications" element={<RouteWrapper><CandidateNotifications /></RouteWrapper>} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<LayoutWrapper />}>
        <Route index element={<RouteWrapper><Dashboard /></RouteWrapper>} />
        <Route path="jobs" element={<AdminRouteWrapper><Jobs /></AdminRouteWrapper>} />
        <Route path="campaigns" element={<AdminRouteWrapper><Campaigns /></AdminRouteWrapper>} />
        <Route path="job-groups" element={<AdminRouteWrapper><JobGroups /></AdminRouteWrapper>} />
        <Route path="applications" element={<AdminRouteWrapper><Applications /></AdminRouteWrapper>} />
        <Route path="applications/import" element={<AdminRouteWrapper><ImportApplications /></AdminRouteWrapper>} />
        <Route path="ai-impact" element={<AdminRouteWrapper><AIImpactDashboard /></AdminRouteWrapper>} />
        <Route path="ai-analytics" element={<AdminRouteWrapper><AIAnalytics /></AdminRouteWrapper>} />
        <Route path="ai-tools" element={<AdminRouteWrapper><AITools /></AdminRouteWrapper>} />
        <Route path="voice-agent" element={<AdminRouteWrapper><VoiceAgent /></AdminRouteWrapper>} />
        <Route path="elevenlabs-admin" element={<AdminRouteWrapper><ElevenLabsAdmin /></AdminRouteWrapper>} />
        <Route path="my-calendar" element={<AdminRouteWrapper><RecruiterCalendarPage /></AdminRouteWrapper>} />
        
        {/* Consolidated Routes */}
        <Route path="ats-command" element={<AdminRouteWrapper><ATSCommandCenterPage /></AdminRouteWrapper>} />
        <Route path="meta-analytics" element={<AdminRouteWrapper><MetaAnalyticsPage /></AdminRouteWrapper>} />
        <Route path="ai-configuration" element={<AdminRouteWrapper><AIConfigurationPage /></AdminRouteWrapper>} />
        
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
        <Route path="tenstreet-integration" element={<AdminRouteWrapper><TenstreetIntegration /></AdminRouteWrapper>} />
        <Route path="routes" element={<AdminRouteWrapper><RoutesPage /></AdminRouteWrapper>} />
        <Route path="platforms" element={<Navigate to="/admin/ad-networks" replace />} />
        <Route path="publishers" element={<Navigate to="/admin/ad-networks" replace />} />
        <Route path="ad-networks" element={<AdminRouteWrapper><AdNetworks /></AdminRouteWrapper>} />
        <Route path="job-boards" element={<AdminRouteWrapper><JobBoards /></AdminRouteWrapper>} />
        <Route path="feeds" element={<AdminRouteWrapper><FeedsManagement /></AdminRouteWrapper>} />
        <Route path="syndication" element={<AdminRouteWrapper><SyndicationDashboard /></AdminRouteWrapper>} />
        <Route path="universal-feeds" element={<AdminRouteWrapper><UniversalFeeds /></AdminRouteWrapper>} />
        <Route path="clients" element={<AdminRouteWrapper><ClientsPage /></AdminRouteWrapper>} />
        <Route path="client-dashboards" element={<AdminRouteWrapper><ClientDashboardsPage /></AdminRouteWrapper>} />
        <Route path="organizations" element={<AdminRouteWrapper><Organizations /></AdminRouteWrapper>} />
        <Route path="settings" element={<AdminRouteWrapper><Settings /></AdminRouteWrapper>} />
        <Route path="media" element={<AdminRouteWrapper><Media /></AdminRouteWrapper>} />
        <Route path="brand-assets" element={<AdminRouteWrapper><BrandAssets /></AdminRouteWrapper>} />
        <Route path="user-management" element={<AdminRouteWrapper><UserManagement /></AdminRouteWrapper>} />
        <Route path="super-admin-feeds" element={<AdminRouteWrapper><SuperAdminFeeds /></AdminRouteWrapper>} />
        <Route path="webhook-management" element={<AdminRouteWrapper><WebhookManagement /></AdminRouteWrapper>} />
        <Route path="active-job-ids" element={<AdminRouteWrapper><ActiveJobIds /></AdminRouteWrapper>} />
        <Route path="tenstreet-sync" element={<AdminRouteWrapper><TenstreetSyncDashboard /></AdminRouteWrapper>} />
        <Route path="driverreach-integration" element={<AdminRouteWrapper><DriverReachIntegration /></AdminRouteWrapper>} />
        <Route path="driverreach-sync" element={<AdminRouteWrapper><DriverReachSyncDashboard /></AdminRouteWrapper>} />
        <Route path="data-population" element={<AdminRouteWrapper><DataPopulation /></AdminRouteWrapper>} />
        <Route path="visitor-analytics" element={<AdminRouteWrapper><VisitorAnalytics /></AdminRouteWrapper>} />
        <Route path="edge-functions-test" element={<AdminRouteWrapper><EdgeFunctionsTest /></AdminRouteWrapper>} />
        <Route path="web-scraper" element={<AdminRouteWrapper><WebScraperPage /></AdminRouteWrapper>} />
        <Route path="support" element={<AdminRouteWrapper><Support /></AdminRouteWrapper>} />
        <Route path="ai-assistant" element={<AdminRouteWrapper><GrokChatPage /></AdminRouteWrapper>} />
        <Route path="grok" element={<Navigate to="/admin/ai-assistant" replace />} />
        
        {/* Talent Routes */}
        <Route path="talent/pools" element={<AdminRouteWrapper><TalentPoolsPage /></AdminRouteWrapper>} />
        
        {/* Social Engagement Routes */}
        <Route path="social-engagement" element={<AdminRouteWrapper><SocialEngagementDashboard /></AdminRouteWrapper>} />
        <Route path="social-beacons" element={<AdminRouteWrapper><SuperAdminSocialBeacons /></AdminRouteWrapper>} />
        
        
        <Route path="settings/profile" element={<AdminRouteWrapper><ProfileSettings /></AdminRouteWrapper>} />
        <Route path="settings/organization" element={<AdminRouteWrapper><OrganizationSettings /></AdminRouteWrapper>} />
        <Route path="settings/security" element={<AdminRouteWrapper><SecuritySettings /></AdminRouteWrapper>} />
        {/* Billing settings removed - all features available to all users */}
      </Route>

      {/* Access Denied Route */}
      <Route path="/access-denied" element={<RouteWrapper><AccessDenied /></RouteWrapper>} />

      {/* Offline Route */}
      <Route path="/offline" element={<RouteWrapper><Offline /></RouteWrapper>} />

      {/* 404 Route */}
      <Route path="*" element={<RouteWrapper><NotFound /></RouteWrapper>} />
    </Routes>
  );
};

export default AppRoutes;
