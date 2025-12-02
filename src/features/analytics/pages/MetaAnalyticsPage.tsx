import React, { useState, lazy, Suspense } from 'react';
import { AdminPageLayout, AdminLoadingSkeleton } from '@/features/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Target, TrendingUp, BarChart3, Download, MousePointer, Eye } from 'lucide-react';
import { useMetaSpendAnalytics } from '@/hooks/useMetaSpendAnalytics';

// Lazy load components
const MetaAdSetReport = lazy(() => import('@/components/analytics/MetaAdSetReport'));

const TabLoader = () => (
  <div className="py-8">
    <AdminLoadingSkeleton variant="cards" />
  </div>
);

const MetaAnalyticsPage = () => {
  const [dateRange, setDateRange] = useState('30d');
  const { metrics, isLoading } = useMetaSpendAnalytics(dateRange);

  const pageActions = (
    <div className="flex items-center gap-2">
      <Select value={dateRange} onValueChange={setDateRange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="last_7d">Last 7 days</SelectItem>
          <SelectItem value="last_30d">Last 30 days</SelectItem>
          <SelectItem value="last_90d">Last 90 days</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    </div>
  );

  return (
    <AdminPageLayout
      title="Meta Analytics"
      description="Detailed spend and performance analysis for Meta advertising campaigns"
      requiredRole="super_admin"
      actions={pageActions}
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.totalSpend?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">Selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalLeads || 0}</div>
              <p className="text-xs text-muted-foreground">From Meta campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost per Lead</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.costPerLead?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">Average CPL</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.conversionRate?.toFixed(2) || '0'}%</div>
              <p className="text-xs text-muted-foreground">Click to lead</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="spend" className="space-y-4">
          <TabsList>
            <TabsTrigger value="spend">Spend Analytics</TabsTrigger>
            <TabsTrigger value="adsets">Ad Set Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="spend" className="space-y-4">
            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalImpressions?.toLocaleString() || '0'}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalClicks?.toLocaleString() || '0'}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CTR</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics?.totalImpressions && metrics?.totalClicks 
                      ? ((metrics.totalClicks / metrics.totalImpressions) * 100).toFixed(2) 
                      : '0'}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            {metrics?.insights && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Insights</CardTitle>
                  <CardDescription>AI-powered analysis of your campaign performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{metrics.insights}</p>
                  {metrics.recommendations && metrics.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recommendations:</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {metrics.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Campaign Performance Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Track spend and performance across all Meta campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Campaign performance charts will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adsets" className="space-y-4">
            <Suspense fallback={<TabLoader />}>
              <MetaAdSetReport />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageLayout>
  );
};

export default MetaAnalyticsPage;
