
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useJobs } from '@/hooks/useJobs';
import JobEditDialog from '@/components/JobEditDialog';
import JobAnalyticsDialog from '@/components/JobAnalyticsDialog';
import JobsHeader from '@/components/jobs/JobsHeader';
import JobsSearch from '@/components/jobs/JobsSearch';
import RouteFilter from '@/components/jobs/RouteFilter';
import JobGrid from '@/components/jobs/JobGrid';

const Jobs = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedJobForEdit, setSelectedJobForEdit] = useState(null);
  const [selectedJobForAnalytics, setSelectedJobForAnalytics] = useState(null);
  const { toast } = useToast();

  const {
    searchTerm,
    setSearchTerm,
    jobListings,
    filteredJobs,
    isLoading,
    refetch,
    routeFilter,
    hasRouteFilter,
    clearRouteFilter
  } = useJobs();

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
    refetch();
  };

  const handleEditJob = (job: any) => {
    setSelectedJobForEdit(job);
  };

  const handleViewAnalytics = (job: any) => {
    setSelectedJobForAnalytics(job);
  };

  const handleEditSuccess = () => {
    setSelectedJobForEdit(null);
    refetch();
    toast({
      title: "Job updated",
      description: "Job listing has been updated successfully.",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <JobsHeader
        filteredJobsCount={filteredJobs?.length || 0}
        totalJobsCount={jobListings?.length || 0}
        hasRouteFilter={hasRouteFilter}
        showUploadDialog={showUploadDialog}
        onShowUploadDialog={setShowUploadDialog}
        onUploadSuccess={handleUploadSuccess}
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

      <JobGrid
        jobs={filteredJobs}
        onEditJob={handleEditJob}
        onViewAnalytics={handleViewAnalytics}
        onShowUploadDialog={() => setShowUploadDialog(true)}
      />

      {/* Edit Job Dialog */}
      {selectedJobForEdit && (
        <JobEditDialog
          job={selectedJobForEdit}
          open={!!selectedJobForEdit}
          onOpenChange={(open) => !open && setSelectedJobForEdit(null)}
          onSuccess={handleEditSuccess}
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
