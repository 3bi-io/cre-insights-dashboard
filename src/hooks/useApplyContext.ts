import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getDisplayCompanyName } from '@/utils/jobDisplayUtils';

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
      
      const orgSlug = searchParams.get('org') || 
                      searchParams.get('organization') ||
                      searchParams.get('org_slug');

      // Get source from utm_source parameter
      const utmSource = searchParams.get('utm_source') || 
                        searchParams.get('utmSource') || 
                        searchParams.get('source');

      if (jobListingId) {
        // Try to fetch job listing with organization
        const { data: jobListing } = await supabase
          .from('job_listings')
          .select(`
            id,
            title,
            city,
            state,
            organizations (
              id,
              name,
              slug,
              logo_url
            ),
            clients (
              id,
              name
            )
          `)
          .eq('id', jobListingId)
          .maybeSingle();

        if (jobListing) {
          const org = jobListing.organizations as any;
          const client = jobListing.clients as any;
          
          // Use getDisplayCompanyName for proper branding (e.g., "Hayes Recruiting - ClientName")
          const displayName = getDisplayCompanyName({
            clients: client,
            organizations: org,
          });
          
          setContext({
            jobTitle: jobListing.title,
            organizationName: displayName,
            organizationSlug: org?.slug || null,
            location: jobListing.city && jobListing.state 
              ? `${jobListing.city}, ${jobListing.state}` 
              : null,
            logoUrl: org?.logo_url || null,
            jobListingId: jobListing.id,
            source: utmSource,
            isLoading: false,
          });
          return;
        }
      }

      // Try org slug if no job listing found
      if (orgSlug) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name, slug, logo_url')
          .eq('slug', orgSlug)
          .maybeSingle();

        if (org) {
          setContext({
            jobTitle: null,
            organizationName: org.name,
            organizationSlug: org.slug,
            location: null,
            logoUrl: org.logo_url,
            jobListingId: null,
            source: utmSource,
            isLoading: false,
          });
          return;
        }
      }

      // No context found - generic application
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
