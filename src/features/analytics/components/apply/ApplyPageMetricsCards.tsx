import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Users, FileText, TrendingUp } from 'lucide-react';
import type { ApplyPageMetrics } from '../../types/applyAnalytics';

interface ApplyPageMetricsCardsProps {
  metrics: ApplyPageMetrics;
  isLoading?: boolean;
}

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  isLoading?: boolean;
}> = ({ title, value, icon: Icon, subtitle, isLoading }) => (
  <Card className="bg-card border-border">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{value}</p>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const ApplyPageMetricsCards: React.FC<ApplyPageMetricsCardsProps> = ({
  metrics,
  isLoading,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Page Views"
        value={isLoading ? '—' : metrics.pageViews.toLocaleString()}
        icon={Eye}
        isLoading={isLoading}
      />
      <MetricCard
        title="Unique Visitors"
        value={isLoading ? '—' : metrics.uniqueVisitors.toLocaleString()}
        icon={Users}
        isLoading={isLoading}
      />
      <MetricCard
        title="Applications"
        value={isLoading ? '—' : metrics.applications.toLocaleString()}
        icon={FileText}
        isLoading={isLoading}
      />
      <MetricCard
        title="Conversion Rate"
        value={isLoading ? '—' : `${metrics.conversionRate.toFixed(1)}%`}
        icon={TrendingUp}
        subtitle="Visitors → Applications"
        isLoading={isLoading}
      />
    </div>
  );
};

export default ApplyPageMetricsCards;
