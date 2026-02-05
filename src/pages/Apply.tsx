import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ApplicationHeader } from '@/components/apply/ApplicationHeader';
import { ApplicationForm } from '@/components/apply/ApplicationForm';
import { useApplyContext } from '@/hooks/useApplyContext';
import { SEO } from '@/components/SEO';
import { StructuredData, buildBreadcrumbSchema } from '@/components/StructuredData';

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
    isLoading 
  } = useApplyContext();

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
      { name: 'Home', url: 'https://ats.me/' },
      { name: 'Jobs', url: 'https://ats.me/jobs' },
      { name: seoContent.title, url: `https://ats.me/apply${searchParams}` },
    ]);
  }, [seoContent.title]);

  // Canonical URL
  const canonicalUrl = useMemo(() => {
    const searchParams = typeof window !== 'undefined' ? window.location.search : '';
    return `https://ats.me/apply${searchParams}`;
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
            />
            
            {/* Application Form */}
            <main>
              <ApplicationForm clientName={clientName} clientLogoUrl={clientLogoUrl} />
            </main>
            
            {/* Back Navigation */}
            <nav className="text-center mt-6 pb-6" aria-label="Page navigation">
              <Link 
                to="/" 
                className="text-primary hover:underline inline-flex items-center gap-2 text-base sm:text-sm touch-manipulation py-2 px-4 rounded-md hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Home
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Apply;
