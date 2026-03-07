import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import JobsSearch from '@/components/jobs/JobsSearch';
import { Upload, AlertCircle, RefreshCw, Download, Link2 } from 'lucide-react';
import { PageLayout } from '@/features/shared';
import CsvUpload from '@/components/CsvUpload';
import { generateJobsPDF } from '@/utils/jobsPdfGenerator';
import { 
  JobTable, 
  JobGrid, 
  JobAnalyticsDialog,
  VoiceApplicationStatus,
  JobsViewToggle,
  JobsClientFilter
} from '../components';
import { useJobs, useElevenLabsVoice } from '../hooks';
import { ExportJobUrlsButton } from '@/components/admin/ExportJobUrlsButton';

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
      salary: salary || 'Competitive compensation package',
      organizationId: job.organization_id || undefined,
      clientId: job.client_id || undefined,
    };

    await startVoiceApplication(jobContext);
  };

  const pageActions = (
    <>
      <ExportJobUrlsButton variant="outline" size="default" />
      
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
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
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
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-lg"></div>
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
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto pb-20 md:pb-6">
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
        <JobsClientFilter
          clientFilter={clientFilter}
          hasClientFilter={hasClientFilter}
          onClearFilter={clearClientFilter}
        />

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <JobsSearch
            searchTerm={searchTerm}
            organizationFilter={organizationFilter}
            onSearchChange={setSearchTerm}
            onOrganizationChange={setOrganizationFilter}
            showOrganizationFilter={showAllOrganizations}
            organizations={organizations}
          />
          
          <JobsViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        {/* Voice Application Status */}
        <VoiceApplicationStatus
          isConnected={isVoiceConnected}
          selectedJob={selectedVoiceJob}
          isSpeaking={isSpeaking}
          onEndCall={endVoiceApplication}
        />

        {/* Content based on view mode */}
        {viewMode === 'table' ? (
          <JobTable 
            jobs={filteredJobs}
            onViewAnalytics={handleViewAnalytics}
            onShowUploadDialog={() => setShowUploadDialog(true)}
            onVoiceApply={handleVoiceApply}
            onRefresh={refetch}
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
