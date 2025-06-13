
import React from 'react';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardOverview from '@/components/dashboard/DashboardOverview';

const Index = () => {
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
        <DashboardMetrics />

        {/* Budget and Performance Section */}
        <DashboardOverview />

        {/* Footer spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
};

export default Index;
