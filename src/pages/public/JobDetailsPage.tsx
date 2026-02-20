import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
import { 
  MapPin, DollarSign, Building2, Clock, Briefcase, 
  ArrowLeft, ExternalLink, Share2, Mic, Linkedin, Copy, Check
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
import { toast } from 'sonner';

const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading, error } = useJobDetails(id);
  const [copied, setCopied] = React.useState(false);
  
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
        <div className="container mx-auto px-4 py-6 lg:py-8 max-w-6xl">
          <Skeleton className="h-5 w-32 mb-4 lg:mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6 lg:p-8">
                  <Skeleton className="h-8 w-3/4 mb-3" />
                  <Skeleton className="h-5 w-1/2 mb-6" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Job Not Found" description="The job listing you're looking for is no longer available." noindex />
        <div className="container mx-auto px-4 py-6 lg:py-8 max-w-4xl">
          <Card>
            <CardContent className="p-6 lg:p-8 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h1 className="text-xl lg:text-2xl font-bold mb-2">Job Not Found</h1>
              <p className="text-muted-foreground mb-6">This job listing is no longer available.</p>
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
  const canonicalUrl = `https://applyai.jobs/jobs/${job.id}`;
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
        await navigator.share({ title: displayTitle, text: `Check out this job: ${displayTitle} at ${companyName}`, url: canonicalUrl });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(canonicalUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`, '_blank');
  };

  const shareOnX = () => {
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(`${displayTitle} at ${companyName}`)}&url=${encodeURIComponent(canonicalUrl)}`, '_blank');
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

  const experienceData = extractExperienceFromDescription(displayDescription);
  const qualificationsData = extractQualificationsFromDescription(displayDescription);

  const jobPostingSchema = buildJobPostingSchema({
    id: job.id, title: displayTitle, description: displayDescription,
    datePosted: job.created_at,
    validThrough: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    employmentType: job.job_type || 'FULL_TIME',
    hiringOrganization: companyName,
    hiringOrganizationLogo: job.clients?.logo_url,
    jobLocation: displayLocation ? { city: job.city || '', state: job.state || '', country: 'US' } : undefined,
    baseSalary: (job.salary_min || job.salary_max) ? {
      minValue: job.salary_min || undefined, maxValue: job.salary_max || undefined,
      currency: 'USD', unitText: getSalaryUnitText(job.salary_type),
    } : undefined,
    directApply: true, applicationUrl: `https://applyai.jobs${applyUrl}`,
    experienceRequirements: experienceData,
    qualifications: qualificationsData.summary,
    skills: qualificationsData.skills,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://applyai.jobs' },
    { name: 'Jobs', url: 'https://applyai.jobs/jobs' },
    { name: displayTitle, url: canonicalUrl },
  ]);

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <SEO
        title={`${displayTitle} at ${companyName}`}
        description={displayDescription?.substring(0, 160) || `Apply for ${displayTitle} at ${companyName}. ${displayLocation ? `Location: ${displayLocation}.` : ''}`}
        keywords={`${displayTitle}, ${companyName}, jobs, careers, ${job.job_categories?.name || ''}`}
        canonical={canonicalUrl} ogImage="https://ats.me/og-jobs.png" ogType="article"
        articlePublishedTime={job.created_at} articleModifiedTime={job.updated_at}
      />
      <StructuredData data={[jobPostingSchema, breadcrumbSchema]} />

      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4 lg:mb-6 overflow-x-auto whitespace-nowrap pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground transition-colors shrink-0">Home</Link>
          <span className="shrink-0">/</span>
          <Link to="/jobs" className="hover:text-foreground transition-colors shrink-0">Jobs</Link>
          <span className="shrink-0">/</span>
          <span className="text-foreground truncate max-w-[200px] lg:max-w-none">{displayTitle}</span>
        </nav>

        {/* 2-Column Layout: Content + Sticky Sidebar */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content (left 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
                  <LogoAvatar size="2xl">
                    {job.clients?.logo_url ? (
                      <LogoAvatarImage src={job.clients.logo_url} alt={`${companyName} logo`} />
                    ) : (
                      <LogoAvatarFallback iconSize="xl" />
                    )}
                  </LogoAvatar>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 leading-tight">{displayTitle}</h1>
                    <p className="text-base lg:text-lg text-muted-foreground mb-3">{companyName}</p>
                    <div className="flex gap-2 flex-wrap">
                      {job.job_categories?.name && <Badge variant="secondary">{job.job_categories.name}</Badge>}
                      {job.job_type && <Badge variant="outline">{job.job_type}</Badge>}
                      {job.experience_level && <Badge variant="outline">{job.experience_level}</Badge>}
                    </div>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-muted/50 rounded-xl">
                  {displayLocation && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary/70 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-medium text-sm truncate">{displayLocation}</p>
                      </div>
                    </div>
                  )}
                  {salary && (
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 text-success/70 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Salary</p>
                        <p className="font-medium text-sm truncate">{salary}</p>
                      </div>
                    </div>
                  )}
                  {job.job_type && (
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="font-medium text-sm">{job.job_type}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Posted</p>
                      <p className="font-medium text-sm">{new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Route Info */}
                {job.dest_city && job.dest_state && (
                  <div className="mb-6 p-4 border rounded-lg">
                    <h3 className="font-semibold text-sm mb-1">Route Information</h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Destination:</span> {job.dest_city}, {job.dest_state}
                    </p>
                  </div>
                )}

                {/* Description */}
                {displayDescription && (
                  <div>
                    <h2 className="text-lg lg:text-xl font-semibold mb-4">Job Description</h2>
                    <div 
                      className="prose prose-sm lg:prose-base dark:prose-invert max-w-none
                        prose-headings:font-semibold prose-headings:text-foreground
                        prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-4
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        prose-ul:my-4 prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-1.5
                        prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-5 prose-ol:space-y-1.5
                        prose-li:text-foreground/90 prose-li:leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sanitizers.sanitizeHtml(displayDescription) }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Jobs */}
            <RelatedJobs currentJobId={job.id} clientId={job.client_id} categoryId={job.category_id} organizationId={job.organization_id} />

            <div className="text-center pb-4">
              <Link to="/jobs">
                <Button variant="ghost" className="min-h-[44px]">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Jobs
                </Button>
              </Link>
            </div>
          </div>

          {/* Sticky Sidebar (right 1/3 - desktop only) */}
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              {/* Apply Card */}
              <Card className="border-primary/20 shadow-md">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <LogoAvatar size="xl" className="mx-auto mb-3">
                      {job.clients?.logo_url ? (
                        <LogoAvatarImage src={job.clients.logo_url} alt={`${companyName} logo`} />
                      ) : (
                        <LogoAvatarFallback iconSize="lg" />
                      )}
                    </LogoAvatar>
                    <h3 className="font-semibold text-lg">{displayTitle}</h3>
                    <p className="text-sm text-muted-foreground">{companyName}</p>
                  </div>

                  {salary && (
                    <div className="flex items-center gap-2 justify-center text-sm bg-success/10 text-success rounded-lg px-3 py-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">{salary}</span>
                    </div>
                  )}

                  {displayLocation && (
                    <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{displayLocation}</span>
                    </div>
                  )}

                  <Link to={applyUrl} className="block">
                    <Button className="w-full min-h-[48px] text-base font-semibold" size="lg">
                      Apply Now
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleVoiceApply}
                    disabled={isConnected}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Apply with Voice
                  </Button>
                </CardContent>
              </Card>

              {/* Share Card */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Share this job</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={shareOnLinkedIn} className="flex-1" aria-label="Share on LinkedIn">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={shareOnX} className="flex-1" aria-label="Share on X">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-1" aria-label="Copy link">
                      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare} className="flex-1 sm:hidden" aria-label="Share">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile share row */}
        <div className="flex gap-2 mt-4 lg:hidden">
          <Button variant="outline" size="sm" onClick={shareOnLinkedIn} className="flex-1">
            <Linkedin className="h-4 w-4 mr-1.5" /> LinkedIn
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-1">
            {copied ? <Check className="h-4 w-4 mr-1.5 text-success" /> : <Copy className="h-4 w-4 mr-1.5" />}
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} className="flex-1">
            <Share2 className="h-4 w-4 mr-1.5" /> Share
          </Button>
        </div>

        {/* Sticky Mobile CTA */}
        <StickyApplyCTA applyUrl={applyUrl} onVoiceApply={handleVoiceApply} isVoiceConnected={isConnected} jobTitle={displayTitle} showVoiceButton={true} />

        {/* Voice Application Panel */}
        <VoiceApplicationPanel isConnected={isConnected} isSpeaking={isSpeaking} selectedJob={selectedJob} transcripts={transcripts} pendingUserTranscript={pendingUserTranscript} pendingAgentTranscript={pendingAgentTranscript} onEnd={endVoiceApplication} />
      </div>
    </div>
  );
};

export default JobDetailsPage;
