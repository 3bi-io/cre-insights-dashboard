import { useState } from 'react';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';
import { dashboardTabs, type DashboardTab } from '../config/dashboardConfig';

export const useDashboardTabs = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { 
    hasAdvancedAnalytics
  } = useOrganizationFeatures();

  const getAccessFunction = (tabId: string) => {
    switch (tabId) {
      case 'analytics':
        return hasAdvancedAnalytics;
      default:
        return () => true;
    }
  };

  const availableTabs = dashboardTabs.filter((tab) => {
    const accessFunction = getAccessFunction(tab.id);
    return accessFunction();
  });

  const currentTab = dashboardTabs.find(tab => tab.id === activeTab);

  return {
    activeTab,
    setActiveTab,
    availableTabs,
    currentTab,
    allTabs: dashboardTabs,
  };
};