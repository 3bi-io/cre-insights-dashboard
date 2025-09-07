
import React, { useState } from 'react';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import DashboardTabs from '@/components/dashboard/DashboardTabs';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { dateRange, setDateRange, filters, updateFilters, resetFilters } = useDashboardFilters();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
