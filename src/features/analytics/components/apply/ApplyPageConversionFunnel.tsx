import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApplyPageMetrics } from '../../types/applyAnalytics';

interface ApplyPageConversionFunnelProps {
  metrics: ApplyPageMetrics;
  isLoading?: boolean;
}

interface FunnelStage {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export const ApplyPageConversionFunnel: React.FC<ApplyPageConversionFunnelProps> = ({
  metrics,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const stages: FunnelStage[] = [
    {
      label: 'Page Views',
      value: metrics.pageViews,
      percentage: 100,
      color: 'bg-primary',
    },
    {
      label: 'Unique Visitors',
      value: metrics.uniqueVisitors,
      percentage: metrics.pageViews > 0 ? (metrics.uniqueVisitors / metrics.pageViews) * 100 : 0,
      color: 'bg-chart-2',
    },
    {
      label: 'Applications',
      value: metrics.applications,
      percentage: metrics.uniqueVisitors > 0 ? (metrics.applications / metrics.uniqueVisitors) * 100 : 0,
      color: 'bg-chart-3',
    },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{stage.label}</span>
                <span className="text-muted-foreground">
                  {stage.value.toLocaleString()} ({stage.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-8 bg-muted rounded-lg overflow-hidden relative">
                <div
                  className={`h-full ${stage.color} transition-all duration-500 ease-out rounded-lg`}
                  style={{ width: `${Math.max(stage.percentage, 5)}%` }}
                />
              </div>
              {index < stages.length - 1 && (
                <div className="flex justify-center py-1">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Overall Conversion</span>
            <span className="text-lg font-bold text-primary">
              {metrics.conversionRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplyPageConversionFunnel;
