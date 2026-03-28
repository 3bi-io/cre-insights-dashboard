import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobSearch } from '../hooks';
import { JobCard } from '../components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, DollarSign, Filter, X, Briefcase, Clock, Building2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const JOB_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
];

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'executive', label: 'Executive' },
];

const DATE_POSTED_OPTIONS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
  { value: '', label: 'Any time' },
];

const REMOTE_TYPES = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

const JobSearchPage = () => {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { 
    jobs, 
    isLoading, 
    filters, 
    updateFilters, 
    clearFilters, 
    hasActiveFilters, 
    activeFilterCount,
    loadMore,
    hasMore 
  } = useJobSearch();

  const handleApply = (jobId: string, orgSlug?: string) => {
    const params = new URLSearchParams();
    params.set('job_id', jobId);
    if (orgSlug) params.set('org_slug', orgSlug);
    navigate(`/apply?${params.toString()}`, { state: { internal: true } });
  };

  const handleApplyFilters = () => {
    setIsFilterOpen(false);
  };

  const getActiveFilterLabels = () => {
    const labels: string[] = [];
    if (filters.location) labels.push(`📍 ${filters.location}`);
    if (filters.jobType) {
      const type = JOB_TYPES.find(t => t.value === filters.jobType);
      if (type) labels.push(type.label);
    }
    if (filters.experienceLevel) {
      const level = EXPERIENCE_LEVELS.find(l => l.value === filters.experienceLevel);
      if (level) labels.push(level.label);
    }
    if (filters.datePosted) {
      const date = DATE_POSTED_OPTIONS.find(d => d.value === filters.datePosted);
      if (date) labels.push(date.label);
    }
    if (filters.remoteType) {
      const remote = REMOTE_TYPES.find(r => r.value === filters.remoteType);
      if (remote) labels.push(remote.label);
    }
    if (filters.salaryMin || filters.salaryMax) {
      const min = filters.salaryMin ? `$${filters.salaryMin.toLocaleString()}` : '...';
      const max = filters.salaryMax ? `$${filters.salaryMax.toLocaleString()}` : '...';
      labels.push(`💰 ${min} - ${max}`);
    }
    return labels;
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Job Search</h1>
        <p className="text-muted-foreground">
          Find your next opportunity
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs by title, company, or keywords..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter Jobs</SheetTitle>
                <SheetDescription>
                  Refine your search to find the perfect match
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="City or State"
                    value={filters.location}
                    onChange={(e) => updateFilters({ location: e.target.value })}
                  />
                </div>

                {/* Job Type */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Job Type
                  </Label>
                  <Select
                    value={filters.jobType}
                    onValueChange={(value) => updateFilters({ jobType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any type</SelectItem>
                      {JOB_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience Level */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Experience Level
                  </Label>
                  <Select
                    value={filters.experienceLevel}
                    onValueChange={(value) => updateFilters({ experienceLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any level</SelectItem>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Remote Type */}
                <div className="space-y-2">
                  <Label>Work Location</Label>
                  <Select
                    value={filters.remoteType}
                    onValueChange={(value) => updateFilters({ remoteType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select work location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any location</SelectItem>
                      {REMOTE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Posted */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Date Posted
                  </Label>
                  <Select
                    value={filters.datePosted}
                    onValueChange={(value) => updateFilters({ datePosted: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_POSTED_OPTIONS.map((option) => (
                        <SelectItem key={option.value || 'any'} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Salary Range */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Salary Range
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.salaryMin || ''}
                      onChange={(e) => updateFilters({ salaryMin: e.target.value ? Number(e.target.value) : null })}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.salaryMax || ''}
                      onChange={(e) => updateFilters({ salaryMax: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                </div>
              </div>
              <SheetFooter className="mt-6 flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <Button onClick={handleApplyFilters} className="flex-1">
                  Apply Filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {getActiveFilterLabels().map((label, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-6">
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : jobs && jobs.length > 0 ? (
        <div>
          <div className="mb-4 text-sm text-muted-foreground">
            Found {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
            {hasMore && '+'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job: any) => (
              <JobCard key={job.id} job={job} onApply={handleApply} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={loadMore}>
                Load More Jobs
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search criteria or filters
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default JobSearchPage;
