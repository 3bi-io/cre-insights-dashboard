import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/features/dashboard';

const Dashboard = () => {
  const { userRole, organization, loading } = useAuth();

  // Show loading state while auth data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect super admins to admin dashboard
  if (userRole === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  // Organization admin view - organization-specific access only
  return <DashboardLayout organizationName={organization?.name} />;
};

export default Dashboard;