
import React from 'react';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import AreaChart from '@/components/charts/AreaChart';

const Index = () => {
  // Sample data for charts
  const spendTrendData = [
    { date: 'Jan 1', spend: 2400, applications: 24, clicks: 240 },
    { date: 'Jan 2', spend: 1398, applications: 13, clicks: 139 },
    { date: 'Jan 3', spend: 9800, applications: 98, clicks: 980 },
    { date: 'Jan 4', spend: 3908, applications: 39, clicks: 391 },
    { date: 'Jan 5', spend: 4800, applications: 48, clicks: 480 },
    { date: 'Jan 6', spend: 3800, applications: 38, clicks: 380 },
    { date: 'Jan 7', spend: 4300, applications: 43, clicks: 430 },
  ];

  const platformPerformanceData = [
    { platform: 'Indeed', applications: 45, spend: 1200, cpa: 26.67 },
    { platform: 'ZipRecruiter', applications: 32, spend: 890, cpa: 27.81 },
    { platform: 'CareerBuilder', applications: 28, spend: 720, cpa: 25.71 },
    { platform: 'Facebook', applications: 22, spend: 660, cpa: 30.00 },
    { platform: 'LinkedIn', applications: 18, spend: 540, cpa: 30.00 },
  ];

  const platformDistributionData = [
    { name: 'Indeed', value: 45, color: '#0369a1' },
    { name: 'ZipRecruiter', value: 32, color: '#059669' },
    { name: 'CareerBuilder', value: 28, color: '#dc2626' },
    { name: 'Facebook', value: 22, color: '#7c3aed' },
    { name: 'LinkedIn', value: 18, color: '#ea580c' },
  ];

  const monthlyBudgetData = [
    { month: 'Jul', budget: 15000, spent: 12400, remaining: 2600 },
    { month: 'Aug', budget: 15000, spent: 13800, remaining: 1200 },
    { month: 'Sep', budget: 15000, spent: 14200, remaining: 800 },
    { month: 'Oct', budget: 15000, spent: 11900, remaining: 3100 },
    { month: 'Nov', budget: 15000, spent: 13500, remaining: 1500 },
    { month: 'Dec', budget: 15000, spent: 9800, remaining: 5200 },
  ];

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
