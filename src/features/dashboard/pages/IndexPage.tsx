import React, { useState } from 'react';
import { PageLayout } from '@/features/shared';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { DashboardTabs } from '../components';

const IndexPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { dateRange, setDateRange, filters, updateFilters, resetFilters } = useDashboardFilters();

  return (
    <PageLayout 
      title="Dashboard" 
      description="Monitor performance and manage your recruiting operations"
      className="bg-background"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </PageLayout>
  );
};

export default IndexPage;