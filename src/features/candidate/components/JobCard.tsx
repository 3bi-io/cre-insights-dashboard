import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Briefcase, Bookmark, BookmarkCheck } from 'lucide-react';
import { useSavedJobs } from '../hooks';

interface JobCardProps {
  job: any;
  onApply?: (jobId: string, orgSlug?: string) => void;
  showSaveButton?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply, showSaveButton = true }) => {
  const { isJobSaved, saveJob, unsaveJob, isSaving } = useSavedJobs();
  const isSaved = isJobSaved(job.id);

  const handleSaveToggle = () => {
    if (isSaved) {
      const savedJob = job.candidate_saved_jobs?.[0];
      if (savedJob) unsaveJob(savedJob.id);
    } else {
      saveJob({ jobId: job.id });
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {job.organizations?.logo_url && (
                <img 
                  src={job.organizations.logo_url} 
                  alt={job.organizations.name}
                  className="h-8 w-8 rounded object-cover"
                />
              )}
              <span className="text-sm text-muted-foreground">
                {job.organizations?.name}
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-1">
              {job.title || job.job_title}
            </h3>
          </div>
          {showSaveButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveToggle}
              disabled={isSaving}
            >
              {isSaved ? (
                <BookmarkCheck className="h-5 w-5 text-primary" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {job.city && job.state && (
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              {job.city}, {job.state}
            </Badge>
          )}
          {(job.salary_min || job.salary_max) && (
            <Badge variant="secondary" className="gap-1">
              <DollarSign className="h-3 w-3" />
              {job.salary_min && job.salary_max
                ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                : job.salary_min
                ? `From $${job.salary_min.toLocaleString()}`
                : `Up to $${job.salary_max?.toLocaleString()}`}
            </Badge>
          )}
          {job.job_type && (
            <Badge variant="secondary" className="gap-1">
              <Briefcase className="h-3 w-3" />
              {job.job_type}
            </Badge>
          )}
        </div>

        {job.job_summary && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {job.job_summary}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          {onApply && (
            <Button onClick={() => onApply(job.id, job.organizations?.slug)} className="flex-1">
              Apply Now
            </Button>
          )}
          <Button variant="outline" className="flex-1">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
