
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Filter, MoreHorizontal, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CsvUpload from '@/components/CsvUpload';
import JobEditDialog from '@/components/JobEditDialog';
import JobAnalyticsDialog from '@/components/JobAnalyticsDialog';

const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedJobForEdit, setSelectedJobForEdit] = useState(null);
  const [selectedJobForAnalytics, setSelectedJobForAnalytics] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Get route filter parameters from URL
  const routeFilter = {
    origin_city: searchParams.get('origin_city'),
    origin_state: searchParams.get('origin_state'),
    dest_city: searchParams.get('dest_city'),
    dest_state: searchParams.get('dest_state')
  };

  const hasRouteFilter = Object.values(routeFilter).some(value => value !== null);

  const { data: jobListings, isLoading, refetch } = useQuery({
    queryKey: ['job-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          *,
          platforms:platform_id(name),
          job_categories:category_id(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredJobs = jobListings?.filter(job => {
    // Apply text search filter
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply route filter if present
    const matchesRoute = !hasRouteFilter || (
      job.city === routeFilter.origin_city &&
      job.state === routeFilter.origin_state &&
      job.dest_city === routeFilter.dest_city &&
      job.dest_state === routeFilter.dest_state
    );
    
    return matchesSearch && matchesRoute;
  });

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

  const clearRouteFilter = () => {
    setSearchParams({});
  };

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
    refetch();
  };

  const handleEditJob = (job: any) => {
    setSelectedJobForEdit(job);
  };

  const handleViewAnalytics = (job: any) => {
    setSelectedJobForAnalytics(job);
  };

  const handleEditSuccess = () => {
    setSelectedJobForEdit(null);
    refetch();
    toast({
      title: "Job updated",
      description: "Job listing has been updated successfully.",
    });
  };

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Listings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your job postings across platforms • {filteredJobs?.length || 0} of {jobListings?.length || 0} listings
            {hasRouteFilter && (
              <span className="text-primary"> (filtered by route)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
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
              <CsvUpload onSuccess={handleUploadSuccess} />
            </DialogContent>
          </Dialog>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Job Listing
          </Button>
        </div>
      </div>

      {/* Route Filter Display */}
      {hasRouteFilter && (
        <div className="mb-6">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground mb-1">Filtered by Route</h3>
                <p className="text-sm text-muted-foreground">
                  {routeFilter.origin_city}, {routeFilter.origin_state} → {routeFilter.dest_city}, {routeFilter.dest_state}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearRouteFilter}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filter
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search jobs by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {filteredJobs?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No job listings found</h3>
              <p>Get started by creating your first job listing or uploading a CSV file.</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button>Create Job Listing</Button>
              <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
                Upload CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs?.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{job.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {job.platforms?.name} • {job.job_categories?.name}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                </div>
                
                {job.location && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    📍 {job.location}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created {new Date(job.created_at).toLocaleDateString()}</span>
                  <span className="capitalize">{job.experience_level}</span>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditJob(job)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewAnalytics(job)}
                  >
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Job Dialog */}
      {selectedJobForEdit && (
        <JobEditDialog
          job={selectedJobForEdit}
          open={!!selectedJobForEdit}
          onOpenChange={(open) => !open && setSelectedJobForEdit(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Analytics Dialog */}
      {selectedJobForAnalytics && (
        <JobAnalyticsDialog
          job={selectedJobForAnalytics}
          open={!!selectedJobForAnalytics}
          onOpenChange={(open) => !open && setSelectedJobForAnalytics(null)}
        />
      )}
    </div>
  );
};

export default Jobs;
