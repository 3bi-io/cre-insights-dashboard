import React from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/features/shared';
import { Skeleton } from '@/components/ui/skeleton';

// Candidate feature pages
const CandidateLayout = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.CandidateLayout })));
const CandidateDashboard = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.CandidateDashboard })));
const MyApplicationsPage = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.MyApplicationsPage })));
const JobSearchPage = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.JobSearchPage })));
const SavedJobsPage = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.SavedJobsPage })));
const MessagesPage = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.MessagesPage })));
const ProfilePage = React.lazy(() => import("@/features/candidate").then(m => ({ default: m.ProfilePage })));

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

export const candidateRoutes = (
  <>
    {/* Candidate Portal Routes */}
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
    </Route>
  </>
);
