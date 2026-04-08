import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Briefcase, Bookmark, BookmarkCheck, Clock } from 'lucide-react';
import { useSavedJobs } from '../hooks';
import { format } from 'date-fns';
 import { CompanyLogo } from '@/components/shared';

interface JobCardProps {
  job: any;
  onApply?: (jobId: string, orgSlug?: string, applyUrl?: string) => void;
  showSaveButton?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply, showSaveButton = true }) => {
  const { isJobSaved, saveJob, unsaveJob, isSaving, savedJobs } = useSavedJobs();
  const isSaved = isJobSaved(job.id);

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved && Array.isArray(savedJobs)) {
      const jobs = savedJobs as any[];
      const savedJob = jobs.find((s) => s.job_listing_id === job.id);
      if (savedJob?.id) unsaveJob(savedJob.id);
    } else {
      saveJob({ jobId: job.id });
    }
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onApply) {
      onApply(job.id, job.organizations?.slug, job.apply_url);
    }
  };

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    if (job.salary_min && job.salary_max) {
      return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
    }
    if (job.salary_min) return `From $${job.salary_min.toLocaleString()}`;
    return `Up to $${job.salary_max?.toLocaleString()}`;
  };

  return (
    <Card className="hover:shadow-lg transition-all hover:border-primary/20 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
               <CompanyLogo
                 logoUrl={job.clients?.logo_url}
                 companyName={job.clients?.name || 'Company'}
                 size="sm"
                 className="flex-shrink-0"
               />
              <span className="text-sm text-muted-foreground truncate">
                 {job.clients?.name || 'Company'}
              </span>
            </div>
            <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {job.title || job.job_title}
            </h3>
          </div>
          {showSaveButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveToggle}
              disabled={isSaving}
              className="flex-shrink-0"
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
          {formatSalary() && (
            <Badge variant="secondary" className="gap-1">
              <DollarSign className="h-3 w-3" />
              {formatSalary()}
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
          <p className="text-sm text-muted-foreground line-clamp-2">
            {job.job_summary}
          </p>
        )}

        {job.created_at && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Posted {format(new Date(job.created_at), 'MMM d, yyyy')}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          {onApply && (
            <Button onClick={handleApplyClick} className="flex-1">
              Apply Now
            </Button>
          )}
          <Button variant="outline" className="flex-1" asChild>
            <Link to={`/my-jobs/job/${job.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
