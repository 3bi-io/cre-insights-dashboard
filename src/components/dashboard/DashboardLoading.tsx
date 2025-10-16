
import React from 'react';

const DashboardLoading = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-8 py-6 max-w-7xl">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              ATS Intel - Applicant Tracking System
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Streamline recruitment with AI-powered analytics and automated workflows
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
};

export default DashboardLoading;
