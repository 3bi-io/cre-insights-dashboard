
import React from 'react';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import AreaChart from '@/components/charts/AreaChart';
import { useSpendTrendData, usePlatformDistributionData, usePlatformPerformanceData, useMonthlyBudgetData } from '@/hooks/useChartData';

const Index = () => {
  // Fetch real data from Supabase
  const { data: spendTrendData = [], isLoading: spendLoading } = useSpendTrendData();
  const { data: platformDistributionData = [], isLoading: distributionLoading } = usePlatformDistributionData();
  const { data: platformPerformanceData = [], isLoading: performanceLoading } = usePlatformPerformanceData();
  const { data: monthlyBudgetData = [], isLoading: budgetLoading } = useMonthlyBudgetData();

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight break-words">
              C.R. England - Job Advertising Analytics
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
              Monitor spend, track performance, and optimize your job advertising campaigns across all platforms
            </p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl space-y-8">
        {/* Key Metrics */}
        <DashboardMetrics />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spend Trend Line Chart */}
          <LineChart
            data={spendTrendData}
            title="Daily Spend & Applications Trend"
            xKey="date"
            lines={[
              { key: 'spend', stroke: '#3b82f6', name: 'Daily Spend ($)' },
              { key: 'applications', stroke: '#10b981', name: 'Applications' }
            ]}
            height={350}
          />

          {/* Platform Distribution Pie Chart */}
          <PieChart
            data={platformDistributionData}
            title="Applications by Platform"
            height={350}
            innerRadius={60}
            outerRadius={120}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Performance Bar Chart */}
          <BarChart
            data={platformPerformanceData}
            title="Platform Performance Comparison"
            xKey="platform"
            bars={[
              { key: 'applications', fill: '#3b82f6', name: 'Applications' },
              { key: 'cpa', fill: '#ef4444', name: 'Cost Per Application ($)' }
            ]}
            height={350}
          />

          {/* Monthly Budget Area Chart */}
          <AreaChart
            data={monthlyBudgetData}
            title="Monthly Budget vs Actual Spend"
            xKey="month"
            areas={[
              { key: 'budget', fill: '#e5e7eb', stroke: '#6b7280', name: 'Budget' },
              { key: 'spent', fill: '#3b82f680', stroke: '#3b82f6', name: 'Spent' }
            ]}
            height={350}
            stacked={false}
          />
        </div>

        {/* Budget and Performance Section */}
        <DashboardOverview />

        {/* Footer spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
};

export default Index;
