import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  MapPin, DollarSign, Building2, Clock, Briefcase, 
  ArrowLeft, ExternalLink, Share2, Mic 
} from 'lucide-react';
import { SEO } from '@/components/SEO';
import { StructuredData, buildJobPostingSchema, buildBreadcrumbSchema } from '@/components/StructuredData';
import { useJobDetails } from '@/hooks/useJobDetails';
import { RelatedJobs } from '@/components/public/RelatedJobs';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { VoiceApplicationPanel } from '@/features/elevenlabs';

const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading, error } = useJobDetails(id);
  
  const {
    isConnected,
    selectedJob,
    isSpeaking,
    transcripts,
    pendingUserTranscript,
    startVoiceApplication,
    endVoiceApplication,
  } = useElevenLabsVoice();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-6 w-32 mb-6" />
          <Card>
            <CardContent className="p-8">
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-6" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-8" />
              <Skeleton className="h-12 w-48" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Job Not Found"
          description="The job listing you're looking for is no longer available."
          noindex
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
              <p className="text-muted-foreground mb-6">
                This job listing is no longer available or may have been removed.
              </p>
              <Button onClick={() => navigate('/jobs')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse All Jobs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayTitle = job.title || job.job_title || 'Job Opening';
  const displayLocation = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : '');
  const displayDescription = job.job_summary || job.job_description || '';
  const companyName = job.clients?.name || 'Company';
  const canonicalUrl = `https://ats.me/jobs/${job.id}`;
  const applyUrl = `/apply?job_id=${job.id}&org_slug=${job.organizations?.slug || 'default'}`;

  const formatSalary = (min: number | null, max: number | null, type: string | null) => {
    if (!min && !max) return null;
    const formatAmount = (amount: number) => {
      if (type === 'hourly') return `$${amount}/hr`;
      if (type === 'yearly') return `$${amount.toLocaleString()}/yr`;
      return `$${amount.toLocaleString()}`;
    };
    if (min && max) return `${formatAmount(min)} - ${formatAmount(max)}`;
    return formatAmount(min || max || 0);
  };

  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayTitle,
          text: `Check out this job: ${displayTitle} at ${companyName}`,
          url: canonicalUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(canonicalUrl);
    }
  };

  const handleVoiceApply = () => {
    startVoiceApplication({
      jobId: job.id,
      jobTitle: displayTitle,
      jobDescription: displayDescription || `This is a ${displayTitle} position`,
      company: companyName,
      location: displayLocation || 'Various locations',
      salary: salary || 'Competitive salary',
    });
  };

  // Build structured data
  const jobPostingSchema = buildJobPostingSchema({
    title: displayTitle,
    description: displayDescription,
    datePosted: job.created_at,
    validThrough: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    employmentType: job.job_type || 'FULL_TIME',
    hiringOrganization: companyName,
    jobLocation: displayLocation ? {
      city: job.city || '',
      state: job.state || '',
      country: 'US',
    } : undefined,
    baseSalary: (job.salary_min || job.salary_max) ? {
      currency: 'USD',
      value: job.salary_min || job.salary_max || 0,
    } : undefined,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://ats.me' },
    { name: 'Jobs', url: 'https://ats.me/jobs' },
    { name: displayTitle, url: canonicalUrl },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${displayTitle} at ${companyName}`}
        description={displayDescription?.substring(0, 160) || `Apply for ${displayTitle} at ${companyName}. ${displayLocation ? `Location: ${displayLocation}.` : ''}`}
        keywords={`${displayTitle}, ${companyName}, jobs, careers, ${job.job_categories?.name || ''}`}
        canonical={canonicalUrl}
        ogType="article"
        articlePublishedTime={job.created_at}
        articleModifiedTime={job.updated_at}
      />
      <StructuredData data={[jobPostingSchema, breadcrumbSchema]} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/jobs" className="hover:text-foreground transition-colors">Jobs</Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{displayTitle}</span>
        </nav>

        <div className="space-y-6">
          {/* Main Job Card */}
          <Card>
            <CardContent className="p-6 md:p-8">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-start gap-4 mb-6">
                <Avatar className="h-16 w-16 border">
                  {job.clients?.logo_url ? (
                    <AvatarImage 
                      src={job.clients.logo_url} 
                      alt={`${companyName} logo`}
                      className="object-contain p-2 bg-background"
                    />
                  ) : null}
                  <AvatarFallback className="bg-muted">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{displayTitle}</h1>
                  <p className="text-lg text-muted-foreground mb-3">{companyName}</p>
                  <div className="flex flex-wrap gap-2">
                    {job.job_categories?.name && (
                      <Badge variant="secondary">{job.job_categories.name}</Badge>
                    )}
                    {job.job_type && (
                      <Badge variant="outline">{job.job_type}</Badge>
                    )}
                    {job.experience_level && (
                      <Badge variant="outline">{job.experience_level}</Badge>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                {displayLocation && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{displayLocation}</p>
                    </div>
                  </div>
                )}
                {salary && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Salary</p>
                      <p className="font-medium">{salary}</p>
                    </div>
                  </div>
                )}
                {job.job_type && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Job Type</p>
                      <p className="font-medium">{job.job_type}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Posted</p>
                    <p className="font-medium">{new Date(job.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Route Info */}
              {job.dest_city && job.dest_state && (
                <div className="mb-6 p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Route Information</h3>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Destination:</span> {job.dest_city}, {job.dest_state}
                  </p>
                </div>
              )}

              {/* Description */}
              {displayDescription && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Job Description</h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                    {displayDescription}
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Link to={applyUrl} className="flex-1">
                  <Button className="w-full" size="lg">
                    Apply Now
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={handleVoiceApply}
                  disabled={isConnected}
                  className="flex-1"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Apply with Voice
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Related Jobs */}
          <RelatedJobs
            currentJobId={job.id}
            clientId={job.client_id}
            categoryId={job.category_id}
            organizationId={job.organization_id}
          />

          {/* Back to Jobs */}
          <div className="text-center">
            <Link to="/jobs">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Jobs
              </Button>
            </Link>
          </div>
        </div>

        {/* Voice Application Panel with Transcripts */}
        <VoiceApplicationPanel
          isConnected={isConnected}
          isSpeaking={isSpeaking}
          selectedJob={selectedJob}
          transcripts={transcripts}
          pendingUserTranscript={pendingUserTranscript}
          onEnd={endVoiceApplication}
        />
      </div>
    </div>
  );
};

export default JobDetailsPage;
