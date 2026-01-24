import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Building2, Loader2 } from 'lucide-react';
import { PublicJobCard } from '@/components/public/PublicJobCard';
import { MobileFilterSheet } from '@/components/public/MobileFilterSheet';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { VoiceApplicationPanel } from '@/features/elevenlabs';
import { usePaginatedPublicJobs } from '@/hooks/usePaginatedPublicJobs';

const JobsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'salary-high' | 'salary-low'>('recent');
  
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

  const {
    jobs,
    totalCount,
    isLoading,
    isFetchingMore,
    hasMore,
    loadMore
  } = usePaginatedPublicJobs({
    searchTerm,
    locationFilter,
    categoryFilter,
    clientFilter
  });

  // Fetch all clients that have active job listings via public view
  const { data: allClients } = useQuery({
    queryKey: ['public-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_client_info')
        .select('id, name, logo_url')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Get unique locations for filter
  const locations = React.useMemo(() => {
    if (!jobs) return [];
    const locationSet = new Set<string>();
    jobs.forEach(job => {
      if (job.city && job.state) locationSet.add(`${job.city}, ${job.state}`);
      if (job.location) locationSet.add(job.location);
    });
    return Array.from(locationSet).sort();
  }, [jobs]);

  // Use the separate clients query for the dropdown
  const clients = React.useMemo(() => {
    return allClients || [];
  }, [allClients]);

  const filteredJobs = React.useMemo(() => {
    if (!jobs) return [];
    let filtered = jobs.filter(job => {
      if (categoryFilter && job.job_categories?.name !== categoryFilter) return false;
      return true;
    });

    // Apply sorting
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => (a.title || a.job_title || '').localeCompare(b.title || b.job_title || ''));
        break;
      case 'salary-high':
        filtered.sort((a, b) => {
          const aMax = (a as any).max_salary || (a as any).salary_max || 0;
          const bMax = (b as any).max_salary || (b as any).salary_max || 0;
          return bMax - aMax;
        });
        break;
      case 'salary-low':
        filtered.sort((a, b) => {
          const aMin = (a as any).min_salary || (a as any).salary_min || 0;
          const bMin = (b as any).min_salary || (b as any).salary_min || 0;
          return aMin - bMin;
        });
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  }, [jobs, categoryFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          <div className="mb-6 lg:mb-8">
            <Skeleton className="h-8 lg:h-10 w-48 lg:w-64 mb-3 lg:mb-4" />
            <Skeleton className="h-5 lg:h-6 w-64 lg:w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Build ItemList structured data for job listings
  const jobListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Job Listings on ATS.me",
    "description": "Browse open positions from top companies",
    "numberOfItems": totalCount || 0,
    "itemListElement": (filteredJobs || []).slice(0, 10).map((job, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "JobPosting",
        "title": job.title || job.job_title,
        "datePosted": job.created_at,
        "hiringOrganization": {
          "@type": "Organization",
          "name": (job.clients?.name && job.clients.name !== 'Unassigned') ? job.clients.name : (job.organizations?.name || "Company")
        },
        "jobLocation": {
          "@type": "Place",
          "address": job.location || "Multiple Locations"
        },
        "url": `https://ats.me/jobs/${job.id}`
      }
    }))
  };

  return (
    <>
      <SEO
        title="Browse Jobs | Find Your Next Career Opportunity"
        description={`Explore ${totalCount || 200}+ open positions from top companies. Filter by location, company, and category. Apply instantly with Voice Apply technology.`}
        keywords="jobs, careers, job listings, job search, employment opportunities, hiring, open positions, CDL jobs, driver jobs"
        canonical="https://ats.me/jobs"
      />
      <StructuredData data={jobListSchema} />
      <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 lg:mb-4">
            Find Your Next Opportunity
          </h1>
          <p className="text-base lg:text-xl text-muted-foreground mb-4 lg:mb-6">
            Discover job openings from top companies
          </p>
          
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
          <div className="hidden lg:block">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="job-search"
                    name="job-search"
                    placeholder="Search jobs by title, company, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select name="company-filter" value={clientFilter || "all"} onValueChange={(val) => setClientFilter(val === "all" ? "" : val)}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">All Companies</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4">
                <Select name="location-filter" value={locationFilter || "all"} onValueChange={(val) => setLocationFilter(val === "all" ? "" : val)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select name="sort-by" value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                    <SelectItem value="salary-high">Salary (High to Low)</SelectItem>
                    <SelectItem value="salary-low">Salary (Low to High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mt-4 lg:mt-0">
            <p className="text-sm lg:text-base text-muted-foreground">
              Showing {filteredJobs.length} of {totalCount} job{totalCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Job Listings */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg lg:text-xl font-semibold mb-2">No Jobs Found</h3>
              <p className="text-sm lg:text-base text-muted-foreground">
                Try adjusting your search criteria or check back later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredJobs.map((job) => (
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
              <div className="flex justify-center mt-6 lg:mt-8 pb-6">
                <Button
                  onClick={loadMore}
                  disabled={isFetchingMore}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto min-h-[48px]"
                >
                  {isFetchingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>Load More Jobs</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
        
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
