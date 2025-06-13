import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Upload } from 'lucide-react';
import CsvUpload from '@/components/CsvUpload';

interface JobsHeaderProps {
  filteredJobsCount: number;
  totalJobsCount: number;
  hasRouteFilter: boolean;
  showUploadDialog: boolean;
  onShowUploadDialog: (show: boolean) => void;
  onUploadSuccess: () => void;
}

const JobsHeader: React.FC<JobsHeaderProps> = ({
  filteredJobsCount,
  totalJobsCount,
  hasRouteFilter,
  showUploadDialog,
  onShowUploadDialog,
  onUploadSuccess
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Job Listings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your job postings across platforms • {filteredJobsCount} of {totalJobsCount} listings
          {hasRouteFilter && (
            <span className="text-primary"> (filtered by route)</span>
          )}
        </p>
      </div>
      <div className="flex gap-2">
        <Dialog open={showUploadDialog} onOpenChange={onShowUploadDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload CSV
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Job Listings</DialogTitle>
            </DialogHeader>
            <CsvUpload onSuccess={onUploadSuccess} />
          </DialogContent>
        </Dialog>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Job Listing
        </Button>
      </div>
    </div>
  );
};

export default JobsHeader;