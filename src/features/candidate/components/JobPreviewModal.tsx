import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Building2, 
  Clock, 
  Bookmark, 
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { useSavedJobs } from '../hooks';
import { formatDistanceToNow } from 'date-fns';

interface JobPreviewModalProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (jobId: string, orgSlug?: string) => void;
}

export const JobPreviewModal: React.FC<JobPreviewModalProps> = ({
  job,
  open,
  onOpenChange,
  onApply,
}) => {
  const navigate = useNavigate();
  const { savedJobs, saveJob, unsaveJob } = useSavedJobs();
  
  if (!job) return null;

  const org = job.organizations as any;
  const isSaved = Array.isArray(savedJobs) && savedJobs.some((s: any) => s.job_listing_id === job.id);

  const formatSalary = () => {
    if (job.salary_min && job.salary_max) {
      return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
    }
    if (job.salary_min) {
      return `From $${job.salary_min.toLocaleString()}`;
    }
    if (job.salary_max) {
      return `Up to $${job.salary_max.toLocaleString()}`;
    }
    return 'Competitive';
  };

  const handleSaveToggle = () => {
    if (isSaved && Array.isArray(savedJobs)) {
      const jobs = savedJobs as any[];
      const savedJob = jobs.find((s) => s.job_listing_id === job.id);
      if (savedJob?.id) unsaveJob(savedJob.id);
    } else {
      saveJob({ jobId: job.id });
    }
  };

  const handleApply = () => {
    onOpenChange(false);
    if (onApply) {
      onApply(job.id, org?.slug);
    } else {
      const params = new URLSearchParams();
      params.set('job_id', job.id);
      if (org?.slug) params.set('org_slug', org.slug);
      navigate(`/apply?${params.toString()}`);
    }
  };

  const handleViewDetails = () => {
    onOpenChange(false);
    navigate(`/my-jobs/job/${job.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {org?.logo_url ? (
              <img 
                src={org.logo_url} 
                alt={org.name} 
                className="w-12 h-12 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg leading-tight">
                {job.title || job.job_title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span className="font-medium text-foreground">{org?.name || 'Company'}</span>
                {job.created_at && (
                  <>
                    <span>•</span>
                    <span className="text-xs">
                      Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </span>
                  </>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Quick Info */}
          <div className="flex flex-wrap gap-2">
            {(job.city || job.state || job.location) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.city && job.state ? `${job.city}, ${job.state}` : job.location || 'Location'}
              </Badge>
            )}
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatSalary()}
            </Badge>
            {job.job_type && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {job.job_type.replace('_', ' ')}
              </Badge>
            )}
            {job.remote_type && (
              <Badge variant="outline">
                {job.remote_type}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Job Summary */}
          {job.job_summary && (
            <div>
              <h4 className="text-sm font-medium mb-2">About this role</h4>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {job.job_summary}
              </p>
            </div>
          )}

          {/* Key Requirements */}
          {job.experience_level && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Experience: {job.experience_level}</span>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button onClick={handleApply} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply Now
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleSaveToggle}
                className={isSaved ? 'text-primary' : ''}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              </Button>
            </div>
            <Button variant="ghost" onClick={handleViewDetails} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
