import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MetricsCard from '@/components/MetricsCard';
import DateRangeFilter from '@/components/platforms/DateRangeFilter';
import { DollarSign, Users, TrendingUp, Target, Briefcase } from 'lucide-react';
import { useCostPerLead } from '@/hooks/useCostPerLead';
const CR_ENGLAND_ACCOUNT_ID = '435031743763874';
const DashboardMetrics = () => {
  const [dateRange, setDateRange] = useState('last_30d');
  const {
    data: costData
  } = useCostPerLead(dateRange);
  const {
    data: metrics,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['dashboard-metrics', dateRange],
    queryFn: async () => {
      console.log('Fetching dashboard metrics for CR England...');
      let startDate: string;
      const today = new Date();
      switch (dateRange) {
        case 'last_7d':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last_14d':
          startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last_60d':
          startDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last_90d':
          startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'this_month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          break;
        case 'last_month':
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          startDate = lastMonth.toISOString().split('T')[0];
          break;
        default:
          // last_30d
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      const [metaSpendData, applicationsData, jobsData] = await Promise.all([supabase.from('meta_daily_spend').select('spend, impressions, clicks, reach').eq('account_id', CR_ENGLAND_ACCOUNT_ID).gte('date_start', startDate), supabase.from('applications').select('id, source, applied_at').or('source.eq.fb,source.eq.ig,source.eq.meta,source.eq.facebook,source.eq.instagram').gte('applied_at', startDate), supabase.from('job_listings').select('id').eq('status', 'active')]);
      console.log('Meta spend data:', metaSpendData.data?.length);
      console.log('Applications data:', applicationsData.data?.length);
      console.log('Jobs data:', jobsData.data?.length);
      const totalSpend = metaSpendData.data?.reduce((sum, item) => sum + Number(item.spend), 0) || 0;
      const totalLeads = applicationsData.data?.length || 0;
      const totalJobs = jobsData.data?.length || 0;
      const totalReach = metaSpendData.data?.reduce((sum, item) => sum + Number(item.reach || 0), 0) || 0;
      return {
        totalSpend,
        totalLeads,
        totalJobs,
        totalReach
      };
    },
    // Refresh every 30 seconds to stay in sync
    refetchInterval: 30000
  });
  if (isLoading) {
    return <div className="space-y-4">
        <div className="flex justify-end">
          <div className="h-10 w-40 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8">
          {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>)}
        </div>
      </div>;
  }
  const costPerLead = costData?.costPerLead || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <MetricsCard
          title="Total Spend"
          value={`$${metrics?.totalSpend?.toLocaleString() || '0'}`}
          change="+12.3%"
          changeType="positive"
          icon={DollarSign}
          description="Meta advertising spend"
        />
        
        <MetricsCard
          title="Total Leads"
          value={metrics?.totalLeads?.toLocaleString() || '0'}
          change="+8.7%"
          changeType="positive"
          icon={Users}
          description="Applications received"
        />
        
        <MetricsCard
          title="Cost Per Lead"
          value={`$${costPerLead.toFixed(2)}`}
          change="-5.2%"
          changeType="positive"
          icon={Target}
          description="Average cost per application"
        />
        
        <MetricsCard
          title="Total Reach"
          value={metrics?.totalReach?.toLocaleString() || '0'}
          change="+15.1%"
          changeType="positive"
          icon={TrendingUp}
          description="People reached on Meta"
        />
        
        <MetricsCard
          title="Active Jobs"
          value={metrics?.totalJobs?.toLocaleString() || '0'}
          change="+2.4%"
          changeType="positive"
          icon={Briefcase}
          description="Currently active positions"
        />
      </div>
    </div>
  );
};
export default DashboardMetrics;