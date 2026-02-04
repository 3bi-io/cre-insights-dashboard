import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ApplyContext {
  jobTitle: string | null;
  clientName: string | null;
  location: string | null;
  jobListingId: string | null;
  source: string | null;
  isLoading: boolean;
}

export const useApplyContext = (): ApplyContext => {
  const [searchParams] = useSearchParams();
  const [context, setContext] = useState<ApplyContext>({
    jobTitle: null,
    clientName: null,
    location: null,
    jobListingId: null,
    source: null,
    isLoading: true,
  });

  useEffect(() => {
    const fetchContext = async () => {
      // Get job_listing_id from various param names
      const jobListingId = searchParams.get('job_listing_id') || 
                          searchParams.get('jobListingId') || 
                          searchParams.get('job') ||
                          searchParams.get('job_id') ||
                          searchParams.get('jobId');

      // Get source from utm_source parameter
      const utmSource = searchParams.get('utm_source') || 
                        searchParams.get('utmSource') || 
                        searchParams.get('source');

      if (jobListingId) {
        // Fetch job listing with client only (org info excluded for privacy)
        const { data: jobListing } = await supabase
          .from('job_listings')
          .select(`
            id,
            title,
            city,
            state,
            clients (
              id,
              name
            )
          `)
          .eq('id', jobListingId)
          .maybeSingle();

        if (jobListing) {
          const client = jobListing.clients as any;
          
          setContext({
            jobTitle: jobListing.title,
            clientName: client?.name || null,
            location: jobListing.city && jobListing.state 
              ? `${jobListing.city}, ${jobListing.state}` 
              : null,
            jobListingId: jobListing.id,
            source: utmSource,
            isLoading: false,
          });
          return;
        }
      }

      // No context found - generic application
      setContext({
        jobTitle: null,
        clientName: null,
        location: null,
        jobListingId: null,
        source: utmSource,
        isLoading: false,
      });
    };

    fetchContext();
  }, [searchParams]);

  return context;
};
