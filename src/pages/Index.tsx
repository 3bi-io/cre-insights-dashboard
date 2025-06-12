
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MetricsCard from '@/components/MetricsCard';
import SpendChart from '@/components/SpendChart';
import JobPerformanceTable from '@/components/JobPerformanceTable';
import BudgetOverview from '@/components/BudgetOverview';
import PlatformBreakdown from '@/components/PlatformBreakdown';
import { DollarSign, Users, TrendingUp, Target, AlertCircle, CheckCircle } from 'lucide-react';

const Index = () => {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const [spendData, applicationsData] = await Promise.all([
        supabase.from('daily_spend').select('amount'),
        supabase.from('applications').select('id')
      ]);
      
      const totalSpend = spendData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const totalApplications = applicationsData.data?.length || 0;
      const costPerApplication = totalApplications > 0 ? totalSpend / totalApplications : 0;
      
      return {
        totalSpend,
        totalApplications,
        costPerApplication,
        conversionRate: 3.8 // This would need hire data to calculate properly
      };
    },
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: async () => {
      // This would need budget allocation data to calculate properly
      return [
        {
          type: 'warning',
          title: 'Budget Alert',
          message: 'Connect budget allocations to track spending against budgets.',
          current: 0,
          budget: 0
        },
        {
          type: 'success',
          title: 'Performance Update',
          message: 'Set up job categories to track performance metrics.',
          target: 0,
          actual: 0
        }
      ];
    },
  });

  if (metricsLoading || alertsLoading) {
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
            change="+12.5%"
            changeType="positive"
            icon={DollarSign}
            description="vs. last month"
          />
          <MetricsCard
            title="Total Applications"
            value={metrics?.totalApplications.toLocaleString() || '0'}
            change="+8.3%"
            changeType="positive"
            icon={Users}
            description="this month"
          />
          <MetricsCard
            title="Cost per Application"
            value={`$${metrics?.costPerApplication.toFixed(2) || '0.00'}`}
            change="-5.2%"
            changeType="positive"
            icon={Target}
            description="vs. last month"
          />
          <MetricsCard
            title="Conversion Rate"
            value={`${metrics?.conversionRate || 0}%`}
            change="+0.4%"
            changeType="positive"
            icon={TrendingUp}
            description="application to hire"
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

        {/* Alert Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {alerts?.map((alert, index) => (
            <div key={index} className={`${
              alert.type === 'warning' 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-green-50 border-green-200'
            } border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-start gap-4">
                <div className={`${
                  alert.type === 'warning' 
                    ? 'bg-yellow-100' 
                    : 'bg-green-100'
                } p-2 rounded-lg`}>
                  {alert.type === 'warning' ? (
                    <AlertCircle className={`w-6 h-6 ${
                      alert.type === 'warning' ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold text-lg mb-2 ${
                    alert.type === 'warning' ? 'text-yellow-900' : 'text-green-900'
                  }`}>
                    {alert.title}
                  </h4>
                  <p className={`leading-relaxed ${
                    alert.type === 'warning' ? 'text-yellow-800' : 'text-green-800'
                  }`}>
                    {alert.message}
                  </p>
                  {alert.current > 0 && (
                    <div className={`mt-4 pt-4 border-t ${
                      alert.type === 'warning' ? 'border-yellow-200' : 'border-green-200'
                    }`}>
                      <div className={`flex justify-between text-sm ${
                        alert.type === 'warning' ? 'text-yellow-700' : 'text-green-700'
                      }`}>
                        <span>Current: ${alert.current?.toLocaleString()}</span>
                        <span>{alert.type === 'warning' ? 'Budget' : 'Target'}: ${alert.budget || alert.target}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
};

export default Index;
