
import React from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import MetricsCard from '@/components/MetricsCard';
import SpendChart from '@/components/SpendChart';
import JobPerformanceTable from '@/components/JobPerformanceTable';
import BudgetOverview from '@/components/BudgetOverview';
import PlatformBreakdown from '@/components/PlatformBreakdown';
import { DollarSign, Users, TrendingUp, Target, AlertCircle, CheckCircle } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      {/* Key Metrics */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Total Spend (MTD)"
            value="$35,400"
            change="+12.5%"
            changeType="positive"
            icon={DollarSign}
            description="vs. last month"
          />
          <MetricsCard
            title="Total Applications"
            value="847"
            change="+8.3%"
            changeType="positive"
            icon={Users}
            description="this month"
          />
          <MetricsCard
            title="Cost per Application"
            value="$41.80"
            change="-5.2%"
            changeType="positive"
            icon={Target}
            description="vs. last month"
          />
          <MetricsCard
            title="Conversion Rate"
            value="3.8%"
            change="+0.4%"
            changeType="positive"
            icon={TrendingUp}
            description="application to hire"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <SpendChart />
          </div>
          <div className="space-y-6">
            <PlatformBreakdown />
          </div>
        </div>

        {/* Budget and Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <BudgetOverview />
          </div>
          <div className="lg:col-span-2">
            <JobPerformanceTable />
          </div>
        </div>

        {/* Alert Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-800">Budget Alert</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Logistics Positions category is at 95% of monthly budget
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800">Performance Update</h4>
                <p className="text-sm text-green-700 mt-1">
                  CDL Driver campaigns are performing 18% above target
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
