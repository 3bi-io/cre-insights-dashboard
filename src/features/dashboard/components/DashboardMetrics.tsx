import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  BarChart3, 
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { OrganizationMetricsCard } from '@/components/dashboard/organization/OrganizationMetrics';
import { useOrganizationDashboardData } from '@/hooks/useOrganizationDashboardData';

export const DashboardMetrics: React.FC = () => {
  const { data: metrics, isLoading } = useOrganizationDashboardData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <OrganizationMetricsCard
        title="Active Users"
        value={metrics?.activeUsers || 0}
        description="Organization members"
        icon={Users}
      />
      <OrganizationMetricsCard
        title="Active Jobs"
        value={metrics?.activeJobs || 0}
        description="Currently posted"
        icon={BarChart3}
      />
      <OrganizationMetricsCard
        title="Applications"
        value={metrics?.totalApplications || 0}
        description="Total received"
        icon={UserCheck}
      />
      <OrganizationMetricsCard
        title="Monthly Spend"
        value={`$${(metrics?.monthlySpend || 0).toLocaleString()}`}
        description="Advertising budget"
        icon={TrendingUp}
      />
    </div>
  );
};