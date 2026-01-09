import React, { useState } from 'react';
import { PageLayout } from '@/features/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  GitCompare, 
  Shield, 
  Lightbulb, 
  Download,
  Sparkles
} from 'lucide-react';
import {
  AIPerformanceMetrics,
  PredictiveAnalytics,
  ComparativeAnalysis,
  BiasAnalysis,
  ModelInsights,
  ExportAnalytics
} from '../components';

const AIAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('performance');

  // Mock data - in production, this would come from your API/hooks
  const performanceData = {
    modelAccuracy: 91,
    predictionConfidence: 88,
    processingSpeed: 15,
    biasScore: 15,
    candidatesAnalyzed: 847,
    accuracyTrend: 8,
    avgProcessingTime: '1.2s',
    successRate: 87
  };

  return (
    <PageLayout 
      title="AI Analytics"
      description="Advanced AI-powered insights and comprehensive analytics dashboard"
      actions={
        <Badge variant="outline" className="gap-1">
          <Brain className="w-3 h-3" />
          Model v2.1
        </Badge>
      }
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20 md:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile: Horizontal scroll, Desktop: Grid */}
          <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1">
            <div className="inline-flex h-auto items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground min-w-max md:min-w-0 md:w-full md:grid md:grid-cols-6">
              <TabsTrigger value="performance" className="flex items-center gap-2 py-3 px-3 whitespace-nowrap min-h-[44px]">
                <Brain className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="flex items-center gap-2 py-3 px-3 whitespace-nowrap min-h-[44px]">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Predictions</span>
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2 py-3 px-3 whitespace-nowrap min-h-[44px]">
                <GitCompare className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Comparison</span>
              </TabsTrigger>
              <TabsTrigger value="bias" className="flex items-center gap-2 py-3 px-3 whitespace-nowrap min-h-[44px]">
                <Shield className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Bias Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 py-3 px-3 whitespace-nowrap min-h-[44px]">
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Insights</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2 py-3 px-3 whitespace-nowrap min-h-[44px]">
                <Download className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Export</span>
              </TabsTrigger>
            </div>
          </div>

          <TabsContent value="performance" className="mt-6 animate-fade-in">
            <AIPerformanceMetrics data={performanceData} />
          </TabsContent>

          <TabsContent value="predictions" className="mt-6 animate-fade-in">
            <PredictiveAnalytics />
          </TabsContent>

          <TabsContent value="comparison" className="mt-6 animate-fade-in">
            <ComparativeAnalysis />
          </TabsContent>

          <TabsContent value="bias" className="mt-6 animate-fade-in">
            <BiasAnalysis />
          </TabsContent>

          <TabsContent value="insights" className="mt-6 animate-fade-in">
            <ModelInsights />
          </TabsContent>

          <TabsContent value="export" className="mt-6 animate-fade-in">
            <ExportAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default AIAnalyticsPage;