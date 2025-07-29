
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, TrendingUp } from 'lucide-react';
import DashboardContent from './DashboardContent';
import AIImpactDashboard from '@/pages/AIImpactDashboard';

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="dashboard" className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="ai-impact" className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          AI Impact
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="dashboard" className="mt-6">
        <DashboardContent />
      </TabsContent>
      
      <TabsContent value="ai-impact" className="mt-6">
        <AIImpactDashboard />
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;
