import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Loader2, 
  TrendingUp, 
  DollarSign, 
  Target, 
  BarChart3, 
  Brain,
  RefreshCw,
  Eye,
  MousePointer,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface MetaAnalyticsData {
  summary: {
    totalAdSets: number;
    totalCampaigns: number;
    totalAds: number;
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalReach: number;
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

const MetaSpendAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<MetaAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateAnalytics = async () => {
    setLoading(true);
    try {
      console.log('Generating Meta spend analytics...');
      
      const { data: result, error } = await supabase.functions.invoke('meta-spend-analytics', {
        body: {
          analysisType: 'overview',
          dateRange: 'last_30d'
        }
      });

      if (error) throw error;

      setAnalyticsData(result);
      toast({
        title: "Analytics Generated",
        description: "OpenAI analysis of Meta ad spend completed successfully"
      });
    } catch (error) {
      console.error('Error generating analytics:', error);
      toast({
        title: "Error",
        description: "Failed to generate Meta spend analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateAnalytics();
  }, []);

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

  if (loading && !analyticsData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meta Spend Analytics</h1>
            <p className="text-muted-foreground">AI-powered analysis of Facebook/Instagram ad performance</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Analyzing Meta ad spend data with OpenAI...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meta Spend Analytics</h1>
          <p className="text-muted-foreground">AI-powered analysis of Facebook/Instagram ad performance</p>
          {analyticsData && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                OpenAI Analysis
              </Badge>
              <span className="text-xs text-muted-foreground">
                Generated {analyticsData.generatedAt ? new Date(analyticsData.generatedAt).toLocaleString() : 'recently'}
              </span>
            </div>
          )}
        </div>
        <Button onClick={generateAnalytics} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh Analysis
        </Button>
      </div>

      {analyticsData && (
        <>
          {/* AI Summary */}
          {analyticsData.aiSummary && (
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription className="font-medium">
                <strong>AI Summary:</strong> {analyticsData.aiSummary}
              </AlertDescription>
            </Alert>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spend</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(analyticsData.summary.totalSpend)}
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
                    <p className="text-sm text-muted-foreground">Impressions</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatNumber(analyticsData.summary.totalImpressions)}
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
                      {analyticsData.summary.avgCTR.toFixed(2)}%
                    </p>
                    <Badge variant={analyticsData.summary.avgCTR > 1.5 ? "default" : "secondary"} className="text-xs mt-1">
                      {analyticsData.summary.avgCTR > 1.5 ? "Good" : "Needs Improvement"}
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
                      {formatCurrency(analyticsData.summary.avgCPC)}
                    </p>
                    <Badge variant={analyticsData.summary.avgCPC < 2 ? "default" : "secondary"} className="text-xs mt-1">
                      {analyticsData.summary.avgCPC < 2 ? "Efficient" : "High"}
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
                  <BarChart data={analyticsData.campaignPerformance.slice(0, 5)}>
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
                      data={analyticsData.topPerformers.byCTR.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="ctr"
                      label={({ name, ctr }) => `${name}: ${ctr.toFixed(2)}%`}
                    >
                      {analyticsData.topPerformers.byCTR.map((entry, index) => (
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
                  {analyticsData.insights.map((insight, index) => (
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
                  {analyticsData.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Ad Sets by Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData.topPerformers.bySpend.map((adSet, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{adSet.name}</p>
                        <p className="text-xs text-muted-foreground">
                          CTR: {adSet.ctr.toFixed(2)}% | CPM: {formatCurrency(adSet.cpm)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(adSet.spend)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Ad Sets by CTR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData.topPerformers.byCTR.map((adSet, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{adSet.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Spend: {formatCurrency(adSet.spend)} | Impressions: {formatNumber(adSet.impressions)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{adSet.ctr.toFixed(2)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default MetaSpendAnalytics;