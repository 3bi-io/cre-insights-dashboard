import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { JobGroup } from '../services/JobGroupsService';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';

interface JobAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobGroup: JobGroup;
  onAssignJobs: (jobListingIds: string[]) => void;
  currentAssignments: string[];
  isLoading?: boolean;
}

export function JobAssignmentDialog({ 
  open, 
  onOpenChange, 
  jobGroup, 
  onAssignJobs,
  currentAssignments,
  isLoading = false 
}: JobAssignmentDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<string[]>(currentAssignments);
  
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs-for-assignment', search, jobGroup.id],
    queryFn: async () => {
      let query = supabase
        .from('job_listings')
        .select(`
          id, 
          title, 
          job_title,
          status, 
          location, 
          city,
          state,
          job_type,
          job_platform_associations(
            platforms(name)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,job_title.ilike.%${search}%`);
      }

      const { data: allJobs, error } = await query;
      if (error) throw error;
      
      // Apply job group filters if they exist
      let filteredJobs = allJobs || [];
      const settings = jobGroup.xml_feed_settings as any;
      const filters = settings?.filters;
      
      if (filters) {
        // Filter by platforms
        if (filters.platforms && filters.platforms.length > 0) {
          filteredJobs = filteredJobs.filter(job => 
            job.job_platform_associations?.some(assoc => 
              filters.platforms.includes(assoc.platforms?.name)
            )
          );
        }
        
        // Filter by locations
        if (filters.locations && filters.locations.length > 0) {
          filteredJobs = filteredJobs.filter(job => {
            const jobLocation = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : '');
            return filters.locations.includes(jobLocation);
          });
        }
        
        // Filter by job titles
        if (filters.jobTitles && filters.jobTitles.length > 0) {
          filteredJobs = filteredJobs.filter(job => 
            filters.jobTitles.includes(job.title) || 
            filters.jobTitles.includes(job.job_title)
          );
        }
        
        // Filter by specific job IDs
        if (filters.jobIds && filters.jobIds.length > 0) {
          filteredJobs = filteredJobs.filter(job => 
            filters.jobIds.includes(job.id)
          );
        }
      }
      
      return filteredJobs;
    },
    enabled: open
  });

  useEffect(() => {
    setSelectedJobs(currentAssignments);
  }, [currentAssignments]);

  const handleJobToggle = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSubmit = () => {
    onAssignJobs(selectedJobs);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Assign Jobs to "{jobGroup.name}"
          </DialogTitle>
          {/* Show active filters */}
          {(() => {
            const settings = jobGroup.xml_feed_settings as any;
            const filters = settings?.filters;
            const hasFilters = filters && (
              (filters.platforms && filters.platforms.length > 0) ||
              (filters.locations && filters.locations.length > 0) ||
              (filters.jobTitles && filters.jobTitles.length > 0) ||
              (filters.jobIds && filters.jobIds.length > 0)
            );
            
            if (!hasFilters) return null;
            
            return (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Active filters for this job group:</p>
                <div className="flex flex-wrap gap-1">
                  {filters.platforms?.map((platform: string) => (
                    <Badge key={platform} variant="outline" className="text-xs">
                      Platform: {platform}
                    </Badge>
                  ))}
                  {filters.locations?.map((location: string) => (
                    <Badge key={location} variant="outline" className="text-xs">
                      Location: {location}
                    </Badge>
                  ))}
                  {filters.jobTitles?.map((title: string) => (
                    <Badge key={title} variant="outline" className="text-xs">
                      Title: {title}
                    </Badge>
                  ))}
                  {filters.jobIds?.map((id: string) => (
                    <Badge key={id} variant="outline" className="text-xs">
                      ID: {id}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })()}
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="border rounded-lg max-h-[400px] overflow-y-auto">
            {jobsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="p-2">
                {jobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer"
                    onClick={() => handleJobToggle(job.id)}
                  >
                    <Checkbox 
                      checked={selectedJobs.includes(job.id)}
                      onChange={() => handleJobToggle(job.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{job.title}</h4>
                        <Badge 
                          variant="secondary" 
                          className={getStatusColor(job.status || 'active')}
                        >
                          {job.status || 'active'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        {job.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{job.location}</span>
                          </div>
                        )}
                        {job.job_type && (
                          <div className="flex items-center space-x-1">
                            <Briefcase className="w-3 h-3" />
                            <span>{job.job_type}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No jobs found</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{selectedJobs.length} jobs selected</span>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedJobs([])}
              >
                Clear All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedJobs(jobs?.map(job => job.id) || [])}
              >
                Select All
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
            >
              {isLoading ? 'Assigning...' : 'Assign Jobs'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}