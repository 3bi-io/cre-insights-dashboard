
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import JobCard from './JobCard';

interface JobGridProps {
  jobs: any[] | undefined;
  onViewAnalytics: (job: any) => void;
  onShowUploadDialog: () => void;
}

const JobGrid: React.FC<JobGridProps> = ({ 
  jobs, 
  onViewAnalytics, 
  onShowUploadDialog 
}) => {
  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 px-4">
          <div className="text-gray-500 mb-4">
            <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No job listings found</h3>
            <p className="text-sm sm:text-base">Get started by uploading a CSV file with your job listings.</p>
          </div>
          <div className="flex justify-center">
            <Button variant="outline" onClick={onShowUploadDialog} className="w-full sm:w-auto">
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
          onViewAnalytics={onViewAnalytics}
        />
      ))}
    </div>
  );
};

export default JobGrid;
