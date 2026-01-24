import React, { useState } from 'react';
import { PageLayout } from '@/features/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Brain, 
  TrendingUp, 
  GitCompare, 
  Shield, 
  Lightbulb, 
  Download,
  RefreshCw,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  AIPerformanceMetrics,
  PredictiveAnalytics,
  ComparativeAnalysis,
  BiasAnalysis,
  ModelInsights,
  ExportAnalytics,
  AnalyticsEmptyState,
  AnalyticsLoadingSkeleton
} from '../components';
import { useAIAnalyticsData, type DateRangeType } from '../hooks';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AIAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('performance');
  const [dateRange, setDateRange] = useState<DateRangeType>('month');
  
  const { data, isLoading, error, refetch, isFetching } = useAIAnalyticsData(dateRange);

  const tabs = [
    { value: 'performance', label: 'Performance', icon: Brain },
    { value: 'predictions', label: 'Predictions', icon: TrendingUp },
    { value: 'comparison', label: 'Comparison', icon: GitCompare },
    { value: 'bias', label: 'Bias Analysis', icon: Shield },
    { value: 'insights', label: 'Insights', icon: Lightbulb },
    { value: 'export', label: 'Export', icon: Download },
  ];

  return (
    <PageLayout 
      title="AI Analytics"
      description="Advanced AI-powered insights and comprehensive analytics dashboard"
      actions={
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangeType)}>
            <SelectTrigger className="w-[140px] h-9">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 w-9"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Badge variant="outline" className="gap-1 hidden sm:flex">
            <Brain className="w-3 h-3" />
            Model {data?.insights.modelVersion || 'v2.1'}
          </Badge>
        </div>
      }
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20 md:pb-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load analytics data. Please try again.
              <Button variant="link" className="p-0 h-auto ml-2" onClick={() => refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile: Horizontal scroll with tooltips, Desktop: Grid */}
          <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1">
            <TabsList className="inline-flex h-auto items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground min-w-max md:min-w-0 md:w-full md:grid md:grid-cols-6">
              <TooltipProvider delayDuration={0}>
                {tabs.map((tab) => (
                  <Tooltip key={tab.value}>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value={tab.value} 
                        className="flex items-center gap-2 py-3 px-3 whitespace-nowrap min-h-[44px]"
                      >
                        <tab.icon className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="sm:hidden">
                      <p>{tab.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </TabsList>
          </div>

          {isLoading ? (
            <div className="mt-6">
              <AnalyticsLoadingSkeleton variant="full" />
            </div>
          ) : !data ? (
            <div className="mt-6">
              <AnalyticsEmptyState
                title="No Analytics Data"
                description="Start analyzing candidates with AI to see performance metrics and insights here."
                action={{ label: 'Refresh', onClick: () => refetch() }}
              />
            </div>
          ) : (
            <>
              <TabsContent value="performance" className="mt-6 animate-fade-in">
                <AIPerformanceMetrics data={data.performance} />
              </TabsContent>

              <TabsContent value="predictions" className="mt-6 animate-fade-in">
                <PredictiveAnalytics data={data.predictions} />
              </TabsContent>

              <TabsContent value="comparison" className="mt-6 animate-fade-in">
                <ComparativeAnalysis data={data.comparison} />
              </TabsContent>

              <TabsContent value="bias" className="mt-6 animate-fade-in">
                <BiasAnalysis data={data.bias} />
              </TabsContent>

              <TabsContent value="insights" className="mt-6 animate-fade-in">
                <ModelInsights data={data.insights} />
              </TabsContent>

              <TabsContent value="export" className="mt-6 animate-fade-in">
                <ExportAnalytics analyticsData={data} dateRange={dateRange} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default AIAnalyticsPage;
