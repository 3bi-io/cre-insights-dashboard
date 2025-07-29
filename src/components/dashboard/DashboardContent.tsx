
import React, { useState, useEffect } from 'react';
import DashboardCategoryTiles from './DashboardCategoryTiles';
import DashboardMetricsSection from './DashboardMetricsSection';
import DashboardOverview from './DashboardOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  BarChart3, 
  Brain,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Target,
  Eye,
  MousePointer,
  Users,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AIProviderSettings from '@/components/analytics/AIProviderSettings';
import AnalyticsSummary from '@/components/analytics/AnalyticsSummary';
import LocationStatusBreakdown from '@/components/analytics/LocationStatusBreakdown';
import AnalyticsInsights from '@/components/analytics/AnalyticsInsights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

interface MetaAnalyticsData {
  summary: {
    totalAdSets: number;
    totalCampaigns: number;
    totalAds: number;
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalReach: number;
    totalResults: number;
    costPerResult: number;
    avgCTR: number;
    avgCPM: number;
    avgCPC: number;
    avgFrequency: number;
  };
  topPerformers: {
    bySpend: Array<{
      name: string;
      spend: number;
      ctr: number;
      cpm: number;
    }>;
    byCTR: Array<{
      name: string;
      ctr: number;
      spend: number;
      impressions: number;
    }>;
  };
  campaignPerformance: Array<{
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    adSetsCount: number;
  }>;
  spendDistribution: Array<{
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpm: number;
    cpc: number;
  }>;
  insights: string[];
  recommendations: string[];
  aiSummary: string;
  generatedAt: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

const DashboardContent = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [metaAnalyticsData, setMetaAnalyticsData] = useState<MetaAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
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

  const generateMetaAnalytics = async () => {
    setMetaLoading(true);
    try {
      console.log('Generating Meta spend analytics...');
      
      const { data: result, error } = await supabase.functions.invoke('meta-spend-analytics', {
        body: {
          analysisType: 'overview',
          dateRange: 'last_30d'
        }
      });

      if (error) throw error;

      setMetaAnalyticsData(result);
      toast({
        title: "Meta Analytics Generated",
        description: "OpenAI analysis of Meta ad spend completed successfully"
      });
    } catch (error) {
      console.error('Error generating Meta analytics:', error);
      toast({
        title: "Error",
        description: "Failed to generate Meta spend analytics",
        variant: "destructive"
      });
    } finally {
      setMetaLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toLocaleString();
  };

  // Re-generate analytics when provider changes
  useEffect(() => {
    if (analyticsData && aiProvider !== analyticsData.provider) {
      generateAnalytics();
    }
  }, [aiProvider]);

  useEffect(() => {
    generateAnalytics();
    generateMetaAnalytics();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your business
          </p>
        </div>
      </div>

      {/* Categories Section */}
      <DashboardCategoryTiles />
      
      {/* AI Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI-Powered Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Application Analytics
              </TabsTrigger>
              <TabsTrigger value="meta-spend" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Meta Spend Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="applications" className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Application Insights</h3>
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
                  <Button onClick={generateAnalytics} disabled={loading} size="sm">
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
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
                      <Button onClick={generateAnalytics} className="mt-4" size="sm">
                        Generate Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="meta-spend" className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Meta Spend Analytics</h3>
                  <p className="text-muted-foreground">AI-powered analysis of Facebook/Instagram ad performance</p>
                  {metaAnalyticsData && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        OpenAI Analysis
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Generated {metaAnalyticsData.generatedAt ? new Date(metaAnalyticsData.generatedAt).toLocaleString() : 'recently'}
                      </span>
                    </div>
                  )}
                </div>
                <Button onClick={generateMetaAnalytics} disabled={metaLoading} size="sm">
                  {metaLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>

              {metaLoading && !metaAnalyticsData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
              ) : metaAnalyticsData ? (
                <>
                  {/* AI Summary */}
                  {metaAnalyticsData.aiSummary && (
                    <Alert>
                      <Brain className="h-4 w-4" />
                      <AlertDescription className="font-medium">
                        <strong>AI Summary:</strong> {metaAnalyticsData.aiSummary}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Spend</p>
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(metaAnalyticsData.summary.totalSpend)}
                            </p>
                          </div>
                          <DollarSign className="w-8 h-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Results</p>
                            <p className="text-2xl font-bold text-primary">
                              {metaAnalyticsData.summary.totalResults}
                            </p>
                          </div>
                          <Users className="w-8 h-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Cost per Result</p>
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(metaAnalyticsData.summary.costPerResult)}
                            </p>
                            <Badge variant={metaAnalyticsData.summary.costPerResult < 50 ? "default" : "secondary"} className="text-xs mt-1">
                              {metaAnalyticsData.summary.costPerResult < 50 ? "Excellent" : "High"}
                            </Badge>
                          </div>
                          <Target className="w-8 h-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Impressions</p>
                            <p className="text-2xl font-bold text-primary">
                              {formatNumber(metaAnalyticsData.summary.totalImpressions)}
                            </p>
                          </div>
                          <Eye className="w-8 h-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">CTR</p>
                            <p className="text-2xl font-bold text-primary">
                              {metaAnalyticsData.summary.avgCTR.toFixed(2)}%
                            </p>
                            <Badge variant={metaAnalyticsData.summary.avgCTR > 1.5 ? "default" : "secondary"} className="text-xs mt-1">
                              {metaAnalyticsData.summary.avgCTR > 1.5 ? "Good" : "Needs Improvement"}
                            </Badge>
                          </div>
                          <MousePointer className="w-8 h-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Avg CPC</p>
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(metaAnalyticsData.summary.avgCPC)}
                            </p>
                            <Badge variant={metaAnalyticsData.summary.avgCPC < 2 ? "default" : "secondary"} className="text-xs mt-1">
                              {metaAnalyticsData.summary.avgCPC < 2 ? "Efficient" : "High"}
                            </Badge>
                          </div>
                          <Target className="w-8 h-8 text-orange-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Campaign Performance Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Campaign Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={metaAnalyticsData.campaignPerformance.slice(0, 5)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, name) => [
                                name === 'spend' ? formatCurrency(value as number) : value,
                                name === 'spend' ? 'Spend' : name === 'ctr' ? 'CTR (%)' : 'Clicks'
                              ]}
                            />
                            <Bar dataKey="spend" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Top Performers by CTR */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Top Performers by CTR
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={metaAnalyticsData.topPerformers.byCTR.slice(0, 5)}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="ctr"
                              label={({ name, ctr }) => `${name}: ${ctr.toFixed(2)}%`}
                            >
                              {metaAnalyticsData.topPerformers.byCTR.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value}%`, 'CTR']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* AI Insights and Recommendations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5" />
                          AI Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {metaAnalyticsData.insights.map((insight, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              <p className="text-sm">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          AI Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {metaAnalyticsData.recommendations.map((recommendation, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                              <p className="text-sm">{recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No Meta analytics data available</p>
                      <Button onClick={generateMetaAnalytics} className="mt-4" size="sm">
                        Generate Meta Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DashboardMetricsSection />
      <DashboardOverview />
    </div>
  );
};

export default DashboardContent;
