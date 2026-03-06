import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ApplyContext {
  jobTitle: string | null;
  clientName: string | null;
  clientLogoUrl: string | null;
  location: string | null;
  jobListingId: string | null;
  organizationId: string | null;
  clientId: string | null;
  source: string | null;
  industryVertical: string | null;
  isLoading: boolean;
}

export const useApplyContext = (): ApplyContext => {
  const [searchParams] = useSearchParams();
  const [context, setContext] = useState<ApplyContext>({
    jobTitle: null,
    clientName: null,
    clientLogoUrl: null,
    location: null,
    jobListingId: null,
    organizationId: null,
    clientId: null,
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

      // Get organization_id and client_id for universal apply URLs
      const organizationId = searchParams.get('organization_id') || 
                            searchParams.get('organizationId') ||
                            searchParams.get('org_id');
      const clientId = searchParams.get('client_id') || 
                      searchParams.get('clientId');

      // Get source from utm_source parameter
      const utmSource = searchParams.get('utm_source') || 
                        searchParams.get('utmSource') || 
                        searchParams.get('source');

      // Priority 1: Resolve from job_listing_id
      if (jobListingId) {
        // Step 1: Fetch job listing (get client_id, not joining clients due to RLS)
        const { data: jobListing } = await supabase
          .from('job_listings')
          .select('id, title, city, state, client_id')
          .eq('id', jobListingId)
          .maybeSingle();

        if (jobListing) {
          let clientName: string | null = null;
          let clientLogoUrl: string | null = null;

          // Step 2: Fetch client name and logo from public_client_info view
          if (jobListing.client_id) {
            const { data: clientInfo } = await supabase
              .from('public_client_info')
              .select('name, logo_url')
              .eq('id', jobListing.client_id)
              .maybeSingle();
            
            clientName = clientInfo?.name || null;
            clientLogoUrl = clientInfo?.logo_url || null;
          }
          
          setContext({
            jobTitle: jobListing.title,
            clientName,
            clientLogoUrl,
            location: jobListing.city && jobListing.state 
              ? `${jobListing.city}, ${jobListing.state}` 
              : null,
            jobListingId: jobListing.id,
            organizationId: organizationId || null,
            clientId: clientId || jobListing.client_id || null,
            source: utmSource,
            isLoading: false,
          });
          return;
        }
      }

      // Priority 2: Resolve from client_id (universal URL with client branding)
      if (clientId) {
        const { data: clientInfo } = await supabase
          .from('public_client_info')
          .select('name, logo_url')
          .eq('id', clientId)
          .maybeSingle();

        if (clientInfo) {
          setContext({
            jobTitle: null,
            clientName: clientInfo.name || null,
            clientLogoUrl: clientInfo.logo_url || null,
            location: null,
            jobListingId: null,
            organizationId: organizationId || null,
            clientId,
            source: utmSource,
            isLoading: false,
          });
          return;
        }
      }

      // No context found - generic application (may still have organization_id)
      setContext({
        jobTitle: null,
        clientName: null,
        clientLogoUrl: null,
        location: null,
        jobListingId: null,
        organizationId: organizationId || null,
        clientId: clientId || null,
        source: utmSource,
        isLoading: false,
      });
    };

    fetchContext();
  }, [searchParams]);

  return context;
};
