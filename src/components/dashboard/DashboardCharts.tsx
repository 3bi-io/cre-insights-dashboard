
import React from 'react';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import AreaChart from '@/components/charts/AreaChart';
import { useSpendTrendData } from '@/hooks/useSpendTrendData';
import { usePlatformPerformanceData } from '@/hooks/usePlatformPerformanceData';
import { useMonthlyBudgetData } from '@/hooks/useMonthlyBudgetData';
import { useJobVolumeData } from '@/hooks/useJobVolumeData';
import { useMetaAnalyticsData } from '@/hooks/useMetaAnalyticsData';

const DashboardCharts = () => {
  const { data: spendTrendData = [], isLoading: spendLoading, error: spendError } = useSpendTrendData();
  const { data: platformPerformanceData = [], isLoading: performanceLoading, error: performanceError } = usePlatformPerformanceData();
  const { data: monthlyBudgetData = [], isLoading: budgetLoading, error: budgetError } = useMonthlyBudgetData();
  const { data: jobVolumeData = [], isLoading: jobVolumeLoading, error: jobVolumeError } = useJobVolumeData();
  const { data: metaAnalytics, isLoading: metaLoading, error: metaError } = useMetaAnalyticsData();

  return (
    <div className="space-y-6">
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta AI-Powered Spend Trend Line Chart */}
        <LineChart
          data={metaAnalytics?.dailyTrendData || spendTrendData}
          title="Meta AI-Enhanced Daily Spend & Applications"
          xKey="date"
          lines={[
            { key: 'spend', stroke: 'hsl(var(--primary))', name: 'Daily Spend ($)' },
            { key: 'applications', stroke: 'hsl(var(--green))', name: 'Applications' }
          ]}
          height={350}
          isLoading={metaLoading || spendLoading}
          error={metaError || spendError}
        />

        {/* Job Volume Bar Chart */}
        <BarChart
          data={jobVolumeData}
          title="Job Volume by Day"
          xKey="date"
          bars={[
            { key: 'active', fill: '#10b981', name: 'Active Jobs' },
            { key: 'inactive', fill: '#f59e0b', name: 'Inactive Jobs' }
          ]}
          height={350}
          stacked={true}
          isLoading={jobVolumeLoading}
          error={jobVolumeError}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* AI-Enhanced Platform Performance Bar Chart */}
        <BarChart
          data={metaAnalytics?.platformPerformanceData || platformPerformanceData}
          title="AI-Enhanced Platform Performance"
          xKey="platform"
          bars={[
            { key: 'applications', fill: 'hsl(var(--primary))', name: 'Applications' },
            { key: 'cpa', fill: 'hsl(var(--destructive))', name: 'Cost Per Application ($)' }
          ]}
          height={350}
          isLoading={metaLoading || performanceLoading}
          error={metaError || performanceError}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
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
          isLoading={budgetLoading}
          error={budgetError}
        />
      </div>
    </div>
  );
};

export default DashboardCharts;
