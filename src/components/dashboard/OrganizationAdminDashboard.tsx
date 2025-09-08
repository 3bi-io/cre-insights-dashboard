import React from 'react';
import { DashboardLayout } from '@/features/dashboard';

interface OrganizationAdminDashboardProps {
  organizationName?: string;
}

export const OrganizationAdminDashboard = ({ organizationName }: OrganizationAdminDashboardProps) => {
  return <DashboardLayout organizationName={organizationName} />;
};