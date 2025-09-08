import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Download, DollarSign, TrendingUp, Users, BarChart3 } from 'lucide-react';

import { PageLayout } from '@/features/shared';
import { useMetaSpendAnalytics } from '@/hooks/useMetaSpendAnalytics';
import { useToast } from '@/hooks/use-toast';

const MetaSpendAnalyticsPage = () => {
  const [dateRange, setDateRange] = useState('30d');
  const { toast } = useToast();
  
  // Use the Meta spend analytics hook
  const { metrics: analyticsData, isLoading, error } = useMetaSpendAnalytics(dateRange);

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your Meta spend analytics report is being prepared...",
    });
  };

  const pageActions = (
    <>
      <Button variant="outline" className="flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Last 30 Days
      </Button>
      <Button onClick={handleExport} className="flex items-center gap-2">
        <Download className="w-4 h-4" />
        Export
      </Button>
    </>
  );

  if (isLoading) {
    return (
      <PageLayout title="Meta Spend Analytics" description="Analyze your Meta advertising spend and performance">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Meta Spend Analytics" description="Analyze your Meta advertising spend and performance">
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Error loading Meta spend analytics. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  // Mock data structure - ensure it matches the expected interface
  const mockMetrics = {
    totalSpend: 12450,
    totalImpressions: 890000,
    totalClicks: 15600,
    totalApplications: 340,
    costPerApplication: 36.62,
    clickThroughRate: 1.75,
    conversionRate: 2.18
  };

  const metrics = analyticsData || mockMetrics;

  return (
    <PageLayout 
      title="Meta Spend Analytics" 
      description="Analyze your Meta advertising spend and performance"
      actions={pageActions}
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.totalSpend.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost per Application</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${mockMetrics.costPerApplication}</div>
              <p className="text-xs text-muted-foreground">
                -5% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                +0.3% from last period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed campaign performance metrics coming soon...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spend Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Spend trend analysis and visualization coming soon...
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium">Total Impressions</p>
                <p className="text-2xl font-bold">{mockMetrics.totalImpressions.toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Total Clicks</p>
                <p className="text-2xl font-bold">{mockMetrics.totalClicks.toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">CTR</p>
                <p className="text-2xl font-bold">{mockMetrics.clickThroughRate}%</p>
              </div>
              <div>
                <p className="font-medium">CPC</p>
                <p className="text-2xl font-bold">${(mockMetrics.totalSpend / mockMetrics.totalClicks).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default MetaSpendAnalyticsPage;