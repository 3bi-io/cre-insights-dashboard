import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import JobsSearch from '@/components/jobs/JobsSearch';
import { 
  Upload, 
  Search, 
  AlertCircle, 
  RefreshCw, 
  Grid3X3, 
  Table, 
  X, 
  Download, 
  Phone, 
  PhoneOff 
} from 'lucide-react';

import { PageLayout } from '@/features/shared';
import CsvUpload from '@/components/CsvUpload';
import { generateJobsPDF } from '@/utils/jobsPdfGenerator';
import { 
  JobTable, 
  JobGrid, 
  JobAnalyticsDialog 
} from '../components';
import { useJobs, useElevenLabsVoice } from '../hooks';

type ViewMode = 'grid' | 'table';

const JobsPage = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const { toast } = useToast();
  const { userRole } = useAuth();
  
  const {
    searchTerm,
    setSearchTerm,
    organizationFilter,
    setOrganizationFilter,
    jobListings,
    filteredJobs,
    isLoading,
    error,
    refetch,
    clientFilter,
    hasClientFilter,
    clearClientFilter,
    showAllOrganizations
  } = useJobs();

  // Fetch organizations for super admin filter
  const { data: organizations } = useQuery({
    queryKey: ['organizations-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: userRole === 'super_admin',
  });

  const {
    isConnected: isVoiceConnected,
    selectedJob: selectedVoiceJob,
    isSpeaking,
    startVoiceApplication,
    endVoiceApplication,
  } = useElevenLabsVoice();

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
    refetch();
    toast({
      title: "Success",
      description: "Jobs uploaded successfully",
    });
  };

  const handleViewAnalytics = (job: any) => {
    setSelectedJob(job);
    setShowAnalyticsDialog(true);
  };

  const handleExportPDF = () => {
    try {
      generateJobsPDF(filteredJobs || []);
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

  const handleVoiceApply = async (job: any) => {
    const displayTitle = job.title || job.job_title || 'Untitled Job';
    const displayLocation = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : null);
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
    
    const jobContext = {
      jobId: job.id,
      jobTitle: displayTitle,
      jobDescription: job.job_summary || job.description || `${displayTitle} position at our company`,
      company: job.clients?.name || job.client || 'C.R. England',
      location: displayLocation || 'Various locations',
      salary: salary || 'Competitive compensation package'
    };

    await startVoiceApplication(jobContext);
  };

  const formatSalary = (min: number | null, max: number | null, type: string | null) => {
    if (!min && !max) return null;
    
    const formatAmount = (amount: number) => {
      if (type === 'hourly') return `$${amount}/hr`;
      if (type === 'yearly') return `$${amount.toLocaleString()}/yr`;
      return `$${amount.toLocaleString()}`;
    };

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)}`;
    }
    return formatAmount(min || max || 0);
  };

  const pageActions = (
    <>
      <Button
        onClick={handleExportPDF}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export PDF
      </Button>
      
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
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
          <CsvUpload onSuccess={handleUploadSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );

  if (error) {
    return (
      <PageLayout title="Job Listings" description="Manage and monitor your job listings across all platforms">
        <div className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-4">Error Loading Jobs</h1>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'There was an error loading your job listings'}
            </p>
            <Button onClick={() => refetch()} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout title="Job Listings" description="Manage and monitor your job listings across all platforms">
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
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Job Listings" 
      description="Manage and monitor your job listings across all platforms"
      actions={pageActions}
    >
      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredJobs?.length || 0} of {jobListings?.length || 0} listings
            {hasClientFilter && (
              <span className="ml-2">for {clientFilter}</span>
            )}
          </p>
          {jobListings?.length === 0 && (
            <p className="text-sm text-orange-600 mt-1">
              No job listings found. You may need to upload some jobs or check your authentication.
            </p>
          )}
        </div>

        {/* Client Filter Badge */}
        {hasClientFilter && (
          <div className="mb-4">
            <Badge variant="secondary" className="flex items-center gap-2 w-fit">
              Filtered by client: {clientFilter}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                onClick={clearClientFilter}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <JobsSearch
            searchTerm={searchTerm}
            organizationFilter={organizationFilter}
            onSearchChange={setSearchTerm}
            onOrganizationChange={setOrganizationFilter}
            showOrganizationFilter={showAllOrganizations}
            organizations={organizations}
          />
          
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-2"
            >
              <Grid3X3 className="w-4 h-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex items-center gap-2"
            >
              <Table className="w-4 h-4" />
              Table
            </Button>
          </div>
        </div>

        {/* Voice Application Status */}
        {isVoiceConnected && selectedVoiceJob && (
          <Card className="mb-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium">Voice Application: {selectedVoiceJob.jobTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {isVoiceConnected ? 'Connected - Speak naturally to apply' : 'Connecting to voice agent...'}
                    </p>
                  </div>
                  {isSpeaking && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">Agent speaking...</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={endVoiceApplication}
                  className="flex items-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  End Call
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content based on view mode */}
        {viewMode === 'table' ? (
          <JobTable 
            jobs={filteredJobs}
            onViewAnalytics={handleViewAnalytics}
            onShowUploadDialog={() => setShowUploadDialog(true)}
            onVoiceApply={handleVoiceApply}
          />
        ) : (
          <JobGrid
            jobs={filteredJobs}
            onViewAnalytics={handleViewAnalytics}
            onShowUploadDialog={() => setShowUploadDialog(true)}
            onVoiceApply={handleVoiceApply}
          />
        )}

        {/* Analytics Dialog */}
        {selectedJob && (
          <JobAnalyticsDialog
            job={selectedJob}
            open={showAnalyticsDialog}
            onOpenChange={setShowAnalyticsDialog}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default JobsPage;