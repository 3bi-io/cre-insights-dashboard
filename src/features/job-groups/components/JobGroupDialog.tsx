import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { CreateJobGroupData, UpdateJobGroupData, JobGroup } from '../services/JobGroupsService';
import { useAuth } from '@/hooks/useAuth';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useJobs } from '@/features/jobs/hooks';
import { X } from 'lucide-react';

interface JobGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateJobGroupData | UpdateJobGroupData) => void;
  jobGroup?: JobGroup;
  campaignId: string;
  isLoading?: boolean;
}

export function JobGroupDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  jobGroup, 
  campaignId,
  isLoading = false 
}: JobGroupDialogProps) {
  const { user } = useAuth();
  const { platforms } = usePlatforms();
  const { jobListings } = useJobs();
  
  // State for filtering criteria
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([]);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateJobGroupData>({
    defaultValues: {
      name: jobGroup?.name || '',
      description: jobGroup?.description || '',
      publisher_name: jobGroup?.publisher_name || '',
      publisher_endpoint: jobGroup?.publisher_endpoint || '',
      status: jobGroup?.status || 'active',
      campaign_id: campaignId,
      user_id: user?.id || '',
    }
  });

  // Get unique values from job listings
  const uniqueLocations = React.useMemo(() => {
    if (!jobListings) return [];
    const locations = new Set<string>();
    jobListings.forEach(job => {
      if (job.location) locations.add(job.location);
      if (job.city && job.state) locations.add(`${job.city}, ${job.state}`);
    });
    return Array.from(locations).sort();
  }, [jobListings]);

  const uniqueJobTitles = React.useMemo(() => {
    if (!jobListings) return [];
    const titles = new Set<string>();
    jobListings.forEach(job => {
      if (job.title) titles.add(job.title);
      if (job.job_title) titles.add(job.job_title);
    });
    return Array.from(titles).sort();
  }, [jobListings]);

  React.useEffect(() => {
    if (jobGroup) {
      setValue('name', jobGroup.name);
      setValue('description', jobGroup.description || '');
      setValue('publisher_name', jobGroup.publisher_name);
      setValue('publisher_endpoint', jobGroup.publisher_endpoint || '');
      setValue('status', jobGroup.status || 'active');
      
      // Load existing filters from xml_feed_settings
      const settings = jobGroup.xml_feed_settings as any;
      if (settings?.filters) {
        setSelectedPlatforms(settings.filters.platforms || []);
        setSelectedLocations(settings.filters.locations || []);
        setSelectedJobTitles(settings.filters.jobTitles || []);
        setSelectedJobIds(settings.filters.jobIds || []);
      }
    } else if (user?.id) {
      setValue('user_id', user.id);
      setValue('campaign_id', campaignId);
      // Reset filters for new job group
      setSelectedPlatforms([]);
      setSelectedLocations([]);
      setSelectedJobTitles([]);
      setSelectedJobIds([]);
    }
  }, [jobGroup, setValue, user?.id, campaignId]);

  const handleFormSubmit = (data: CreateJobGroupData) => {
    // Include filter criteria in xml_feed_settings
    const formData = {
      ...data,
      xml_feed_settings: {
        filters: {
          platforms: selectedPlatforms,
          locations: selectedLocations,
          jobTitles: selectedJobTitles,
          jobIds: selectedJobIds
        }
      }
    };
    
    onSubmit(formData);
    if (!jobGroup) {
      reset();
      setSelectedPlatforms([]);
      setSelectedLocations([]);
      setSelectedJobTitles([]);
      setSelectedJobIds([]);
    }
  };

  const handlePlatformToggle = (platformName: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformName) 
        ? prev.filter(p => p !== platformName)
        : [...prev, platformName]
    );
  };

  const handleLocationToggle = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const handleJobTitleToggle = (title: string) => {
    setSelectedJobTitles(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const handleJobIdAdd = (jobId: string) => {
    if (jobId && !selectedJobIds.includes(jobId)) {
      setSelectedJobIds(prev => [...prev, jobId]);
    }
  };

  const handleJobIdRemove = (jobId: string) => {
    setSelectedJobIds(prev => prev.filter(id => id !== jobId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {jobGroup ? 'Edit Job Group' : 'Create Job Group'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register('name', { required: 'Name is required' })}
                placeholder="Enter job group name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter job group description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publisher_name">Publisher Name</Label>
              <Input
                id="publisher_name"
                {...register('publisher_name', { required: 'Publisher name is required' })}
                placeholder="e.g., Indeed, ZipRecruiter, LinkedIn"
              />
              {errors.publisher_name && (
                <p className="text-sm text-destructive">{errors.publisher_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="publisher_endpoint">Publisher Endpoint (Optional)</Label>
              <Input
                id="publisher_endpoint"
                {...register('publisher_endpoint')}
                placeholder="https://publisher-api.com/jobs"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={watch('status')} 
                onValueChange={(value) => setValue('status', value as 'active' | 'inactive' | 'paused')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Filtering Criteria */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Job Filtering Criteria</h3>
            <p className="text-xs text-muted-foreground">
              Select specific publishers, locations, job titles, or job IDs to include in this group. 
              Leave empty to include all available jobs.
            </p>

            {/* Publishers Selection */}
            <div className="space-y-2">
              <Label>Publishers/Platforms</Label>
              <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                {platforms && platforms.length > 0 ? (
                  <div className="space-y-2">
                    {platforms.map((platform) => (
                      <div key={platform.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedPlatforms.includes(platform.name)}
                          onCheckedChange={() => handlePlatformToggle(platform.name)}
                        />
                        <label className="text-sm cursor-pointer" onClick={() => handlePlatformToggle(platform.name)}>
                          {platform.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No platforms available</p>
                )}
              </div>
              {selectedPlatforms.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedPlatforms.map((platform) => (
                    <Badge key={platform} variant="secondary" className="text-xs">
                      {platform}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => handlePlatformToggle(platform)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Locations Selection */}
            <div className="space-y-2">
              <Label>Locations</Label>
              <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                {uniqueLocations.length > 0 ? (
                  <div className="space-y-2">
                    {uniqueLocations.slice(0, 10).map((location) => (
                      <div key={location} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedLocations.includes(location)}
                          onCheckedChange={() => handleLocationToggle(location)}
                        />
                        <label className="text-sm cursor-pointer" onClick={() => handleLocationToggle(location)}>
                          {location}
                        </label>
                      </div>
                    ))}
                    {uniqueLocations.length > 10 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        And {uniqueLocations.length - 10} more locations...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No locations available</p>
                )}
              </div>
              {selectedLocations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedLocations.map((location) => (
                    <Badge key={location} variant="secondary" className="text-xs">
                      {location}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => handleLocationToggle(location)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Job Titles Selection */}
            <div className="space-y-2">
              <Label>Job Titles</Label>
              <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                {uniqueJobTitles.length > 0 ? (
                  <div className="space-y-2">
                    {uniqueJobTitles.slice(0, 10).map((title) => (
                      <div key={title} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedJobTitles.includes(title)}
                          onCheckedChange={() => handleJobTitleToggle(title)}
                        />
                        <label className="text-sm cursor-pointer" onClick={() => handleJobTitleToggle(title)}>
                          {title}
                        </label>
                      </div>
                    ))}
                    {uniqueJobTitles.length > 10 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        And {uniqueJobTitles.length - 10} more job titles...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No job titles available</p>
                )}
              </div>
              {selectedJobTitles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedJobTitles.map((title) => (
                    <Badge key={title} variant="secondary" className="text-xs">
                      {title}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => handleJobTitleToggle(title)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Specific Job IDs */}
            <div className="space-y-2">
              <Label>Specific Job IDs (Optional)</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter job ID and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const target = e.target as HTMLInputElement;
                      handleJobIdAdd(target.value.trim());
                      target.value = '';
                    }
                  }}
                />
              </div>
              {selectedJobIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedJobIds.map((jobId) => (
                    <Badge key={jobId} variant="secondary" className="text-xs">
                      {jobId}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => handleJobIdRemove(jobId)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : jobGroup ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}