import React, { useMemo } from 'react';
import { ApplicationHeader } from '@/components/apply/ApplicationHeader';
import { ApplicationForm } from '@/components/apply/ApplicationForm';
import { SocialExpressForm } from '@/components/apply/SocialExpressForm';
import { SimulatedApplicationForm } from '@/components/apply/SimulatedApplicationForm';
import { useApplyContext } from '@/hooks/useApplyContext';
import { useGeoBlocking } from '@/contexts/GeoBlockingContext';
import { useSourceDetection } from '@/hooks/useSourceDetection';
import { SEO } from '@/components/SEO';
import { StructuredData, buildBreadcrumbSchema } from '@/components/StructuredData';
import ZipRecruiterPixel from '@/components/tracking/ZipRecruiterPixel';

/**
 * Apply Page - Quick application form for job seekers
 * Mobile-first design with multi-step wizard
 */
const Apply = () => {
  const { 
    jobTitle, 
    clientName,
    clientLogoUrl,
    location, 
    source,
    jobListingId,
    industryVertical,
    isLoading 
  } = useApplyContext();

  const { isOutsideAmericas, country, countryCode } = useGeoBlocking();
  const { isSocialTraffic } = useSourceDetection();

  // Memoize SEO content to prevent unnecessary recalculations
  const seoContent = useMemo(() => {
    const title = jobTitle ? `Apply for ${jobTitle}` : 'Quick Apply';
    const description = jobTitle && clientName 
      ? `Apply for ${jobTitle} at ${clientName}. Fast, mobile-friendly application. Get a response within 24 hours.`
      : 'Submit your job application in under 2 minutes. Our streamlined process gets you in front of recruiters faster.';
    
    return { title, description };
  }, [jobTitle, clientName]);

  // Memoize breadcrumb schema
  const breadcrumbData = useMemo(() => {
    const searchParams = typeof window !== 'undefined' ? window.location.search : '';
    return buildBreadcrumbSchema([
      { name: 'Home', url: 'https://applyai.jobs/' },
      { name: 'Jobs', url: 'https://applyai.jobs/jobs' },
      { name: seoContent.title, url: `https://applyai.jobs/apply${searchParams}` },
    ]);
  }, [seoContent.title]);

  // Canonical URL
  const canonicalUrl = useMemo(() => {
    const searchParams = typeof window !== 'undefined' ? window.location.search : '';
    return `https://applyai.jobs/apply${searchParams}`;
  }, []);

  return (
    <>
      <SEO
        title={seoContent.title}
        description={seoContent.description}
        keywords="job application, apply online, quick apply, driver application, CDL jobs"
        canonical={canonicalUrl}
        ogType="website"
      />
      <StructuredData data={breadcrumbData} />
      
      <div className="h-full overflow-y-auto bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="max-w-2xl mx-auto">
            {/* Application Header */}
            <ApplicationHeader 
              jobTitle={jobTitle}
              clientName={clientName}
              clientLogoUrl={clientLogoUrl}
              location={location}
              source={source}
              isLoading={isLoading}
              isExpressMode={isSocialTraffic && !isOutsideAmericas}
            />
            
            {/* Application Form — simulation mode for non-Americas users, express for Meta traffic */}
            <main>
              {isOutsideAmericas ? (
                <SimulatedApplicationForm
                  clientName={clientName}
                  country={country}
                  countryCode={countryCode}
                  jobListingId={jobListingId}
                  industryVertical={industryVertical}
                />
              ) : isMetaTraffic ? (
                <SocialExpressForm clientName={clientName} clientLogoUrl={clientLogoUrl} industryVertical={industryVertical} />
              ) : (
                <ApplicationForm clientName={clientName} clientLogoUrl={clientLogoUrl} industryVertical={industryVertical} />
              )}
            </main>
            
          </div>
        </div>
      </div>
      {/* Only fire pixel for real (non-simulated) submissions */}
      {!isOutsideAmericas && <ZipRecruiterPixel />}
    </>
  );
};

export default Apply;
