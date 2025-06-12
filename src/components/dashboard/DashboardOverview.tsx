
import React from 'react';
import BudgetOverview from '@/components/BudgetOverview';
import JobPerformanceTable from '@/components/JobPerformanceTable';

const DashboardOverview = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mb-12">
      <div className="xl:col-span-2">
        <BudgetOverview />
      </div>
      <div className="xl:col-span-3">
        <JobPerformanceTable />
      </div>
    </div>
  );
};

export default DashboardOverview;
