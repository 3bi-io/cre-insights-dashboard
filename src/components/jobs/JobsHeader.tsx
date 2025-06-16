
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
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
    <div className="flex flex-col gap-4 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">Job Listings</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage your job postings across platforms • {filteredJobsCount} of {totalJobsCount} listings
            {hasRouteFilter && (
              <span className="text-primary"> (filtered by route)</span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={showUploadDialog} onOpenChange={onShowUploadDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 flex-1 sm:flex-none">
                <Upload className="w-4 h-4" />
                <span className="hidden xs:inline">Upload CSV</span>
                <span className="xs:hidden">Upload</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Job Listings</DialogTitle>
              </DialogHeader>
              <CsvUpload onSuccess={onUploadSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default JobsHeader;
