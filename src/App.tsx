import React, { Suspense, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import Layout from "@/components/Layout";
import PublicLayout from "@/components/public/PublicLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";
import GlobalErrorBoundary from "@/components/error/GlobalErrorBoundary";
import { ErrorBoundaryEnhanced } from "@/components/debug/ErrorBoundaryEnhanced";
import { DevToolsPanel, DevToolsToggle } from "@/components/debug/DevToolsPanel";
import { FeatureProvider } from "@/features/shared/components/FeatureProvider";
import { logger } from "@/services/loggerService";

// Public pages
const LandingPage = React.lazy(() => import("./pages/public/LandingPage"));
const FeaturesPage = React.lazy(() => import("./pages/public/FeaturesPage"));
const PricingPage = React.lazy(() => import("./pages/public/PricingPage"));
const AboutPage = React.lazy(() => import("./pages/public/AboutPage"));
const ContactPage = React.lazy(() => import("./pages/public/ContactPage"));
const PrivacyPolicyPage = React.lazy(() => import("./pages/public/PrivacyPolicyPage"));
const TermsOfServicePage = React.lazy(() => import("./pages/public/TermsOfServicePage"));
const CookiePolicyPage = React.lazy(() => import("./pages/public/CookiePolicyPage"));

// Lazy load all pages for code splitting
const Home = React.lazy(() => import("./pages/Home"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const Jobs = React.lazy(() => import("./pages/Jobs"));
const Campaigns = React.lazy(() => import("./pages/Campaigns"));
const Applications = React.lazy(() => import("./pages/Applications"));
const AIImpactDashboard = React.lazy(() => import("./pages/AIImpactDashboard"));
const AITools = React.lazy(() => import("./pages/AITools"));
const VoiceAgent = React.lazy(() => import("./pages/VoiceAgent"));
const TenstreetIntegration = React.lazy(() => import("./pages/TenstreetIntegration"));
const RoutesPage = React.lazy(() => import("./pages/Routes"));
const Publishers = React.lazy(() => import("./pages/Platforms"));
const Clients = React.lazy(() => import("./pages/Clients"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Auth = React.lazy(() => import("./pages/Auth"));
const Apply = React.lazy(() => import("./pages/Apply"));
const DetailedApply = React.lazy(() => import("./pages/DetailedApply"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const PrivacyControls = React.lazy(() => import("./pages/PrivacyControls"));
const ThankYou = React.lazy(() => import("./pages/ThankYou"));
const Organizations = React.lazy(() => import("./pages/Organizations"));
const Media = React.lazy(() => import("./pages/Media"));
const JobGroups = React.lazy(() => import("./pages/JobGroups"));
const UserManagement = React.lazy(() => import("./pages/UserManagement"));

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
    },
  },
});

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

// Memoized route wrapper for protected routes
const ProtectedRouteWrapper = React.memo(({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <Suspense fallback={<PageSkeleton />}>
      {children}
    </Suspense>
  </ProtectedRoute>
));

ProtectedRouteWrapper.displayName = "ProtectedRouteWrapper";

// Memoized layout wrapper
const LayoutWrapper = React.memo(() => (
  <ProtectedRoute>
    <Layout />
  </ProtectedRoute>
));

LayoutWrapper.displayName = "LayoutWrapper";

const App = React.memo(() => {
  const [showDevTools, setShowDevTools] = useState(false);
  
  return (
    <ErrorBoundaryEnhanced showDetailedError={true}>
      <GlobalErrorBoundary
        onError={(error, errorInfo) => {
          logger.error('App-level error caught', { error, errorInfo }, 'App');
        }}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="ui-theme">
            <BrowserRouter>
              <AuthProvider>
                <FeatureProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route
                  index
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <LandingPage />
                    </Suspense>
                  }
                />
                <Route
                  path="features"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <FeaturesPage />
                    </Suspense>
                  }
                />
                <Route
                  path="pricing"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <PricingPage />
                    </Suspense>
                  }
                />
                <Route
                  path="about"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <AboutPage />
                    </Suspense>
                  }
                />
                <Route
                  path="contact"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <ContactPage />
                    </Suspense>
                  }
                />
                <Route
                  path="privacy-policy"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <PrivacyPolicyPage />
                    </Suspense>
                  }
                />
                <Route
                  path="terms-of-service"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <TermsOfServicePage />
                    </Suspense>
                  }
                />
                <Route
                  path="cookie-policy"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <CookiePolicyPage />
                    </Suspense>
                  }
                />
              </Route>

              {/* Application Routes */}
              <Route
                path="/apply"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <Apply />
                  </Suspense>
                }
              />
              <Route
                path="/apply/detailed"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <DetailedApply />
                  </Suspense>
                }
              />
              <Route
                path="/thank-you"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <ThankYou />
                  </Suspense>
                }
              />
              <Route
                path="/auth"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <Auth />
                  </Suspense>
                }
              />
              <Route path="/dashboard" element={<LayoutWrapper />}>
                <Route
                  index
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <Dashboard />
                    </Suspense>
                  }
                />
              </Route>
              <Route path="/admin" element={<LayoutWrapper />}>
                <Route
                  index
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <AdminDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="jobs"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <Jobs />
                    </Suspense>
                  }
                />
                <Route
                  path="campaigns"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <Campaigns />
                    </Suspense>
                  }
                />
                <Route
                  path="job-groups"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <JobGroups />
                    </Suspense>
                  }
                />
                <Route
                  path="applications"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <Applications />
                    </Suspense>
                  }
                />
                <Route
                  path="ai-impact"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <AIImpactDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="ai-tools"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <AITools />
                    </Suspense>
                  }
                />
                <Route
                  path="privacy-controls"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <PrivacyControls />
                    </Suspense>
                  }
                />
                <Route
                  path="voice-agent"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <VoiceAgent />
                    </Suspense>
                  }
                />
                <Route
                  path="tenstreet"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <TenstreetIntegration />
                    </Suspense>
                  }
                />
                <Route
                  path="routes"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <RoutesPage />
                    </Suspense>
                  }
                />
                <Route
                  path="publishers"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <Publishers />
                    </Suspense>
                  }
                />
                <Route
                  path="clients"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <Clients />
                    </Suspense>
                  }
                />
                <Route
                  path="organizations"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <Organizations />
                    </Suspense>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <Settings />
                    </Suspense>
                  }
                />
                <Route
                  path="media"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <Media />
                    </Suspense>
                  }
                />
                <Route
                  path="user-management"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <UserManagement />
                    </Suspense>
                  }
                />
              </Route>
              <Route
                path="*"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <NotFound />
                  </Suspense>
                }
              />
                    </Routes>
                    
                    {/* Development Tools */}
                    <DevToolsToggle onToggle={() => setShowDevTools(!showDevTools)} />
                    <DevToolsPanel 
                      isVisible={showDevTools} 
                      onToggle={() => setShowDevTools(!showDevTools)} 
                    />
                  </TooltipProvider>
                </FeatureProvider>
              </AuthProvider>
            </BrowserRouter>
  </ThemeProvider>
</QueryClientProvider>
</GlobalErrorBoundary>
</ErrorBoundaryEnhanced>
);
});

App.displayName = "App";

export default App;