import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureGuard } from '@/components/FeatureGuard';
import { useDashboardTabs } from '../hooks/useDashboardTabs';

export const DashboardTabsComponent: React.FC = () => {
  const { activeTab, setActiveTab, availableTabs, currentTab, allTabs } = useDashboardTabs();

  const renderTabContent = (tab: typeof allTabs[0]) => {
    const Component = tab.component;
    
    if (tab.featureGuard) {
      const { feature, featureName, showUpgrade = true, fallback } = tab.featureGuard;
      
      return (
        <FeatureGuard 
          feature={feature as any}
          featureName={featureName}
          showUpgrade={showUpgrade}
          fallback={fallback ? React.createElement(fallback) : undefined}
        >
          <Component />
        </FeatureGuard>
      );
    }

    return <Component />;
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className={`grid w-full grid-cols-${Math.min(allTabs.length, 8)}`}>
        {allTabs.map((tab) => {
          const isDisabled = !availableTabs.some(availableTab => availableTab.id === tab.id);
          
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={isDisabled}
              className={tab.icon ? "flex items-center gap-2" : ""}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {allTabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-6">
          {renderTabContent(tab)}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default DashboardTabsComponent;