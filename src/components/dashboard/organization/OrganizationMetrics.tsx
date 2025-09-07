import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: { value: string; positive: boolean; };
}

export const OrganizationMetricsCard = ({ title, value, description, icon: Icon, trend }: MetricsCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className={`h-3 w-3 ${trend.positive ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`text-xs ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.value}
          </span>
        </div>
      )}
    </CardContent>
  </Card>
);