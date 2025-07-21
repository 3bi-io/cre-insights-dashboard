
import React from 'react';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import DashboardCategoryTiles from '@/components/dashboard/DashboardCategoryTiles';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight break-words">
              C.R. England - Job Advertising Analytics
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
              Monitor spend, track performance, and optimize your job advertising campaigns across all platforms
            </p>
          </div>
        </div>
      </div>
      
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
    </div>
  );
};

export default Index;
