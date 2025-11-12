import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Skeleton } from '@/components/ui/skeleton';

// Authentication pages
const Auth = React.lazy(() => import("@/pages/Auth"));
const Onboarding = React.lazy(() => import("@/pages/Onboarding"));
const Apply = React.lazy(() => import("@/pages/Apply"));
const DetailedApply = React.lazy(() => import("@/pages/DetailedApply"));
const ThankYou = React.lazy(() => import("@/pages/ThankYou"));

// Loading fallback
const PageSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-4 w-1/2" />
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

export const authRoutes = (
  <>
    {/* Public Application Routes */}
    <Route path="/apply" element={<RouteWrapper><Apply /></RouteWrapper>} />
    <Route path="/apply/detailed" element={<RouteWrapper><DetailedApply /></RouteWrapper>} />
    <Route path="/thank-you" element={<RouteWrapper><ThankYou /></RouteWrapper>} />
    
    {/* Authentication */}
    <Route path="/auth" element={<RouteWrapper><Auth /></RouteWrapper>} />
    
    {/* Protected Onboarding */}
    <Route path="/onboarding" element={<ProtectedRouteWrapper><Onboarding /></ProtectedRouteWrapper>} />
  </>
);
