import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSavedJobs } from '../hooks';
import { JobCard } from '../components';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark } from 'lucide-react';

const SavedJobsPage = () => {
  const navigate = useNavigate();
  const { savedJobs, isLoading } = useSavedJobs();

  const handleApply = (jobId: string) => {
    navigate(`/apply?job=${jobId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Saved Jobs</h1>
        <p className="text-muted-foreground">
          Jobs you've bookmarked for later
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : savedJobs && savedJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedJobs.map((saved: any) => (
            <JobCard 
              key={saved.id} 
              job={saved.job_listings} 
              onApply={handleApply}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bookmark className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No saved jobs yet</h3>
          <p className="text-muted-foreground">
            Start saving jobs you're interested in to view them here
          </p>
        </div>
      )}
    </div>
  );
};

export default SavedJobsPage;
