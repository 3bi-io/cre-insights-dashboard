import React, { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { PageLayout } from '@/features/shared';
import { useAuth } from '@/hooks/useAuth';
import { hasRoleOrHigher } from '@/utils/roleUtils';

const SuperAdminDashboard = React.lazy(() => import('../components/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const RegularUserDashboard = React.lazy(() => import('../components/RegularUserDashboard').then(m => ({ default: m.RegularUserDashboard })));
const DashboardLayout = React.lazy(() => import('../components/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const ClientPortalDashboard = React.lazy(() => import('../components/ClientPortalDashboard').then(m => ({ default: m.ClientPortalDashboard })));

const DashboardFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const DashboardPage = () => {
  const { user, userRole, organization, loading } = useAuth();

  if (loading) {
    return (
      <PageLayout>
        <DashboardFallback />
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You need to be logged in to access the dashboard.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <Suspense fallback={<DashboardFallback />}>
      {userRole === 'super_admin' ? (
        <SuperAdminDashboard />
      ) : userRole === 'client' ? (
        <ClientPortalDashboard />
      ) : hasRoleOrHigher(userRole, 'recruiter') ? (
        <DashboardLayout organizationName={organization?.name} />
      ) : (
        <RegularUserDashboard />
      )}
    </Suspense>
  );
};

export default DashboardPage;
