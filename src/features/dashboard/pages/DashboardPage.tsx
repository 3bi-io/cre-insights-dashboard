import React from 'react';
import { AlertCircle } from 'lucide-react';
import { PageLayout } from '@/features/shared';
import { useAuth } from '@/hooks/useAuth';
import { hasRoleOrHigher } from '@/utils/roleUtils';
import { SuperAdminDashboard } from '../components/SuperAdminDashboard';
import { RegularUserDashboard } from '../components/RegularUserDashboard';
import { DashboardLayout } from '../components/DashboardLayout';

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

  // Admin, moderator, and recruiter get organization dashboard
  // Using hierarchy: recruiter (2) and above get the full dashboard
  if (hasRoleOrHigher(userRole, 'recruiter')) {
    return <DashboardLayout organizationName={organization?.name} />;
  }

  // Regular users (viewer/user) get limited dashboard
  return <RegularUserDashboard />;
};

export default DashboardPage;