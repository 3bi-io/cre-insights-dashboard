import React from 'react';
import { Route } from 'react-router-dom';
import PublicLayout from '@/components/public/PublicLayout';
import { Skeleton } from '@/components/ui/skeleton';

// Public pages
const LandingPage = React.lazy(() => import("@/pages/public/LandingPage"));
const JobsPage = React.lazy(() => import("@/pages/public/JobsPage"));
const DemoPage = React.lazy(() => import("@/pages/public/DemoPage"));
const FeaturesPage = React.lazy(() => import("@/pages/public/FeaturesPage"));
const PricingPage = React.lazy(() => import("@/pages/public/PricingPage"));
const ContactPage = React.lazy(() => import("@/pages/public/ContactPage"));
const ResourcesPage = React.lazy(() => import("@/pages/public/ResourcesPage"));
const PrivacyPolicyPage = React.lazy(() => import("@/pages/public/PrivacyPolicyPage"));
const TermsOfServicePage = React.lazy(() => import("@/pages/public/TermsOfServicePage"));
const CookiePolicyPage = React.lazy(() => import("@/pages/public/CookiePolicyPage"));
const SitemapPage = React.lazy(() => import("@/pages/public/SitemapPage"));

// PWA pages
const Install = React.lazy(() => import("@/pages/Install"));
const Offline = React.lazy(() => import("@/pages/Offline"));
const AccessDenied = React.lazy(() => import("@/pages/AccessDenied"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

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

export const publicRoutes = (
  <>
    {/* Public Marketing Routes */}
    <Route path="/" element={<PublicLayout />}>
      <Route index element={<RouteWrapper><LandingPage /></RouteWrapper>} />
      <Route path="jobs" element={<RouteWrapper><JobsPage /></RouteWrapper>} />
      <Route path="demo" element={<RouteWrapper><DemoPage /></RouteWrapper>} />
      <Route path="features" element={<RouteWrapper><FeaturesPage /></RouteWrapper>} />
      <Route path="pricing" element={<RouteWrapper><PricingPage /></RouteWrapper>} />
      <Route path="contact" element={<RouteWrapper><ContactPage /></RouteWrapper>} />
      <Route path="resources" element={<RouteWrapper><ResourcesPage /></RouteWrapper>} />
      <Route path="privacy-policy" element={<RouteWrapper><PrivacyPolicyPage /></RouteWrapper>} />
      <Route path="terms-of-service" element={<RouteWrapper><TermsOfServicePage /></RouteWrapper>} />
      <Route path="cookie-policy" element={<RouteWrapper><CookiePolicyPage /></RouteWrapper>} />
      <Route path="sitemap" element={<RouteWrapper><SitemapPage /></RouteWrapper>} />
    </Route>

    {/* PWA & Utility Routes */}
    <Route path="/install" element={<RouteWrapper><Install /></RouteWrapper>} />
    <Route path="/offline" element={<RouteWrapper><Offline /></RouteWrapper>} />
    <Route path="/access-denied" element={<RouteWrapper><AccessDenied /></RouteWrapper>} />
    
    {/* 404 - Must be last */}
    <Route path="*" element={<RouteWrapper><NotFound /></RouteWrapper>} />
  </>
);
