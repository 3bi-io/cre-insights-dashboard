
import React from 'react';
import DashboardCategoryTiles from './DashboardCategoryTiles';
import DashboardMetricsSection from './DashboardMetricsSection';
import DashboardChartsSection from './DashboardChartsSection';
import DashboardOverview from './DashboardOverview';

const DashboardContent = () => {
  return (
    <div className="space-y-8">
      <DashboardCategoryTiles />
      <DashboardMetricsSection />
      <DashboardChartsSection />
      <DashboardOverview />
    </div>
  );
};

export default DashboardContent;
