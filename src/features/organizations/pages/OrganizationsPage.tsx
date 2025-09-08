import React from 'react';
import { PageLayout } from '@/features/shared';
import { OrganizationManagement } from '../components';

const OrganizationsPage = () => {
  return (
    <PageLayout 
      title="Organizations" 
      description="Manage organization settings and configurations"
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <OrganizationManagement />
      </div>
    </PageLayout>
  );
};

export default OrganizationsPage;