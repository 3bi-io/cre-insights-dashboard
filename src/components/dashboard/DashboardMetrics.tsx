
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MetricsCard from '@/components/MetricsCard';
import { DollarSign, Users, TrendingUp, Target, Briefcase } from 'lucide-react';

const DashboardMetrics = () => {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      console.log('Fetching dashboard metrics...');
      
      const [spendData, applicationsData, jobsData, metaSpendData] = await Promise.all([
        supabase.from('daily_spend').select('amount'),
        supabase.from('applications').select('id'),
        supabase.from('job_listings').select('id').eq('status', 'active'),
        supabase.from('meta_daily_spend').select('spend, impressions, clicks, reach')
      ]);
      
      console.log('Spend data:', spendData.data?.length, 'records');
      console.log('Applications data:', applicationsData.data?.length, 'records');
      console.log('Jobs data:', jobsData.data?.length, 'records');
      console.log('Meta spend data:', metaSpendData.data?.length, 'records');
      
      // Calculate traditional spend
      const totalSpend = spendData.data?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0;
      console.log('Traditional spend total:', totalSpend);
      
      // Calculate Meta spend with better error handling
      const metaTotalSpend = metaSpendData.data?.reduce((sum, item) => {
        const spendValue = Number(item.spend || 0);
        console.log('Meta spend item:', item.spend, 'parsed as:', spendValue);
        return sum + spendValue;
      }, 0) || 0;
      console.log('Meta spend total:', metaTotalSpend);
      
      const combinedSpend = totalSpend + metaTotalSpend;
      console.log('Combined spend total:', combinedSpend);
      
      const totalApplications = applicationsData.data?.length || 0;
      const totalJobs = jobsData.data?.length || 0;
      const metaDataPoints = metaSpendData.data?.length || 0;
      const costPerApplication = totalApplications > 0 ? combinedSpend / totalApplications : 0;
      
      // Calculate additional Meta metrics
      const totalImpressions = metaSpendData.data?.reduce((sum, item) => sum + Number(item.impressions || 0), 0) || 0;
      const totalClicks = metaSpendData.data?.reduce((sum, item) => sum + Number(item.clicks || 0), 0) || 0;
      const totalReach = metaSpendData.data?.reduce((sum, item) => sum + Number(item.reach || 0), 0) || 0;
      
      return {
        totalSpend: combinedSpend,
        traditionalSpend: totalSpend,
        metaSpend: metaTotalSpend,
        totalApplications,
        totalJobs,
        costPerApplication,
        metaDataPoints,
        totalImpressions,
        totalClicks,
        totalReach
      };
    },
    // Refresh every 30 seconds to stay in sync
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8 mb-12">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8 mb-12">
      <MetricsCard
        title="Total Spend (MTD)"
        value={`$${(metrics?.totalSpend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        change={metrics?.metaSpend > 0 ? `Meta: $${metrics.metaSpend.toFixed(2)}` : "--"}
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
        value={`$${(metrics?.costPerApplication || 0).toFixed(2)}`}
        change="--"
        changeType="neutral"
        icon={Target}
        description="average cost"
      />
      <MetricsCard
        title="Meta Insights"
        value={metrics?.metaDataPoints.toLocaleString() || '0'}
        change={metrics?.totalImpressions > 0 ? `${(metrics.totalImpressions / 1000).toFixed(1)}k views` : "--"}
        changeType="neutral"
        icon={TrendingUp}
        description="data points"
      />
    </div>
  );
};

export default DashboardMetrics;
