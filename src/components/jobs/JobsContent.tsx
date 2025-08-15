import React from 'react';
import JobTable from './JobTable';
import JobGrid from './JobGrid';
import JobsEmptyState from './JobsEmptyState';

type ViewMode = 'grid' | 'table';

interface JobsContentProps {
  viewMode: ViewMode;
  jobs: any[];
  searchTerm: string;
  hasFilter: boolean;
  onViewAnalytics: (job: any) => void;
  onShowUploadDialog: () => void;
}

const JobsContent: React.FC<JobsContentProps> = ({
  viewMode,
  jobs,
  searchTerm,
  hasFilter,
  onViewAnalytics,
  onShowUploadDialog,
}) => {
  if (!jobs || jobs.length === 0) {
    return (
      <JobsEmptyState
        searchTerm={searchTerm}
        hasFilter={hasFilter}
        onShowUploadDialog={onShowUploadDialog}
      />
    );
  }

  if (viewMode === 'table') {
    return (
      <JobTable 
        jobs={jobs}
        onViewAnalytics={onViewAnalytics}
        onShowUploadDialog={onShowUploadDialog}
      />
    );
  }

  return (
    <JobGrid
      jobs={jobs}
      onViewAnalytics={onViewAnalytics}
      onShowUploadDialog={onShowUploadDialog}
    />
  );
};

export default JobsContent;