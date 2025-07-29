
import React, { useState, useEffect } from 'react';
import DashboardCategoryTiles from './DashboardCategoryTiles';
import DashboardMetricsSection from './DashboardMetricsSection';
import DashboardOverview from './DashboardOverview';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AIProviderSettings from '@/components/analytics/AIProviderSettings';
import AnalyticsSummary from '@/components/analytics/AnalyticsSummary';
import LocationStatusBreakdown from '@/components/analytics/LocationStatusBreakdown';
import AnalyticsInsights from '@/components/analytics/AnalyticsInsights';

interface AnalyticsData {
  locationConversion: Array<{
    location: string;
    conversionRate: number;
    totalApplications: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    percentage: number;
    count: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    percentage: number;
    count: number;
  }>;
  insights: string[];
  recommendations: string[];
  totalApplications?: number;
  provider?: string;
}

const DashboardContent = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<'basic' | 'openai' | 'anthropic'>('basic');
  const [totalApplications, setTotalApplications] = useState<number>(0);
  const { toast } = useToast();

  const generateAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch applications data
      const { data: applications, error } = await supabase.from('applications').select('*');
      if (error) throw error;

      console.log(`Fetched ${applications?.length || 0} applications for analysis`);
      setTotalApplications(applications?.length || 0);

      // Call enhanced edge function with selected AI provider
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('ai-analytics-enhanced', {
        body: {
          applications,
          aiProvider,
          extraContext: `Analytics for ${applications.length} applications using ${aiProvider} analysis`
        }
      });

      if (analysisError) throw analysisError;

      // Add total applications count to the result
      const enrichedResult = {
        ...analysisResult,
        totalApplications: applications?.length || 0
      };

      setAnalyticsData(enrichedResult);
      toast({
        title: "Analytics Generated",
        description: `AI analysis completed for ${applications?.length || 0} applications using ${aiProvider === 'basic' ? 'Basic' : aiProvider === 'openai' ? 'OpenAI' : 'Anthropic'} insights`
      });
    } catch (error) {
      console.error('Error generating analytics:', error);
      toast({
        title: "Error",
        description: "Failed to generate analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Re-generate analytics when provider changes
  useEffect(() => {
    if (analyticsData && aiProvider !== analyticsData.provider) {
      generateAnalytics();
    }
  }, [aiProvider]);

  useEffect(() => {
    generateAnalytics();
  }, []);

  return (
    <div className="space-y-8">
      <DashboardCategoryTiles />
      
      {/* AI Analytics Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">AI Analytics</h2>
            <p className="text-muted-foreground">
              AI-powered insights and recommendations for your applications
            </p>
            {(analyticsData?.totalApplications || totalApplications > 0) && (
              <p className="text-sm text-primary font-medium mt-1">
                Analyzing {analyticsData?.totalApplications || totalApplications} total applications
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={generateAnalytics} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <BarChart3 className="w-4 h-4 mr-2" />
              )}
              Refresh Analytics
            </Button>
          </div>
        </div>

        {/* AI Provider Selection */}
        <AIProviderSettings 
          aiProvider={aiProvider}
          setAiProvider={setAiProvider}
          loading={loading}
          analyticsProvider={analyticsData?.provider}
        />

        {loading && !analyticsData ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Analyzing applications with AI...</p>
            </div>
          </div>
        ) : analyticsData ? (
          <>
            {/* Application Summary Card */}
            <AnalyticsSummary 
              totalApplications={analyticsData.totalApplications || totalApplications}
              provider={analyticsData.provider}
            />

            {/* Location and Status Breakdown */}
            <LocationStatusBreakdown 
              locationConversion={analyticsData.locationConversion}
              statusBreakdown={analyticsData.statusBreakdown}
            />

            {/* AI Insights */}
            <AnalyticsInsights 
              insights={analyticsData.insights}
              recommendations={analyticsData.recommendations}
              provider={analyticsData.provider}
            />
          </>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No analytics data available</p>
                <Button onClick={generateAnalytics} className="mt-4">
                  Generate Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <DashboardMetricsSection />
      <DashboardOverview />
    </div>
  );
};

export default DashboardContent;
