import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
import { 
  MapPin, DollarSign, Building2, Clock, Briefcase, 
  ArrowLeft, ExternalLink, Share2, Mic 
} from 'lucide-react';
import { SEO } from '@/components/SEO';
import { StructuredData, buildJobPostingSchema, buildBreadcrumbSchema, getSalaryUnitText } from '@/components/StructuredData';
import { useJobDetails } from '@/hooks/useJobDetails';
import { extractExperienceFromDescription, extractQualificationsFromDescription } from '@/utils/jobSchemaExtraction';
import { RelatedJobs } from '@/components/public/RelatedJobs';
import { StickyApplyCTA } from '@/components/public/StickyApplyCTA';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { VoiceApplicationPanel } from '@/features/elevenlabs';
import { useToast } from '@/hooks/use-toast';
import { sanitizers } from '@/utils/validation';
import { getDisplayCompanyName } from '@/utils/jobDisplayUtils';

const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: job, isLoading, error } = useJobDetails(id);
  
  const {
    isConnected,
    selectedJob,
    isSpeaking,
    transcripts,
    pendingUserTranscript,
    pendingAgentTranscript,
    startVoiceApplication,
    endVoiceApplication,
  } = useElevenLabsVoice();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 lg:py-8 max-w-4xl">
          <Skeleton className="h-5 w-32 mb-4 lg:mb-6" />
          <Card>
            <CardContent className="p-6 lg:p-8">
              <Skeleton className="h-8 lg:h-10 w-3/4 mb-3 lg:mb-4" />
              <Skeleton className="h-5 lg:h-6 w-1/2 mb-4 lg:mb-6" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-6 lg:mb-8" />
              <Skeleton className="h-12 w-full lg:w-48" />
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
        <div className="container mx-auto px-4 py-6 lg:py-8 max-w-4xl">
          <Card>
            <CardContent className="p-6 lg:p-8 text-center">
              <Building2 className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h1 className="text-xl lg:text-2xl font-bold mb-2">Job Not Found</h1>
              <p className="text-sm lg:text-base text-muted-foreground mb-6">
                This job listing is no longer available.
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
  const companyName = getDisplayCompanyName(job);
  const canonicalUrl = `https://ats.me/jobs/${job.id}`;
  const applyUrl = `/apply?job_id=${job.id}`;

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
    // Global voice agent - always available for all jobs
    startVoiceApplication({
      jobId: job.id,
      jobTitle: displayTitle,
      jobDescription: displayDescription || `This is a ${displayTitle} position`,
      company: companyName,
      location: displayLocation || 'Various locations',
      salary: salary || 'Competitive salary',
    });
  };

  // Build structured data with enhanced schema
  // Extract experience and qualifications from description for enhanced schema
  const experienceData = extractExperienceFromDescription(displayDescription);
  const qualificationsData = extractQualificationsFromDescription(displayDescription);

  const jobPostingSchema = buildJobPostingSchema({
    id: job.id,
    title: displayTitle,
    description: displayDescription,
    datePosted: job.created_at,
    validThrough: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    employmentType: job.job_type || 'FULL_TIME',
    hiringOrganization: companyName,
    hiringOrganizationLogo: job.clients?.logo_url,
    jobLocation: displayLocation ? {
      city: job.city || '',
      state: job.state || '',
      country: 'US',
    } : undefined,
    baseSalary: (job.salary_min || job.salary_max) ? {
      minValue: job.salary_min || undefined,
      maxValue: job.salary_max || undefined,
      currency: 'USD',
      unitText: getSalaryUnitText(job.salary_type),
    } : undefined,
    directApply: true,
    applicationUrl: `https://ats.me${applyUrl}`,
    // Enhanced schema fields
    experienceRequirements: experienceData,
    qualifications: qualificationsData.summary,
    skills: qualificationsData.skills,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://ats.me' },
    { name: 'Jobs', url: 'https://ats.me/jobs' },
    { name: displayTitle, url: canonicalUrl },
  ]);

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <SEO
        title={`${displayTitle} at ${companyName}`}
        description={displayDescription?.substring(0, 160) || `Apply for ${displayTitle} at ${companyName}. ${displayLocation ? `Location: ${displayLocation}.` : ''}`}
        keywords={`${displayTitle}, ${companyName}, jobs, careers, ${job.job_categories?.name || ''}`}
        canonical={canonicalUrl}
        ogImage="https://ats.me/og-jobs.png"
        ogType="article"
        articlePublishedTime={job.created_at}
        articleModifiedTime={job.updated_at}
      />
      <StructuredData data={[jobPostingSchema, breadcrumbSchema]} />

      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-4xl">
        {/* Breadcrumb - Horizontally scrollable on mobile */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4 lg:mb-6 overflow-x-auto whitespace-nowrap pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
          <Link to="/" className="hover:text-foreground transition-colors shrink-0">Home</Link>
          <span className="shrink-0">/</span>
          <Link to="/jobs" className="hover:text-foreground transition-colors shrink-0">Jobs</Link>
          <span className="shrink-0">/</span>
          <span className="text-foreground truncate max-w-[200px] lg:max-w-none">{displayTitle}</span>
        </nav>

        <div className="space-y-4 lg:space-y-6">
          {/* Main Job Card */}
          <Card>
            <CardContent className="p-4 sm:p-6 lg:p-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4 lg:mb-6">
                <LogoAvatar size="2xl">
                  {job.clients?.logo_url ? (
                    <LogoAvatarImage 
                      src={job.clients.logo_url} 
                      alt={`${companyName} logo`}
                    />
                  ) : (
                    <LogoAvatarFallback iconSize="xl" />
                  )}
                </LogoAvatar>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 lg:mb-2 leading-tight">{displayTitle}</h1>
                  <p className="text-base lg:text-lg text-muted-foreground mb-2 lg:mb-3">{companyName}</p>
                  {/* Horizontally scrollable badges on mobile */}
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                    {job.job_categories?.name && (
                      <Badge variant="secondary" className="shrink-0">{job.job_categories.name}</Badge>
                    )}
                    {job.job_type && (
                      <Badge variant="outline" className="shrink-0">{job.job_type}</Badge>
                    )}
                    {job.experience_level && (
                      <Badge variant="outline" className="shrink-0">{job.experience_level}</Badge>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="icon" onClick={handleShare} className="shrink-0 hidden sm:flex">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Job Details - Grid with better mobile spacing */}
              <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6 p-3 lg:p-4 bg-muted/50 rounded-lg">
                {displayLocation && (
                  <div className="flex items-start gap-2 lg:gap-3">
                    <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs lg:text-sm text-muted-foreground">Location</p>
                      <p className="font-medium text-sm lg:text-base truncate">{displayLocation}</p>
                    </div>
                  </div>
                )}
                {salary && (
                  <div className="flex items-start gap-2 lg:gap-3">
                    <DollarSign className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs lg:text-sm text-muted-foreground">Salary</p>
                      <p className="font-medium text-sm lg:text-base truncate">{salary}</p>
                    </div>
                  </div>
                )}
                {job.job_type && (
                  <div className="flex items-start gap-2 lg:gap-3">
                    <Briefcase className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs lg:text-sm text-muted-foreground">Job Type</p>
                      <p className="font-medium text-sm lg:text-base">{job.job_type}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 lg:gap-3">
                  <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs lg:text-sm text-muted-foreground">Posted</p>
                    <p className="font-medium text-sm lg:text-base">{new Date(job.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Mobile Share Button */}
              <Button 
                variant="outline" 
                className="w-full mb-4 sm:hidden" 
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Job
              </Button>

              {/* Route Info */}
              {job.dest_city && job.dest_state && (
                <div className="mb-4 lg:mb-6 p-3 lg:p-4 border rounded-lg">
                  <h3 className="font-semibold text-sm lg:text-base mb-1 lg:mb-2">Route Information</h3>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    <span className="font-medium text-foreground">Destination:</span> {job.dest_city}, {job.dest_state}
                  </p>
                </div>
              )}

              {/* Description */}
              {displayDescription && (
                <div className="mb-6 lg:mb-8">
                  <h2 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4">Job Description</h2>
                  <div 
                    className="prose prose-sm max-w-none text-muted-foreground text-sm lg:text-base"
                    dangerouslySetInnerHTML={{ __html: sanitizers.sanitizeHtml(displayDescription) }}
                  />
                </div>
              )}

              {/* Desktop CTA Buttons */}
              <div className="hidden lg:flex gap-3 pt-4 border-t">
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
          <div className="text-center pb-4">
            <Link to="/jobs">
              <Button variant="ghost" className="min-h-[44px]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Jobs
              </Button>
            </Link>
          </div>
        </div>

        {/* Sticky Mobile CTA */}
        <StickyApplyCTA
          applyUrl={applyUrl}
          onVoiceApply={handleVoiceApply}
          isVoiceConnected={isConnected}
          jobTitle={displayTitle}
          showVoiceButton={true}
        />

        {/* Voice Application Panel with Transcripts */}
        <VoiceApplicationPanel
          isConnected={isConnected}
          isSpeaking={isSpeaking}
          selectedJob={selectedJob}
          transcripts={transcripts}
          pendingUserTranscript={pendingUserTranscript}
          pendingAgentTranscript={pendingAgentTranscript}
          onEnd={endVoiceApplication}
        />
      </div>
    </div>
  );
};

export default JobDetailsPage;
