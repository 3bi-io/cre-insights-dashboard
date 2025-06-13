import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import JobCard from './JobCard';

interface JobGridProps {
  jobs: any[] | undefined;
  onEditJob: (job: any) => void;
  onViewAnalytics: (job: any) => void;
  onShowUploadDialog: () => void;
}

const JobGrid: React.FC<JobGridProps> = ({ 
  jobs, 
  onEditJob, 
  onViewAnalytics, 
  onShowUploadDialog 
}) => {
  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No job listings found</h3>
            <p>Get started by creating your first job listing or uploading a CSV file.</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button>Create Job Listing</Button>
            <Button variant="outline" onClick={onShowUploadDialog}>
              Upload CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onEditJob={onEditJob}
          onViewAnalytics={onViewAnalytics}
        />
      ))}
    </div>
  );
};

export default JobGrid;