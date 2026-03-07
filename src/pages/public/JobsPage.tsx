import React from 'react';
import { buildBreadcrumbSchema } from '@/utils/breadcrumbSchema';
import { Building2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { PublicJobCard } from '@/components/public/PublicJobCard';
import { MobileFilterSheet } from '@/components/public/MobileFilterSheet';
import { DataLoadingStateHandler, HeroBackground, ActiveFilterChips, VoiceApplicationContainer, useVoiceApplication } from '@/components/shared';
import { 
  usePublicJobsPage,
  JobFiltersDesktop,
  JobsLoadMoreButton,
  JobsPageHeader,
  JobsResultsCount,
  JobsLoadingSkeleton
} from '@/features/jobs';
import type { PublicJob } from '@/features/jobs';
import jobsHero from '@/assets/hero/jobs-hero.png';

const JobsPageContent = () => {
  const {
    searchTerm, setSearchTerm,
    locationFilter, setLocationFilter,
    clientFilter, setClientFilter,
    sortBy, setSortBy,
    jobs, totalCount, locations, clients,
    isLoading, isFetchingMore, hasMore, error, loadMore
  } = usePublicJobsPage();

  const { startVoiceApplication, isVoiceConnectedToJob } = useVoiceApplication();

  const jobListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Job Listings on Apply AI",
    "description": "Browse open positions from top companies",
    "numberOfItems": totalCount || 0,
    "itemListElement": (jobs || []).slice(0, 10).map((job, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "JobPosting",
        "title": job.title || job.job_title,
        "datePosted": job.created_at,
        "hiringOrganization": {
          "@type": "Organization",
          "name": (job.clients?.name && job.clients.name !== 'Unassigned') ? job.clients.name : "Company"
        },
        "jobLocation": {
          "@type": "Place",
          "address": job.location || "Multiple Locations"
        },
        "url": `https://applyai.jobs/jobs/${job.id}`
      }
    }))
  };

  const breadcrumbs = buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Jobs', href: '/jobs' },
  ]);

  if (isLoading) {
    return <JobsLoadingSkeleton />;
  }

  const filterChips = [
    { label: `Search: "${searchTerm}"`, value: searchTerm, onClear: () => setSearchTerm('') },
    { label: locationFilter, value: locationFilter, onClear: () => setLocationFilter(''), emoji: '📍' },
    { label: clients.find(c => c.id === clientFilter)?.name || clientFilter, value: clientFilter, onClear: () => setClientFilter(''), emoji: '🏢' },
  ];

  return (
    <>
      <SEO
        title="Browse Jobs | Find Your Next Career Opportunity"
        description={`Explore ${totalCount || 200}+ open positions from top companies. Filter by location, company, and category. Apply instantly with Voice Apply technology.`}
        keywords="jobs, careers, job listings, job search, employment opportunities, hiring, open positions, CDL jobs, driver jobs"
        canonical="https://applyai.jobs/jobs"
        ogImage="https://applyai.jobs/og-jobs.png"
      />
      <StructuredData data={[jobListSchema, breadcrumbs]} />
      
      <div className="min-h-screen bg-background">
        <HeroBackground
          imageSrc={jobsHero}
          imageAlt="Diverse workforce professionals representing multiple industries"
          variant="compact"
          overlayVariant="dark"
          overlayOpacity={65}
        >
          <div className="container mx-auto px-4">
            <JobsPageHeader totalCount={totalCount} filteredCount={jobs.length} />
          </div>
        </HeroBackground>

        <div className="container mx-auto px-4 py-6 lg:py-8">
          <MobileFilterSheet
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            locationFilter={locationFilter} setLocationFilter={setLocationFilter}
            clientFilter={clientFilter} setClientFilter={setClientFilter}
            sortBy={sortBy} setSortBy={setSortBy}
            locations={locations} clients={clients} totalCount={totalCount}
          />

          <JobFiltersDesktop
            searchTerm={searchTerm} onSearchChange={setSearchTerm}
            locationFilter={locationFilter} onLocationChange={setLocationFilter}
            clientFilter={clientFilter} onClientChange={setClientFilter}
            sortBy={sortBy} onSortChange={setSortBy}
            locations={locations} clients={clients}
          />

          <ActiveFilterChips
            chips={filterChips}
            onClearAll={() => { setSearchTerm(''); setLocationFilter(''); setClientFilter(''); }}
          />

          <JobsResultsCount filteredCount={jobs.length} totalCount={totalCount} />

          <DataLoadingStateHandler
            data={jobs} isLoading={false} isError={!!error} error={error}
            emptyCheck={(data) => data.length === 0}
            emptyIcon={Building2} emptyTitle="No Jobs Found"
            emptyDescription="Try adjusting your search criteria or check back later."
            dataLabel="jobs" className="mt-6"
          >
            {(jobsData: PublicJob[]) => (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  {jobsData.map((job) => (
                    <PublicJobCard 
                      key={job.id} 
                      job={job}
                      onVoiceApply={startVoiceApplication}
                      isVoiceConnected={isVoiceConnectedToJob(job.id)}
                    />
                  ))}
                </div>
                {hasMore && (
                  <JobsLoadMoreButton onClick={loadMore} isLoading={isFetchingMore} />
                )}
              </>
            )}
          </DataLoadingStateHandler>
        </div>
      </div>
    </>
  );
};

const JobsPage = () => (
  <VoiceApplicationContainer>
    <JobsPageContent />
  </VoiceApplicationContainer>
);

export default JobsPage;
