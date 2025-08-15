import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useJobs } from '@/hooks/useJobs';
import JobsHeader from './JobsHeader';
import JobsFilters from './JobsFilters';
import JobsContent from './JobsContent';
import JobsLoadingState from './JobsLoadingState';
import JobsErrorState from './JobsErrorState';
import JobAnalyticsDialog from '@/components/JobAnalyticsDialog';

type ViewMode = 'grid' | 'table';

const JobsPage = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const { toast } = useToast();
  
  const {
    searchTerm,
    setSearchTerm,
    jobListings,
    filteredJobs,
    isLoading,
    error,
    refetch,
    clientFilter,
    hasClientFilter,
    clearClientFilter
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
    console.log('Opening analytics for job:', job);
    setSelectedJob(job);
    setShowAnalyticsDialog(true);
  };

  if (error) {
    console.error('Jobs page error:', error);
    return <JobsErrorState error={error} onRetry={refetch} />;
  }

  if (isLoading) {
    return <JobsLoadingState />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <JobsHeader
        filteredJobsCount={filteredJobs?.length || 0}
        totalJobsCount={jobListings?.length || 0}
        hasClientFilter={hasClientFilter}
        clientFilter={clientFilter}
        onClearClientFilter={clearClientFilter}
        filteredJobs={filteredJobs || []}
        showUploadDialog={showUploadDialog}
        onShowUploadDialog={setShowUploadDialog}
        onUploadSuccess={handleUploadSuccess}
      />

      <JobsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <JobsContent
        viewMode={viewMode}
        jobs={filteredJobs || []}
        searchTerm={searchTerm}
        hasFilter={hasClientFilter}
        onViewAnalytics={handleViewAnalytics}
        onShowUploadDialog={() => setShowUploadDialog(true)}
      />

      {/* Analytics Dialog */}
      {selectedJob && (
        <JobAnalyticsDialog
          job={selectedJob}
          open={showAnalyticsDialog}
          onOpenChange={setShowAnalyticsDialog}
        />
      )}
    </div>
  );
};

export default JobsPage;