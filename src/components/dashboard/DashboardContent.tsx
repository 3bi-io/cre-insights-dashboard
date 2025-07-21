
import React from 'react';
import DashboardCategoryTiles from './DashboardCategoryTiles';
import DashboardMetrics from './DashboardMetrics';
import DashboardCharts from './DashboardCharts';
import DashboardOverview from './DashboardOverview';

const DashboardContent = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl space-y-8">
      {/* Category Tiles */}
      <DashboardCategoryTiles />

      {/* Key Metrics */}
      <DashboardMetrics />

      {/* Charts Section */}
      <DashboardCharts />

      {/* Budget and Performance Section */}
      <DashboardOverview />

      {/* Footer spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default DashboardContent;
