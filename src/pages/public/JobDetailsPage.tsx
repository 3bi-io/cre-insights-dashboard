import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
import { MapPin, DollarSign, Building2, Clock, Briefcase, ArrowLeft, Mic } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { StructuredData, buildJobPostingSchema, buildBreadcrumbSchema, getSalaryUnitText } from '@/components/StructuredData';
import { useJobDetails } from '@/hooks/useJobDetails';
import { extractExperienceFromDescription, extractQualificationsFromDescription } from '@/utils/jobSchemaExtraction';
import { RelatedJobs } from '@/components/public/RelatedJobs';
import { StickyApplyCTA } from '@/components/public/StickyApplyCTA';
import { VoiceApplicationContainer, useVoiceApplication } from '@/components/shared';
import { sanitizers } from '@/utils/validation';
import { getDisplayCompanyName, formatSalary } from '@/utils/jobDisplayUtils';
import { renderJobDescription } from '@/utils/markdownRenderer';
import { JobShareActions } from '@/features/jobs/components/public/JobShareActions';
import { JobSidebar } from '@/features/jobs/components/public/JobSidebar';

const JobDetailsContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading, error } = useJobDetails(id);
  const { isConnected, startVoiceApplication } = useVoiceApplication();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title={`Job Opening - Apply AI`}
          description="View this job opportunity and apply today on Apply AI."
          canonical={`https://applyai.jobs/jobs/${id}`}
          noindex
        />
        <div className="container mx-auto px-4 py-6 lg:py-8 max-w-6xl">
          <Skeleton className="h-5 w-32 mb-4 lg:mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card><CardContent className="p-6 lg:p-8">
                <Skeleton className="h-8 w-3/4 mb-3" />
                <Skeleton className="h-5 w-1/2 mb-6" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent></Card>
            </div>
            <div><Skeleton className="h-64 rounded-xl" /></div>
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
          <Card><CardContent className="p-6 lg:p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h1 className="text-xl lg:text-2xl font-bold mb-2">Job Not Found</h1>
            <p className="text-muted-foreground mb-6">This job listing is no longer available.</p>
            <Button onClick={() => navigate('/jobs')}><ArrowLeft className="w-4 h-4 mr-2" />Browse All Jobs</Button>
          </CardContent></Card>
        </div>
      </div>
    );
  }

  const displayTitle = job.title || job.job_title || 'Job Opening';
  const displayLocation = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : '');
  const displayDescription = job.job_summary || job.job_description || '';
  const companyName = getDisplayCompanyName(job);
  const canonicalUrl = `https://applyai.jobs/jobs/${job.id}`;
  const isExternalApply = !!job.apply_url && !job.apply_url.includes('applyai.jobs');
  const applyUrl = job.apply_url
    ? (job.apply_url.includes('applyai.jobs')
        ? (() => { const u = new URL(job.apply_url); return u.pathname + u.search; })()
        : job.apply_url)
    : `/apply?job_id=${job.id}`;
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);

  const handleVoiceApply = () => {
    startVoiceApplication({
      jobId: job.id,
      jobTitle: displayTitle,
      jobDescription: displayDescription || `This is a ${displayTitle} position`,
      company: companyName,
      location: displayLocation || 'Various locations',
      salary: salary || 'Competitive salary',
      organizationId: job.organization_id || undefined,
      clientId: job.client_id || undefined,
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
    jobLocation: displayLocation ? { city: job.city || '', state: job.state || '', country: 'US', postalCode: job.zip || undefined } : undefined,
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
        canonical={canonicalUrl} ogImage="https://applyai.jobs/og-jobs.png" ogType="article"
        articlePublishedTime={job.created_at} articleModifiedTime={job.updated_at}
      />
      <StructuredData data={[jobPostingSchema, breadcrumbSchema]} />

      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-6xl">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4 lg:mb-6 overflow-x-auto whitespace-nowrap pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground transition-colors shrink-0">Home</Link>
          <span className="shrink-0">/</span>
          <Link to="/jobs" className="hover:text-foreground transition-colors shrink-0">Jobs</Link>
          <span className="shrink-0">/</span>
          <span className="text-foreground truncate max-w-[200px] lg:max-w-none">{displayTitle}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6 lg:p-8">
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

                <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-muted/50 rounded-xl">
                  {displayLocation && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary/70 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0"><p className="text-xs text-muted-foreground">Location</p><p className="font-medium text-sm truncate">{displayLocation}</p></div>
                    </div>
                  )}
                  {salary && (
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 text-success/70 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0"><p className="text-xs text-muted-foreground">Salary</p><p className="font-medium text-sm truncate">{salary}</p></div>
                    </div>
                  )}
                  {job.job_type && (
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0"><p className="text-xs text-muted-foreground">Type</p><p className="font-medium text-sm">{job.job_type}</p></div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">Posted</p><p className="font-medium text-sm">{new Date(job.created_at).toLocaleDateString()}</p></div>
                  </div>
                </div>

                {job.dest_city && job.dest_state && (
                  <div className="mb-6 p-4 border rounded-lg">
                    <h3 className="font-semibold text-sm mb-1">Route Information</h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Destination:</span> {job.dest_city}, {job.dest_state}
                    </p>
                  </div>
                )}

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
                      dangerouslySetInnerHTML={{ __html: renderJobDescription(displayDescription) }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <RelatedJobs currentJobId={job.id} clientId={job.client_id} categoryId={job.category_id} organizationId={job.organization_id} />

            <div className="text-center pb-4">
              <Link to="/jobs">
                <Button variant="ghost" className="min-h-[44px]"><ArrowLeft className="w-4 h-4 mr-2" />Back to All Jobs</Button>
              </Link>
            </div>
          </div>

          <JobSidebar
            title={displayTitle}
            company={companyName}
            logoUrl={job.clients?.logo_url}
            salary={salary}
            location={displayLocation}
            applyUrl={applyUrl}
            isExternalApply={isExternalApply}
            canonicalUrl={canonicalUrl}
            onVoiceApply={handleVoiceApply}
            isVoiceConnected={isConnected}
            showVoiceButton={!isExternalApply}
          />
        </div>

        {/* Mobile share row — native share first */}
        <div className="flex gap-2 mt-4 lg:hidden">
          {typeof navigator !== 'undefined' && navigator.share ? (
            <Button variant="outline" size="sm" onClick={async () => { try { await navigator.share({ title: displayTitle, url: canonicalUrl }); } catch {} }} className="flex-1 min-h-[44px]">
              Share
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`, '_blank')} className="flex-1 min-h-[44px]">
                LinkedIn
              </Button>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(canonicalUrl); }} className="flex-1 min-h-[44px]">
                Copy Link
              </Button>
            </>
          )}
        </div>

        <StickyApplyCTA applyUrl={applyUrl} isExternalApply={isExternalApply} onVoiceApply={handleVoiceApply} isVoiceConnected={isConnected} jobTitle={displayTitle} showVoiceButton={!isExternalApply} />
      </div>
    </div>
  );
};

const JobDetailsPage = () => (
  <VoiceApplicationContainer>
    <JobDetailsContent />
  </VoiceApplicationContainer>
);

export default JobDetailsPage;
