import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, DollarSign, Building2, Clock, Mic, MicOff } from 'lucide-react';
import { PublicJobCard } from '@/components/public/PublicJobCard';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { VoiceConnectionStatus } from '@/features/elevenlabs';

const JobsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const {
    isConnected,
    selectedJob,
    isSpeaking,
    startVoiceApplication,
    endVoiceApplication,
  } = useElevenLabsVoice();

  // Fetch all public job listings with voice agents
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['public-jobs', searchTerm, locationFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('job_listings')
        .select(`
          *,
          organizations!inner(
            name, 
            slug,
            id
          ),
          job_categories(name),
          clients(name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%,job_summary.ilike.%${searchTerm}%`);
      }

      // Apply location filter
      if (locationFilter && locationFilter !== '__ALL__') {
        query = query.or(`city.ilike.%${locationFilter}%,state.ilike.%${locationFilter}%,location.ilike.%${locationFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch voice agents for organizations
      if (data && data.length > 0) {
        const orgIds = [...new Set(data.map(job => job.organizations?.id).filter(Boolean))];
        const { data: voiceAgents } = await supabase
          .from('voice_agents')
          .select('*')
          .in('organization_id', orgIds)
          .eq('is_active', true);
        
        // Attach voice agents to jobs
        return data.map(job => ({
          ...job,
          voiceAgent: voiceAgents?.find(va => va.organization_id === job.organizations?.id)
        }));
      }
      
      return data;
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

  const filteredJobs = React.useMemo(() => {
    if (!jobs) return [];
    return jobs.filter(job => {
      if (categoryFilter && job.job_categories?.name !== categoryFilter) return false;
      return true;
    });
  }, [jobs, categoryFilter]);

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
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search jobs by title, company, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
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