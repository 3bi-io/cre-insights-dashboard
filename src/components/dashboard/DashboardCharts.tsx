
import React from 'react';
import SpendChart from '@/components/SpendChart';
import PlatformBreakdown from '@/components/PlatformBreakdown';

const DashboardCharts = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-12">
      <div className="xl:col-span-3">
        <SpendChart />
      </div>
      <div className="xl:col-span-1">
        <PlatformBreakdown />
      </div>
    </div>
  );
};

export default DashboardCharts;
