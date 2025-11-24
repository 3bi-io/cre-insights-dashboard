import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, DollarSign, Building2, Clock, Mic, MicOff, Loader2 } from 'lucide-react';
import { PublicJobCard } from '@/components/public/PublicJobCard';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { VoiceConnectionStatus } from '@/features/elevenlabs';
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

  // Fetch all clients that have job listings
  const { data: allClients } = useQuery({
    queryKey: ['public-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      // Filter to only clients that have at least one job listing
      const clientIds = data?.map(client => client.id) || [];
      const { data: jobCounts } = await supabase
        .from('job_listings')
        .select('client_id')
        .in('client_id', clientIds);
      
      const clientsWithJobs = new Set(jobCounts?.map(j => j.client_id).filter(Boolean));
      return data?.filter(client => clientsWithJobs.has(client.id)) || [];
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
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Find Your Next Opportunity
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Discover job openings from top companies across all industries
          </p>
          
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search jobs by title, company, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="__ALL__">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="__ALL__">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="salary-high">Salary (High to Low)</SelectItem>
                  <SelectItem value="salary-low">Salary (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Showing {filteredJobs.length} of {totalCount} job{totalCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Job Listings */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Jobs Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or check back later for new opportunities.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMore}
                  disabled={isFetchingMore}
                  variant="outline"
                  size="lg"
                >
                  {isFetchingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading more jobs...
                    </>
                  ) : (
                    <>Load More Jobs</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
        
        {/* Voice Application Status */}
        {isConnected && selectedJob && (
          <Card className="fixed bottom-8 right-8 w-80 shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Voice Application</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={endVoiceApplication}
                >
                  <MicOff className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium">{selectedJob.jobTitle}</div>
                  <div className="text-xs text-muted-foreground">{selectedJob.company}</div>
                </div>
                <VoiceConnectionStatus 
                  isConnected={isConnected}
                  isSpeaking={isSpeaking}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JobsPage;