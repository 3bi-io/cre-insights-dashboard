import React from 'react';
import { Building2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { PublicJobCard } from '@/components/public/PublicJobCard';
import { MobileFilterSheet } from '@/components/public/MobileFilterSheet';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { VoiceApplicationPanel } from '@/features/elevenlabs';
import { DataLoadingStateHandler, HeroBackground } from '@/components/shared';
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

const JobsPage = () => {
  const {
    searchTerm,
    setSearchTerm,
    locationFilter,
    setLocationFilter,
    clientFilter,
    setClientFilter,
    sortBy,
    setSortBy,
    jobs,
    totalCount,
    locations,
    clients,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    loadMore
  } = usePublicJobsPage();

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

  // Build ItemList structured data for job listings
  const jobListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Job Listings on ATS.me",
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
        "url": `https://ats.me/jobs/${job.id}`
      }
    }))
  };

  // Show loading skeleton for initial load
  if (isLoading) {
    return <JobsLoadingSkeleton />;
  }

  return (
    <>
      <SEO
        title="Browse Jobs | Find Your Next Career Opportunity"
        description={`Explore ${totalCount || 200}+ open positions from top companies. Filter by location, company, and category. Apply instantly with Voice Apply technology.`}
        keywords="jobs, careers, job listings, job search, employment opportunities, hiring, open positions, CDL jobs, driver jobs"
        canonical="https://ats.me/jobs"
        ogImage="https://ats.me/og-jobs.png"
      />
      <StructuredData data={jobListSchema} />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <HeroBackground
          imageSrc={jobsHero}
          imageAlt="Diverse workforce professionals representing multiple industries"
          variant="compact"
          overlayVariant="gradient"
          overlayOpacity={55}
        >
          <div className="container mx-auto px-4">
            <JobsPageHeader totalCount={totalCount} filteredCount={jobs.length} />
          </div>
        </HeroBackground>

        <div className="container mx-auto px-4 py-6 lg:py-8">
          
          {/* Mobile Filter Sheet */}
          <MobileFilterSheet
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            clientFilter={clientFilter}
            setClientFilter={setClientFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            locations={locations}
            clients={clients}
            totalCount={totalCount}
          />

          {/* Desktop Filters */}
          <JobFiltersDesktop
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            locationFilter={locationFilter}
            onLocationChange={setLocationFilter}
            clientFilter={clientFilter}
            onClientChange={setClientFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            locations={locations}
            clients={clients}
          />

          {/* Results Count */}
          <JobsResultsCount filteredCount={jobs.length} totalCount={totalCount} />

          {/* Job Listings with DataLoadingStateHandler */}
          <DataLoadingStateHandler
            data={jobs}
            isLoading={false}
            isError={!!error}
            error={error}
            emptyCheck={(data) => data.length === 0}
            emptyIcon={Building2}
            emptyTitle="No Jobs Found"
            emptyDescription="Try adjusting your search criteria or check back later."
            dataLabel="jobs"
            className="mt-6"
          >
            {(jobsData: PublicJob[]) => (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {jobsData.map((job) => (
                    <PublicJobCard 
                      key={job.id} 
                      job={job}
                      onVoiceApply={startVoiceApplication}
                      isVoiceConnected={isConnected && selectedJob?.jobId === job.id}
                    />
                  ))}
                </div>
                
                {/* Load More Button */}
                {hasMore && (
                  <JobsLoadMoreButton 
                    onClick={loadMore} 
                    isLoading={isFetchingMore} 
                  />
                )}
              </>
            )}
          </DataLoadingStateHandler>
          
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
    </>
  );
};

export default JobsPage;
