
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MetricsCard from '@/components/MetricsCard';
import { DollarSign, Users, TrendingUp, Target, Briefcase, Eye, Activity } from 'lucide-react';

const DashboardMetrics = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_dashboard_metrics');
      
      if (data && typeof data === 'object' && data !== null) {
        const metrics = data as any;
        return {
          totalSpend: Number(metrics.totalSpend) || 0,
          totalApplications: Number(metrics.totalApplications) || 0,
          totalJobs: Number(metrics.totalJobs) || 0,
          totalReach: Number(metrics.totalReach) || 0,
          totalImpressions: Number(metrics.totalImpressions) || 0,
          costPerApplication: Number(metrics.costPerApplication) || 0,
          costPerLead: Number(metrics.costPerLead) || 0
        };
      }
      
      return {
        totalSpend: 0,
        totalApplications: 0,
        totalJobs: 0,
        totalReach: 0,
        totalImpressions: 0,
        costPerApplication: 0,
        costPerLead: 0
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-12">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-12">
      <MetricsCard
        title="Total Spend"
        value={`$${metrics?.totalSpend.toLocaleString() || '0'}`}
        change="--"
        changeType="neutral"
        icon={DollarSign}
        description="month to date"
      />
      <MetricsCard
        title="Reach"
        value={metrics?.totalReach.toLocaleString() || '0'}
        change="--"
        changeType="neutral"
        icon={Eye}
        description="total reach"
      />
      <MetricsCard
        title="Impressions"
        value={metrics?.totalImpressions.toLocaleString() || '0'}
        change="--"
        changeType="neutral"
        icon={Activity}
        description="total impressions"
      />
      <MetricsCard
        title="Applications"
        value={metrics?.totalApplications.toLocaleString() || '0'}
        change="--"
        changeType="neutral"
        icon={Users}
        description="total leads"
      />
      <MetricsCard
        title="Cost per Lead"
        value={`$${metrics?.costPerLead?.toFixed(2) || '0.00'}`}
        change="--"
        changeType="neutral"
        icon={Target}
        description="average cost per lead"
      />
    </div>
  );
};

export default DashboardMetrics;
