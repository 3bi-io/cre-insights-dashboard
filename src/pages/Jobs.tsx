import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Search, MapPin, DollarSign, Clock, Eye, Plus, AlertCircle, RefreshCw, Grid3X3, Table, X, Download } from 'lucide-react';
import { useJobs } from '@/hooks/useJobs';
import CsvUpload from '@/components/CsvUpload';
import JobTable from '@/components/jobs/JobTable';
import JobAnalyticsDialog from '@/components/JobAnalyticsDialog';
import { generateJobsPDF } from '@/utils/jobsPdfGenerator';

type ViewMode = 'grid' | 'table';

const Jobs = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    console.error('Jobs page error:', error);
    return (
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
    );
  }

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Job Listings</h1>
          <p className="text-muted-foreground mt-1">
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
        
        <div className="flex items-center gap-2">
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
        </div>
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

      {/* Search and View Selector */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search jobs by title, location, platform..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
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

      {/* Content based on view mode */}
      {viewMode === 'table' ? (
        <JobTable 
          jobs={filteredJobs}
          onViewAnalytics={handleViewAnalytics}
          onShowUploadDialog={() => setShowUploadDialog(true)}
        />
      ) : (
        /* Jobs Grid */
        !filteredJobs || filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No job listings found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || hasClientFilter ? 'Try adjusting your search terms or filters.' : 'Get started by uploading a CSV file with your job listings.'}
              </p>
              {!searchTerm && !hasClientFilter && (
                <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
                  Upload CSV
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const displayTitle = job.title || job.job_title || 'Untitled Job';
              const displayLocation = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : null);
              const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
              
              return (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-tight">{displayTitle}</CardTitle>
                      <Badge className={getStatusColor(job.status || 'active')}>
                        {job.status || 'active'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {job.job_platform_associations?.map(assoc => assoc.platforms?.name).join(', ') || 'No platforms'} • {job.job_categories?.name}
                    </div>
                    {job.job_id && (
                      <div className="text-xs text-muted-foreground font-mono">
                        ID: {job.job_id}
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {(job.clients?.name || job.client) && (
                      <div className="text-sm font-medium text-primary">
                        {job.clients?.name || job.client}
                      </div>
                    )}
                    
                    {displayLocation && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{displayLocation}</span>
                      </div>
                    )}

                    {salary && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span>{salary}</span>
                      </div>
                    )}

                    {job.dest_city && job.dest_state && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Destination:</span> {job.dest_city}, {job.dest_state}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => handleViewAnalytics(job)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
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
  );
};

export default Jobs;
