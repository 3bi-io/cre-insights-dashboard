import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { OrganizationAdminDashboard } from '@/components/dashboard/OrganizationAdminDashboard';

const Dashboard = () => {
  const { user, userRole, organization, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect super admins to admin dashboard
  if (userRole === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  // Redirect if user doesn't have admin privileges
  if (!user || userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Organization admin view - organization-specific access only
  return <OrganizationAdminDashboard organizationName={organization?.name} />;
};

export default Dashboard;