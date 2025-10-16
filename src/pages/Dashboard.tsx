import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/features/dashboard';

const Dashboard = () => {
  const { userRole, organization } = useAuth();

  // Redirect super admins to admin dashboard
  if (userRole === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  // Organization admin view - organization-specific access only
  return <DashboardLayout organizationName={organization?.name} />;
};

export default Dashboard;