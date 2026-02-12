import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, CheckCircle, Gauge, Clock, Briefcase } from 'lucide-react';
import type { PortfolioSummary } from '../../types/clientAnalytics.types';

interface Props {
  summary: PortfolioSummary;
  isLoading: boolean;
}

const kpis = [
  { key: 'totalApplications' as const, label: 'Total Applications', icon: Users, format: (v: number) => v.toLocaleString() },
  { key: 'overallDeliveryRate' as const, label: 'ATS Delivery Rate', icon: CheckCircle, format: (v: number) => `${v}%` },
  { key: 'avgReadinessScore' as const, label: 'Avg Readiness', icon: Gauge, format: (v: number) => `${v}/100` },
  { key: 'avgSlaHours' as const, label: 'Avg Response Time', icon: Clock, format: (v: number) => v > 0 ? `${v}h` : 'N/A' },
  { key: 'activeJobs' as const, label: 'Active Jobs', icon: Briefcase, format: (v: number) => v.toLocaleString() },
];

export const ClientAnalyticsSummary: React.FC<Props> = ({ summary, isLoading }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
    {kpis.map(({ key, label, icon: Icon, format }) => (
      <Card key={key}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{format(summary[key])}</div>
          )}
        </CardContent>
      </Card>
    ))}
  </div>
);
