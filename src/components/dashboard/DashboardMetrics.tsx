
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MetricsCard from '@/components/MetricsCard';
import { DollarSign, Users, TrendingUp, Target, Briefcase } from 'lucide-react';

const CR_ENGLAND_ACCOUNT_ID = '435031743763874';

const DashboardMetrics = () => {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      console.log('Fetching dashboard metrics for CR England...');
      
      const [metaSpendData, applicationsData, jobsData] = await Promise.all([
        supabase
          .from('meta_daily_spend')
          .select('spend, impressions, clicks, reach')
          .eq('account_id', CR_ENGLAND_ACCOUNT_ID),
        supabase.from('applications').select('id, source').or('source.eq.fb,source.eq.ig,source.eq.meta'),
        supabase.from('job_listings').select('id').eq('status', 'active')
      ]);
      
      console.log('Meta spend data:', metaSpendData.data?.length);
      console.log('Applications data:', applicationsData.data?.length);
      console.log('Jobs data:', jobsData.data?.length);
      
      const totalSpend = metaSpendData.data?.reduce((sum, item) => sum + Number(item.spend), 0) || 0;
      const totalLeads = applicationsData.data?.length || 0;
      const totalJobs = jobsData.data?.length || 0;
      const totalReach = metaSpendData.data?.reduce((sum, item) => sum + Number(item.reach || 0), 0) || 0;
      const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
      
      return {
        totalSpend,
        totalLeads,
        totalJobs,
        totalReach,
        costPerLead
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
        title="Meta Lead Spend (MTD)"
        value={`$${metrics?.totalSpend.toLocaleString() || '0'}`}
        change="--"
        changeType="neutral"
        icon={DollarSign}
        description="CR England only"
      />
      <MetricsCard
        title="Total Leads Generated"
        value={metrics?.totalLeads.toLocaleString() || '0'}
        change="--"
        changeType="neutral"
        icon={Users}
        description="Facebook/Meta leads"
      />
      <MetricsCard
        title="Active Job Listings"
        value={metrics?.totalJobs.toLocaleString() || '0'}
        change="--"
        changeType="neutral"
        icon={Briefcase}
        description="active listings"
      />
      <MetricsCard
        title="Cost per Lead"
        value={`$${metrics?.costPerLead.toFixed(2) || '0.00'}`}
        change="--"
        changeType="neutral"
        icon={Target}
        description="CR England CPA"
      />
      <MetricsCard
        title="Campaign Reach"
        value={metrics?.totalReach.toLocaleString() || '0'}
        change="--"
        changeType="neutral"
        icon={TrendingUp}
        description="total impressions"
      />
    </div>
  );
};

export default DashboardMetrics;
