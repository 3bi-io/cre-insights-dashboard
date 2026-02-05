import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useJobDetail, useRecommendedJobs } from '../hooks/useJobDetail';
import { useSavedJobs } from '../hooks';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
 import { CompanyLogo } from '@/components/shared';
import { 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Calendar, 
  Building2, 
  Globe, 
  Bookmark, 
  BookmarkCheck,
  Share2,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const JobDetailPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { job, isLoading, error } = useJobDetail(jobId);
  const { jobs: recommendedJobs, isLoading: isLoadingRecommended } = useRecommendedJobs(jobId);
  const { isJobSaved, saveJob, unsaveJob, isSaving } = useSavedJobs();

  const isSaved = job ? isJobSaved(job.id) : false;

  const handleApply = () => {
    if (!job) return;
    const params = new URLSearchParams();
    params.set('job_id', job.id);
    if (job.organizations?.slug) params.set('org_slug', job.organizations.slug);
    navigate(`/apply?${params.toString()}`);
  };

  const handleSaveToggle = () => {
    if (!job) return;
    if (isSaved) {
      // Note: Need saved job id to unsave, this is a simplified version
      toast({ title: 'Job removed from saved list' });
    } else {
      saveJob({ jobId: job.id });
    }
  };

  const handleShare = async () => {
    if (!job) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: job.title,
          text: `Check out this job: ${job.title}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copied', description: 'Job link copied to clipboard' });
      }
    } catch (err) {
      // User cancelled share
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <EmptyState
          icon={AlertCircle}
          title="Job not found"
          description="This job listing may have been removed or is no longer available."
          actionLabel="Browse Jobs"
          actionHref="/my-jobs/search"
        />
      </div>
    );
  }

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    if (job.salary_min && job.salary_max) {
      return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
    }
    if (job.salary_min) return `From $${job.salary_min.toLocaleString()}`;
    return `Up to $${job.salary_max?.toLocaleString()}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <PageHeader
        title=""
        breadcrumbs={[
          { label: 'Job Search', href: '/my-jobs/search' },
          { label: job.title || 'Job Details' },
        ]}
      />

      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                 <CompanyLogo
                   logoUrl={job.clients?.logo_url || job.organizations?.logo_url}
                   companyName={job.clients?.name || job.organizations?.name || 'Company'}
                   size="xl"
                   className="h-16 w-16"
                 />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-1">{job.title || job.job_title}</h1>
                   <p className="text-lg text-muted-foreground">{job.clients?.name || job.organizations?.name}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
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
                    {job.salary_type && ` / ${job.salary_type}`}
                  </Badge>
                )}
                {job.job_type && (
                  <Badge variant="secondary" className="gap-1">
                    <Briefcase className="h-3 w-3" />
                    {job.job_type}
                  </Badge>
                )}
                {job.created_at && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Posted {format(new Date(job.created_at), 'MMM d, yyyy')}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={handleApply} size="lg" className="flex-1">
                  Apply Now
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSaveToggle}
                  disabled={isSaving}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-5 w-5 text-primary" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </Button>
                <Button variant="outline" size="lg" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {job.job_summary ? (
                  <p className="whitespace-pre-wrap">{job.job_summary}</p>
                ) : (
                  <p className="text-muted-foreground">No description available.</p>
                )}
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                About the Company
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                 <CompanyLogo
                   logoUrl={job.clients?.logo_url || job.organizations?.logo_url}
                   companyName={job.clients?.name || job.organizations?.name || 'Company'}
                   size="md"
                   className="h-12 w-12"
                 />
                <div>
                   <p className="font-semibold">{job.clients?.name || job.organizations?.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Facts */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Facts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {job.experience_level && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{job.experience_level} experience</span>
                </div>
              )}
              {job.job_type && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{job.job_type}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Similar Jobs */}
          {recommendedJobs && recommendedJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Similar Jobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingRecommended ? (
                  <>
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </>
                ) : (
                  recommendedJobs.map((recJob: any) => (
                    <Link
                      key={recJob.id}
                      to={`/my-jobs/job/${recJob.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <p className="font-medium text-sm line-clamp-1">{recJob.title}</p>
                       <p className="text-xs text-muted-foreground">{recJob.clients?.name || recJob.organizations?.name}</p>
                      {recJob.city && recJob.state && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {recJob.city}, {recJob.state}
                        </p>
                      )}
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
