
import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardTabs from '@/components/dashboard/DashboardTabs';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <DashboardLayout>
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </DashboardLayout>
  );
};

export default Index;
