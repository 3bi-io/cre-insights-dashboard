import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureGuard } from '@/components/FeatureGuard';
import { useDashboardTabs } from '../hooks/useDashboardTabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
      {/* Mobile: Horizontal scroll, Desktop: Grid */}
      <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1">
        <div
          className={cn(
            "inline-flex h-10 items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground",
            "min-w-max md:min-w-0 md:w-full",
            `md:grid md:grid-cols-${Math.min(allTabs.length, 8)}`
          )}
        >
          {allTabs.map((tab) => {
            const isDisabled = !availableTabs.some(availableTab => availableTab.id === tab.id);
            
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                disabled={isDisabled}
                className={cn(
                  "whitespace-nowrap px-3 py-1.5 min-h-[36px]",
                  tab.icon ? "flex items-center gap-2" : ""
                )}
              >
                {tab.icon && <tab.icon className="w-4 h-4 shrink-0" />}
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {allTabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-6">
          {renderTabContent(tab)}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default DashboardTabsComponent;