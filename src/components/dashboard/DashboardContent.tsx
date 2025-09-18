
import React, { useState, useEffect } from 'react';
import DashboardCategoryTiles from './DashboardCategoryTiles';
import DashboardMetricsSection from './DashboardMetricsSection';
import { useAuth } from '@/hooks/useAuth';
import { getActualAccountId } from '@/utils/metaAccountAlias';

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
  Sparkles,
  Bot,
  MapPin,
  Briefcase,
  UserCheck,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AIProviderSettings from '@/components/analytics/AIProviderSettings';
import AnalyticsSummary from '@/components/analytics/AnalyticsSummary';
import LocationStatusBreakdown from '@/components/analytics/LocationStatusBreakdown';
import AnalyticsInsights from '@/components/analytics/AnalyticsInsights';
import DetailedInsights from '@/components/analytics/DetailedInsights';
import ComparisonMetrics from '@/components/analytics/ComparisonMetrics';
import DateRangeFilter from '@/components/platforms/DateRangeFilter';
import MetricsCard from '@/components/MetricsCard';
import { useCostPerLead } from '@/hooks/useCostPerLead';
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
// Display account ID (alias)  
const CR_ENGLAND_DISPLAY_ID = '897639563274136';
// Actual account ID for data queries
const CR_ENGLAND_ACTUAL_ID = getActualAccountId(CR_ENGLAND_DISPLAY_ID);

const DashboardContent = () => {
  const { organization } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [metaAnalyticsData, setMetaAnalyticsData] = useState<MetaAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<'basic' | 'openai' | 'anthropic'>('basic');
  const [totalApplications, setTotalApplications] = useState<number>(0);
  const [dateRange, setDateRange] = useState('last_30d');
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalSpend: 0,
    totalImpressions: 0,
    totalLeads: 0,
    totalJobs: 0,
    totalReach: 0
  });
  const { toast } = useToast();

  // Get cost per lead data using the selected date range
  const { data: costData } = useCostPerLead(dateRange);

  // Fetch dashboard metrics based on date range
  const fetchDashboardMetrics = async (selectedDateRange: string) => {
    let startDate: string;
    const today = new Date();
    
    switch (selectedDateRange) {
      case 'last_7d':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last_14d':
        startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last_60d':
        startDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last_90d':
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'this_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'last_month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        startDate = lastMonth.toISOString().split('T')[0];
        break;
      default:
        // last_30d
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    const [metaSpendData, applicationsData, jobsData] = await Promise.all([
      supabase.from('meta_daily_spend')
        .select('spend, impressions, clicks, reach')
        .eq('organization_id', organization?.id)
        .gte('date_start', startDate),
      supabase.from('applications')
        .select('id, source, applied_at, job_listings!inner(organization_id)')
        .or('source.eq.fb,source.eq.ig,source.eq.meta,source.eq.facebook,source.eq.instagram')
        .eq('job_listings.organization_id', organization?.id)
        .gte('applied_at', startDate),
      supabase.from('job_listings')
        .select('id')
        .eq('status', 'active')
        .eq('organization_id', organization?.id)
    ]);

    const totalSpend = metaSpendData.data?.reduce((sum, item) => sum + Number(item.spend), 0) || 0;
    const totalImpressions = metaSpendData.data?.reduce((sum, item) => sum + Number(item.impressions || 0), 0) || 0;
    const totalLeads = applicationsData.data?.length || 0;
    const totalJobs = jobsData.data?.length || 0;
    const totalReach = metaSpendData.data?.reduce((sum, item) => sum + Number(item.reach || 0), 0) || 0;

    const metrics = {
      totalSpend,
      totalImpressions,
      totalLeads,
      totalJobs,
      totalReach
    };

    setDashboardMetrics(metrics);
    return metrics;
  };

  const generateAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date filter based on selected date range
      const today = new Date();
      let startDate: string;
      
      switch (dateRange) {
        case 'last_7d':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last_14d':
          startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last_60d':
          startDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last_90d':
          startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'this_month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          break;
        case 'last_month':
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          startDate = lastMonth.toISOString().split('T')[0];
          break;
        default:
          // last_30d
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      // Fetch applications data filtered by date range and organization
      const { data: applications, error } = await supabase
        .from('applications')
        .select('*, job_listings!inner(organization_id)')
        .eq('job_listings.organization_id', organization?.id)
        .gte('applied_at', startDate);
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
          dateRange: dateRange
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

  // Re-generate analytics when provider or date range changes
  useEffect(() => {
    if (analyticsData && (aiProvider !== analyticsData.provider)) {
      generateAnalytics();
    }
  }, [aiProvider]);

  // Re-generate analytics when date range changes
  useEffect(() => {
    generateAnalytics();
    generateMetaAnalytics();
    // Also refresh the dashboard metrics for the cards
    fetchDashboardMetrics(dateRange);
  }, [dateRange]);

  useEffect(() => {
    generateAnalytics();
    generateMetaAnalytics();
    fetchDashboardMetrics(dateRange);
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
          <Tabs defaultValue="meta-spend" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="meta-spend" className="flex items-center gap-2">
                Meta Spend Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="meta-spend" className="mt-6 space-y-6">
              {/* Date Range Filter */}
              <div className="flex justify-end">
                <DateRangeFilter value={dateRange} onChange={setDateRange} />
              </div>

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
                              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
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
                              <div className="w-2 h-2 bg-secondary-foreground rounded-full mt-2 flex-shrink-0" />
                              <p className="text-sm">{recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* CR England Ad Account Info */}
                  <div className="bg-card border rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">CR England Ad Account:</h4>
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            cre-25-0801
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ID: 897639563274136 • USD • America/Chicago
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-muted-foreground" />
                        <UserCheck className="w-5 h-5 text-muted-foreground" />
                        <Zap className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
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
    </div>
  );
};

export default DashboardContent;
