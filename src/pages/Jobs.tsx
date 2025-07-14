
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useJobs } from '@/hooks/useJobs';

import JobAnalyticsDialog from '@/components/JobAnalyticsDialog';
import JobsHeader from '@/components/jobs/JobsHeader';
import JobsSearch from '@/components/jobs/JobsSearch';
import RouteFilter from '@/components/jobs/RouteFilter';
import JobGrid from '@/components/jobs/JobGrid';
import JobTable from '@/components/jobs/JobTable';

const Jobs = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedJobForAnalytics, setSelectedJobForAnalytics] = useState(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { toast } = useToast();

  const {
    searchTerm,
    setSearchTerm,
    jobListings,
    filteredJobs,
    isLoading,
    error,
    refetch,
    routeFilter,
    hasRouteFilter,
    clearRouteFilter
  } = useJobs();

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
    refetch();
    toast({
      title: "Success",
      description: "Jobs uploaded successfully",
    });
  };

  const handleViewAnalytics = (job: any) => {
    setSelectedJobForAnalytics(job);
  };

  // Show error state if there's an error
  if (error) {
    console.error('Jobs page error:', error);
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Error Loading Jobs</h1>
          <p className="text-muted-foreground mb-4">
            There was an error loading your job listings: {error.message}
          </p>
          <button 
            onClick={() => refetch()} 
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4 min-w-[200px]"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <JobsHeader
        filteredJobsCount={filteredJobs?.length || 0}
        totalJobsCount={jobListings?.length || 0}
        hasRouteFilter={hasRouteFilter}
        showUploadDialog={showUploadDialog}
        onShowUploadDialog={setShowUploadDialog}
        onUploadSuccess={handleUploadSuccess}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {hasRouteFilter && (
        <RouteFilter
          routeFilter={routeFilter}
          onClearFilter={clearRouteFilter}
        />
      )}

      <JobsSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {viewMode === 'grid' ? (
        <JobGrid
          jobs={filteredJobs}
          onViewAnalytics={handleViewAnalytics}
          onShowUploadDialog={() => setShowUploadDialog(true)}
        />
      ) : (
        <JobTable
          jobs={filteredJobs}
          onViewAnalytics={handleViewAnalytics}
          onShowUploadDialog={() => setShowUploadDialog(true)}
        />
      )}

      {/* Analytics Dialog */}
      {selectedJobForAnalytics && (
        <JobAnalyticsDialog
          job={selectedJobForAnalytics}
          open={!!selectedJobForAnalytics}
          onOpenChange={(open) => !open && setSelectedJobForAnalytics(null)}
        />
      )}
    </div>
  );
};

export default Jobs;
