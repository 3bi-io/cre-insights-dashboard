import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, PhoneOff, Grid3X3, Table, Search } from 'lucide-react';
import { PageLayout } from '@/features/shared';
import { useJobs, useElevenLabsVoice } from '@/features/jobs/hooks';
import { JobTable, JobGrid } from '@/features/jobs/components';
import { Input } from '@/components/ui/input';

type ViewMode = 'grid' | 'table';

const DemoPage = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    jobListings,
    filteredJobs,
    isLoading,
  } = useJobs();

  const {
    isConnected: isVoiceConnected,
    selectedJob: selectedVoiceJob,
    isSpeaking,
    startVoiceApplication,
    endVoiceApplication,
  } = useElevenLabsVoice();

  const handleVoiceApply = async (job: any) => {
    const displayTitle = job.title || job.job_title || 'Driver Position';
    const displayLocation = job.location || 
                           (job.route_origin_city && job.route_dest_city 
                             ? `${job.route_origin_city} to ${job.route_dest_city}` 
                             : null);
    
    const salary = job.salary_min && job.salary_max 
      ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}` 
      : null;

    const jobContext = {
      jobId: job.id,
      jobTitle: displayTitle,
      jobDescription: job.job_summary || job.description || `${displayTitle} position at our company`,
      company: job.clients?.name || job.client || 'Demo Company',
      location: displayLocation || 'Various locations',
      salary: salary || 'Competitive compensation package'
    };

    await startVoiceApplication(jobContext);
  };

  // Filter jobs by search term
  const searchFilteredJobs = filteredJobs?.filter(job => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      job.title?.toLowerCase().includes(searchLower) ||
      job.job_title?.toLowerCase().includes(searchLower) ||
      job.location?.toLowerCase().includes(searchLower) ||
      job.job_summary?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <PageLayout title="Demo Voice Agent" description="Apply to jobs using voice AI">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Demo Voice Agent" 
      description="Apply to jobs using AI voice conversations"
    >
      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {searchFilteredJobs?.length || 0} of {jobListings?.length || 0} available positions
          </p>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
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
            jobs={searchFilteredJobs}
            onViewAnalytics={() => {}}
            onShowUploadDialog={() => {}}
            onVoiceApply={handleVoiceApply}
          />
        ) : (
          <JobGrid
            jobs={searchFilteredJobs}
            onViewAnalytics={() => {}}
            onShowUploadDialog={() => {}}
            onVoiceApply={handleVoiceApply}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default DemoPage;
