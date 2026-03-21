import React from 'react';
import { AlertCircle } from 'lucide-react';
import { PageLayout } from '@/features/shared';
import { useAuth } from '@/hooks/useAuth';
import { hasRoleOrHigher } from '@/utils/roleUtils';
import { SuperAdminDashboard } from '../components/SuperAdminDashboard';
import { RegularUserDashboard } from '../components/RegularUserDashboard';
import { DashboardLayout } from '../components/DashboardLayout';
import { ClientPortalDashboard } from '../components/ClientPortalDashboard';

const DashboardPage = () => {
  const { user, userRole, organization, loading } = useAuth();

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
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

  // Super admin gets full platform dashboard
  if (userRole === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  // Client role users get client-scoped portal
  if (userRole === 'client') {
    return <ClientPortalDashboard />;
  }

  // Admin, moderator, and recruiter get organization dashboard
  if (hasRoleOrHigher(userRole, 'recruiter')) {
    return <DashboardLayout organizationName={organization?.name} />;
  }

  // Regular users (viewer/user) get limited dashboard
  return <RegularUserDashboard />;
};

export default DashboardPage;