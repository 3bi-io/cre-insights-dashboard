import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ApplyContext {
  jobTitle: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
  location: string | null;
  logoUrl: string | null;
  jobListingId: string | null;
  source: string | null;
  isLoading: boolean;
}

export const useApplyContext = (): ApplyContext => {
  const [searchParams] = useSearchParams();
  const [context, setContext] = useState<ApplyContext>({
    jobTitle: null,
    organizationName: null,
    organizationSlug: null,
    location: null,
    logoUrl: null,
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
        // Try to fetch job listing with client (org info excluded for privacy)
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
          
          // Show only client name - org association is private
          const clientName = client?.name || null;
          
          setContext({
            jobTitle: jobListing.title,
            organizationName: clientName,
            organizationSlug: null,
            location: jobListing.city && jobListing.state 
              ? `${jobListing.city}, ${jobListing.state}` 
              : null,
            logoUrl: null, // Don't show org logo to keep association private
            jobListingId: jobListing.id,
            source: utmSource,
            isLoading: false,
          });
          return;
        }
      }

      // No context found - generic application (no org_slug fallback for privacy)
      setContext({
        jobTitle: null,
        organizationName: null,
        organizationSlug: null,
        location: null,
        logoUrl: null,
        jobListingId: null,
        source: utmSource,
        isLoading: false,
      });
    };

    fetchContext();
  }, [searchParams]);

  return context;
};
