
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MetricsCard from '@/components/MetricsCard';
import { DollarSign, Users, TrendingUp, Target, Briefcase } from 'lucide-react';

const DashboardMetrics = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      // For demo purposes, we'll query data without RLS restrictions
      const { data: spendData } = await supabase.rpc('get_total_spend_mtd').catch(() => ({ data: null }));
      const { data: applicationsData } = await supabase.rpc('get_total_applications').catch(() => ({ data: null }));
      const { data: jobsData } = await supabase.rpc('get_total_jobs').catch(() => ({ data: null }));
      
      // Fallback to direct queries if RPC functions don't exist
      const [directSpendData, directJobsData] = await Promise.all([
        supabase
          .from('daily_spend')
          .select('amount, job_listing_id'),
        supabase
          .from('job_listings')
          .select(`
            id,
            applications(id)
          `)
      ]);
      
      const totalSpend = spendData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const totalJobs = jobsData.data?.length || 0;
      const totalApplications = jobsData.data?.reduce((sum, job) => sum + job.applications.length, 0) || 0;
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
