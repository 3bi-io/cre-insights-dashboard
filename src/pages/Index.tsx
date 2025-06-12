
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MetricsCard from '@/components/MetricsCard';
import SpendChart from '@/components/SpendChart';
import JobPerformanceTable from '@/components/JobPerformanceTable';
import BudgetOverview from '@/components/BudgetOverview';
import PlatformBreakdown from '@/components/PlatformBreakdown';
import { DollarSign, Users, TrendingUp, Target, AlertCircle, CheckCircle, Briefcase } from 'lucide-react';

const Index = () => {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
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

  if (metricsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border shadow-sm">
          <div className="container mx-auto px-8 py-6 max-w-7xl">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                C.R. England - Job Advertising Analytics
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Monitor spend, track performance, and optimize your job advertising campaigns across all platforms
              </p>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-8 py-8 max-w-7xl">
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              <div className="xl:col-span-3 h-80 bg-muted rounded-xl"></div>
              <div className="xl:col-span-1 h-80 bg-muted rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-8 py-6 max-w-7xl">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              C.R. England - Job Advertising Analytics
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Monitor spend, track performance, and optimize your job advertising campaigns across all platforms
            </p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        {/* Key Metrics */}
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-12">
          <div className="xl:col-span-3">
            <SpendChart />
          </div>
          <div className="xl:col-span-1">
            <PlatformBreakdown />
          </div>
        </div>

        {/* Budget and Performance Section */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mb-12">
          <div className="xl:col-span-2">
            <BudgetOverview />
          </div>
          <div className="xl:col-span-3">
            <JobPerformanceTable />
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
};

export default Index;
