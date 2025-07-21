
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, LayoutGrid, Brain } from 'lucide-react';
import DashboardContent from './DashboardContent';
import AIAnalytics from '@/pages/AIAnalytics';
import AIAnalysisTab from './AIAnalysisTab';

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-lg">
        <TabsTrigger value="dashboard" className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="ai-analytics" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          AI Overview
        </TabsTrigger>
        <TabsTrigger value="ai-analysis" className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          AI Analysis
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="dashboard" className="mt-6">
        <DashboardContent />
      </TabsContent>
      
      <TabsContent value="ai-analytics" className="mt-6">
        <div className="min-h-screen bg-background -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <AIAnalytics />
        </div>
      </TabsContent>
      
      <TabsContent value="ai-analysis" className="mt-6">
        <AIAnalysisTab />
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;
