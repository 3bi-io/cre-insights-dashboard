
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MetricsCard from '@/components/MetricsCard';
import { DollarSign, Users, TrendingUp, Target, Briefcase } from 'lucide-react';

const DashboardMetrics = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const [spendData, applicationsData, jobsData] = await Promise.all([
        supabase.from('daily_spend').select('amount'),
        supabase.from('applications').select('id'),
        supabase.from('job_listings').select('id')
      ]);
      
      const totalSpend = spendData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const totalApplications = applicationsData.data?.length || 0;
      const totalJobs = jobsData.data?.length || 0;
      const costPerApplication = totalApplications > 0 ? totalSpend / totalApplications : 0;
      
      return {
        totalSpend,
        totalApplications,
        totalJobs,
        costPerApplication
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
      <MetricsCard
        title="Total Spend (MTD)"
        value={`$${metrics?.totalSpend.toLocaleString() || '0'}`}
        change="--"
        changeType="neutral"
        icon={DollarSign}
        description="month to date"
      />
      <MetricsCard
        title="Total Applications"
        value={metrics?.totalApplications.toLocaleString() || '0'}
        change="--"
        changeType="neutral"
        icon={Users}
        description="all time"
      />
      <MetricsCard
        title="Total Job Listings"
        value={metrics?.totalJobs.toLocaleString() || '0'}
        change="--"
        changeType="neutral"
        icon={Briefcase}
        description="active listings"
      />
      <MetricsCard
        title="Cost per Application"
        value={`$${metrics?.costPerApplication.toFixed(2) || '0.00'}`}
        change="--"
        changeType="neutral"
        icon={Target}
        description="average cost"
      />
    </div>
  );
};

export default DashboardMetrics;
