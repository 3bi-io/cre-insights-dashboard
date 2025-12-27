import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApplyPageAnalytics } from '../hooks/useApplyPageAnalytics';
import {
  ApplyPageMetricsCards,
  ApplyPageTrendChart,
  ApplyPageDeviceChart,
  ApplyPageTrafficSources,
  ApplyPageConversionFunnel,
  ApplyPageTopReferrers,
} from '../components/apply';
import type { DateRange } from '../types/applyAnalytics';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const dateRangeOptions: { label: string; value: DateRange }[] = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
];

export const ApplyPageAnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const { data, isLoading, error } = useApplyPageAnalytics(dateRange);

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load apply page analytics. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const emptyMetrics = {
    pageViews: 0,
    uniqueVisitors: 0,
    applications: 0,
    conversionRate: 0,
    avgTimeOnPage: 0,
    bounceRate: 0,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Apply Page Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track visitor behavior and conversions on your application pages
          </p>
        </div>
        <div className="flex gap-2">
          {dateRangeOptions.map((option) => (
            <Button
              key={option.value}
              variant={dateRange === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <ApplyPageMetricsCards
        metrics={data?.metrics || emptyMetrics}
        isLoading={isLoading}
      />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApplyPageTrendChart
          data={data?.dailyTrend || []}
          isLoading={isLoading}
        />
        <ApplyPageConversionFunnel
          metrics={data?.metrics || emptyMetrics}
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ApplyPageDeviceChart
          data={data?.deviceBreakdown || []}
          isLoading={isLoading}
        />
        <ApplyPageTrafficSources
          data={data?.trafficSources || []}
          isLoading={isLoading}
        />
        <ApplyPageTopReferrers
          data={data?.topReferrers || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ApplyPageAnalyticsPage;
