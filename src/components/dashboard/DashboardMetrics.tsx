
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MetricsCard from '@/components/MetricsCard';
import { DollarSign, Users, TrendingUp, Target, UserCheck } from 'lucide-react';

const DashboardMetrics = () => {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      console.log('Fetching dashboard metrics...');
      
      const [applicationsData, jobsData, metaSpendData, metaCampaignsData] = await Promise.all([
        supabase.from('applications').select('id'),
        supabase.from('job_listings').select('id').eq('status', 'active'),
        supabase.from('meta_daily_spend').select('spend, impressions, clicks, reach'),
        supabase.from('meta_campaigns').select('id, campaign_name, objective').eq('status', 'ACTIVE')
      ]);
      
      console.log('Applications data:', applicationsData.data?.length, 'records');
      console.log('Jobs data:', jobsData.data?.length, 'records');
      console.log('Meta spend data:', metaSpendData.data?.length, 'records');
      console.log('Meta campaigns data:', metaCampaignsData.data?.length, 'records');
      
      // Calculate Meta spend for lead generation
      const totalMetaSpend = metaSpendData.data?.reduce((sum, item) => {
        const spendValue = Number(item.spend || 0);
        return sum + spendValue;
      }, 0) || 0;
      console.log('Total Meta spend:', totalMetaSpend);
      
      const totalApplications = applicationsData.data?.length || 0;
      const totalJobs = jobsData.data?.length || 0;
      const activeCampaigns = metaCampaignsData.data?.length || 0;
      
      // Calculate cost per lead (application)
      const costPerLead = totalApplications > 0 ? totalMetaSpend / totalApplications : 0;
      
      // Calculate additional Meta metrics for lead generation
      const totalImpressions = metaSpendData.data?.reduce((sum, item) => sum + Number(item.impressions || 0), 0) || 0;
      const totalClicks = metaSpendData.data?.reduce((sum, item) => sum + Number(item.clicks || 0), 0) || 0;
      const totalReach = metaSpendData.data?.reduce((sum, item) => sum + Number(item.reach || 0), 0) || 0;
      
      // Calculate click-to-lead conversion rate
      const leadConversionRate = totalClicks > 0 ? (totalApplications / totalClicks) * 100 : 0;
      
      return {
        totalMetaSpend,
        totalApplications,
        totalJobs,
        costPerLead,
        activeCampaigns,
        totalImpressions,
        totalClicks,
        totalReach,
        leadConversionRate
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
        value={`$${(metrics?.totalMetaSpend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        change={metrics?.activeCampaigns > 0 ? `${metrics.activeCampaigns} campaigns` : "--"}
        changeType="neutral"
        icon={DollarSign}
        description="lead generation spend"
      />
      <MetricsCard
        title="Total Leads Generated"
        value={metrics?.totalApplications.toLocaleString() || '0'}
        change={metrics?.leadConversionRate > 0 ? `${metrics.leadConversionRate.toFixed(2)}% CTR` : "--"}
        changeType="neutral"
        icon={UserCheck}
        description="form submissions"
      />
      <MetricsCard
        title="Active Job Listings"
        value={metrics?.totalJobs.toLocaleString() || '0'}
        change="--"
        changeType="neutral"
        icon={Target}
        description="recruiting positions"
      />
      <MetricsCard
        title="Cost per Lead"
        value={`$${(metrics?.costPerLead || 0).toFixed(2)}`}
        change={metrics?.totalClicks > 0 ? `${metrics.totalClicks.toLocaleString()} clicks` : "--"}
        changeType="neutral"
        icon={Users}
        description="lead acquisition cost"
      />
      <MetricsCard
        title="Campaign Reach"
        value={metrics?.totalReach > 0 ? `${(metrics.totalReach / 1000).toFixed(0)}k` : '0'}
        change={metrics?.totalImpressions > 0 ? `${(metrics.totalImpressions / 1000).toFixed(1)}k views` : "--"}
        changeType="neutral"
        icon={TrendingUp}
        description="unique users reached"
      />
    </div>
  );
};

export default DashboardMetrics;
