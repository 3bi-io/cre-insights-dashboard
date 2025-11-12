import React from 'react';
import { Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Skeleton } from '@/components/ui/skeleton';

// Dashboard page
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));

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

export const dashboardRoutes = (
  <>
    {/* Main Dashboard Route */}
    <Route path="/dashboard" element={
      <ProtectedRoute requireSubscription={false}>
        <Layout />
      </ProtectedRoute>
    }>
      <Route index element={<RouteWrapper><Dashboard /></RouteWrapper>} />
    </Route>
  </>
);
