import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSavedJobs } from '../hooks';
import { JobCard } from '../components';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, SortAsc, Calendar, Building2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortOption = 'recent' | 'salary' | 'company';

const SavedJobsPage = () => {
  const navigate = useNavigate();
  const { savedJobs, isLoading } = useSavedJobs();
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const handleApply = (jobId: string, orgSlug?: string) => {
    const params = new URLSearchParams();
    params.set('job_id', jobId);
    if (orgSlug) params.set('org_slug', orgSlug);
    navigate(`/apply?${params.toString()}`);
  };

  // Sort saved jobs
  const sortedJobs = React.useMemo(() => {
    if (!savedJobs || !Array.isArray(savedJobs)) return [];
    
    const jobs = (savedJobs as any[]).slice();
    switch (sortBy) {
      case 'recent':
        return jobs.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'salary':
        return jobs.sort((a, b) => {
          const salaryA = a.job_listings?.salary_max || a.job_listings?.salary_min || 0;
          const salaryB = b.job_listings?.salary_max || b.job_listings?.salary_min || 0;
          return salaryB - salaryA;
        });
      case 'company':
        return jobs.sort((a, b) => {
          const companyA = (a.job_listings?.organizations as any)?.name || '';
          const companyB = (b.job_listings?.organizations as any)?.name || '';
          return companyA.localeCompare(companyB);
        });
      default:
        return jobs;
    }
  }, [savedJobs, sortBy]);

  // Check if a job is expired or filled
  const isJobActive = (job: any) => {
    if (!job) return false;
    return job.status === 'active';
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Saved Jobs</h1>
        <p className="text-muted-foreground">
          Jobs you've bookmarked for later
        </p>
      </div>

      {/* Sort controls */}
      {savedJobs && savedJobs.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {savedJobs.length} saved {savedJobs.length === 1 ? 'job' : 'jobs'}
          </p>
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Most Recent
                  </div>
                </SelectItem>
                <SelectItem value="salary">
                  <div className="flex items-center gap-2">
                    <span>💰</span>
                    Highest Salary
                  </div>
                </SelectItem>
                <SelectItem value="company">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Name
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : sortedJobs && sortedJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedJobs.map((saved: any) => {
            const isActive = isJobActive(saved.job_listings);
            return (
              <div key={saved.id} className="relative">
                {/* Saved date badge */}
                <div className="absolute top-2 left-2 z-10">
                  <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur">
                    Saved {formatDistanceToNow(new Date(saved.created_at), { addSuffix: true })}
                  </Badge>
                </div>
                
                {/* Expired/Filled indicator */}
                {!isActive && (
                  <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="text-center p-4">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">This job is no longer available</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => navigate('/my-jobs/search')}
                      >
                        Find similar jobs
                      </Button>
                    </div>
                  </div>
                )}
                
                <JobCard 
                  job={saved.job_listings} 
                  onApply={handleApply}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bookmark className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No saved jobs yet</h3>
          <p className="text-muted-foreground mb-6">
            Start saving jobs you're interested in to view them here
          </p>
          <Button onClick={() => navigate('/my-jobs/search')}>
            Browse Jobs
          </Button>
        </div>
      )}
    </div>
  );
};

export default SavedJobsPage;
