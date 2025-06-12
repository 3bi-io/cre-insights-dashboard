
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
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        {/* Key Metrics - Enhanced spacing and layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
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

        {/* Charts Section - Better desktop proportions */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-12">
          <div className="xl:col-span-3">
            <SpendChart />
          </div>
          <div className="xl:col-span-1">
            <PlatformBreakdown />
          </div>
        </div>

        {/* Budget and Performance Section - Improved layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mb-12">
          <div className="xl:col-span-2">
            <BudgetOverview />
          </div>
          <div className="xl:col-span-3">
            <JobPerformanceTable />
          </div>
        </div>

        {/* Alert Section - Better card design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 text-lg mb-2">Budget Alert</h4>
                <p className="text-yellow-800 leading-relaxed">
                  Logistics Positions category is at 95% of monthly budget. Consider reallocating funds or adjusting spend rates.
                </p>
                <div className="mt-4 pt-4 border-t border-yellow-200">
                  <div className="flex justify-between text-sm text-yellow-700">
                    <span>Current: $14,200</span>
                    <span>Budget: $15,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 text-lg mb-2">Performance Update</h4>
                <p className="text-green-800 leading-relaxed">
                  CDL Driver campaigns are performing 18% above target with excellent cost-per-application metrics.
                </p>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Target CPA: $45.00</span>
                    <span>Actual CPA: $37.20</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
};

export default Index;
