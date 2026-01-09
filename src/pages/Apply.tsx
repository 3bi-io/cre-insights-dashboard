import React from 'react';
import { Link } from 'react-router-dom';
import { ApplicationHeader } from '@/components/apply/ApplicationHeader';
import { ApplicationForm } from '@/components/apply/ApplicationForm';
import { useApplyContext } from '@/hooks/useApplyContext';
import { SEO } from '@/components/SEO';
import { StructuredData, buildBreadcrumbSchema } from '@/components/StructuredData';

const Apply = () => {
  const { 
    jobTitle, 
    organizationName, 
    location, 
    logoUrl, 
    source,
    isLoading 
  } = useApplyContext();

  const pageTitle = jobTitle ? `Apply for ${jobTitle}` : 'Quick Apply';
  const pageDescription = jobTitle && organizationName 
    ? `Apply for ${jobTitle} at ${organizationName}. Fast, mobile-friendly application. Get a response within 24 hours.`
    : 'Submit your job application in under 2 minutes. Our streamlined process gets you in front of recruiters faster.';

  const breadcrumbData = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://ats.me/' },
    { name: 'Jobs', url: 'https://ats.me/jobs' },
    { name: pageTitle, url: `https://ats.me/apply${window.location.search}` },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords="job application, apply online, quick apply, driver application, CDL jobs"
        canonical={`https://ats.me/apply${window.location.search}`}
        ogType="website"
      />
      <StructuredData data={breadcrumbData} />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <ApplicationHeader 
            jobTitle={jobTitle}
            organizationName={organizationName}
            location={location}
            logoUrl={logoUrl}
            source={source}
            isLoading={isLoading}
          />
          <ApplicationForm organizationName={organizationName} />
          <div className="text-center mt-6 pb-6">
            <Link 
              to="/" 
              className="text-primary hover:underline inline-flex items-center gap-2 text-base sm:text-sm touch-manipulation py-2 px-4 rounded-md hover:bg-accent transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Apply;
