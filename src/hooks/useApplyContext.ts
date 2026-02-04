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
        // Step 1: Fetch job listing (get client_id, not joining clients due to RLS)
        const { data: jobListing } = await supabase
          .from('job_listings')
          .select('id, title, city, state, client_id')
          .eq('id', jobListingId)
          .maybeSingle();

        if (jobListing) {
          let clientName: string | null = null;

          // Step 2: Fetch client name from public_client_info view
          if (jobListing.client_id) {
            const { data: clientInfo } = await supabase
              .from('public_client_info')
              .select('name')
              .eq('id', jobListing.client_id)
              .maybeSingle();
            
            clientName = clientInfo?.name || null;
          }
          
          setContext({
            jobTitle: jobListing.title,
            clientName,
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
