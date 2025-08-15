
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CsvUpload from '@/components/CsvUpload';
import { generateJobsPDF } from '@/utils/jobsPdfGenerator';

interface JobsHeaderProps {
  filteredJobsCount: number;
  totalJobsCount: number;
  hasClientFilter: boolean;
  clientFilter?: string;
  onClearClientFilter: () => void;
  filteredJobs: any[];
  showUploadDialog: boolean;
  onShowUploadDialog: (show: boolean) => void;
  onUploadSuccess: () => void;
}

const JobsHeader: React.FC<JobsHeaderProps> = ({
  filteredJobsCount,
  totalJobsCount,
  hasClientFilter,
  clientFilter,
  onClearClientFilter,
  filteredJobs,
  showUploadDialog,
  onShowUploadDialog,
  onUploadSuccess,
}) => {
  const { toast } = useToast();

  const handleExportPDF = () => {
    try {
      generateJobsPDF(filteredJobs);
      toast({
        title: "PDF Downloaded",
        description: "Job listings report has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">Job Listings</h1>
          <p className="text-muted-foreground mt-1">
            {filteredJobsCount} of {totalJobsCount} listings
            {hasClientFilter && (
              <span className="ml-2">for {clientFilter}</span>
            )}
          </p>
          {totalJobsCount === 0 && (
            <p className="text-sm text-orange-600 mt-1">
              No job listings found. You may need to upload some jobs or check your authentication.
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="flex items-center gap-2"
            disabled={filteredJobsCount === 0}
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          
          <Dialog open={showUploadDialog} onOpenChange={onShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Client Filter Badge */}
      {hasClientFilter && (
        <div>
          <Badge variant="secondary" className="flex items-center gap-2 w-fit">
            Filtered by client: {clientFilter}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
              onClick={onClearClientFilter}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        </div>
      )}
    </div>
  );
};

export default JobsHeader;
