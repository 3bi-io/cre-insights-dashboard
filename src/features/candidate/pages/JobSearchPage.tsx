import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobSearch } from '../hooks';
import { JobCard } from '../components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, DollarSign, Filter, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';

const JobSearchPage = () => {
  const navigate = useNavigate();
  const { jobs, isLoading, filters, updateFilters, clearFilters } = useJobSearch();

  const handleApply = (jobId: string, orgSlug?: string) => {
    const params = new URLSearchParams();
    params.set('job_id', jobId);
    if (orgSlug) params.set('org_slug', orgSlug);
    navigate(`/apply?${params.toString()}`);
  };

  const hasActiveFilters = filters.location || filters.salaryMin || filters.salaryMax;

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
              placeholder="Search jobs..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Jobs</SheetTitle>
                <SheetDescription>
                  Refine your search to find the perfect match
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="City or State"
                      value={filters.location}
                      onChange={(e) => updateFilters({ location: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Salary Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.salaryMin || ''}
                        onChange={(e) => updateFilters({ salaryMin: e.target.value ? Number(e.target.value) : null })}
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.salaryMax || ''}
                        onChange={(e) => updateFilters({ salaryMax: e.target.value ? Number(e.target.value) : null })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full"
                  disabled={!hasActiveFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Active filters:</span>
            {filters.location && <span className="px-2 py-1 bg-muted rounded">📍 {filters.location}</span>}
            {(filters.salaryMin || filters.salaryMax) && (
              <span className="px-2 py-1 bg-muted rounded">
                💰 {filters.salaryMin ? `$${filters.salaryMin.toLocaleString()}` : '...'} - {filters.salaryMax ? `$${filters.salaryMax.toLocaleString()}` : '...'}
              </span>
            )}
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job: any) => (
              <JobCard key={job.id} job={job} onApply={handleApply} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search criteria
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
