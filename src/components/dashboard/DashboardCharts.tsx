import React from 'react';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import AreaChart from '@/components/charts/AreaChart';
import { useSpendTrendData } from '@/hooks/useSpendTrendData';
import { usePlatformDistributionData } from '@/hooks/usePlatformDistributionData';
import { usePlatformPerformanceData } from '@/hooks/usePlatformPerformanceData';
import { useMonthlyBudgetData } from '@/hooks/useMonthlyBudgetData';

const DashboardCharts = () => {
  const { data: spendTrendData = [], isLoading: spendLoading, error: spendError } = useSpendTrendData();
  const { data: platformDistributionData = [], isLoading: distributionLoading, error: distributionError } = usePlatformDistributionData();
  const { data: platformPerformanceData = [], isLoading: performanceLoading, error: performanceError } = usePlatformPerformanceData();
  const { data: monthlyBudgetData = [], isLoading: budgetLoading, error: budgetError } = useMonthlyBudgetData();

  return (
    <div className="space-y-6">
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
          isLoading={spendLoading}
          error={spendError}
        />

        {/* Platform Distribution Pie Chart */}
        <PieChart
          data={platformDistributionData}
          title="Applications by Platform"
          height={350}
          innerRadius={60}
          outerRadius={120}
          isLoading={distributionLoading}
          error={distributionError}
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
          isLoading={performanceLoading}
          error={performanceError}
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
          isLoading={budgetLoading}
          error={budgetError}
        />
      </div>
    </div>
  );
};

export default DashboardCharts;