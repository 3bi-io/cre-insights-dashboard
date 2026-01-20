import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

interface JobDetails {
  id: string;
  title: string;
  job_title: string | null;
  job_summary: string | null;
  job_description: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  dest_city: string | null;
  dest_state: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_type: string | null;
  job_type: string | null;
  experience_level: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  organization_id: string | null;
  client_id: string | null;
  category_id: string | null;
  clients: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  organizations: {
    id: string;
    name: string;
    slug: string;
  } | null;
  job_categories: {
    id: string;
    name: string;
  } | null;
  voiceAgent?: {
    id: string;
    agent_id: string;
    is_active: boolean;
  } | null;
}

export const useJobDetails = (jobId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.jobs.detail(jobId || ''),
    queryFn: async (): Promise<JobDetails | null> => {
      if (!jobId) return null;

      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          *,
          clients(id, name, logo_url),
          job_categories(id, name)
        `)
        .eq('id', jobId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch organization info securely via public_organization_info view
      let organizations = null;
      if (data.organization_id) {
        const { data: orgData } = await supabase
          .from('public_organization_info')
          .select('id, name, slug, logo_url')
          .eq('id', data.organization_id)
          .maybeSingle();
        organizations = orgData;
      }

      // Fetch voice agent for this organization
      let voiceAgent = null;
      if (data.organization_id) {
        const { data: vaData } = await supabase
          .from('voice_agents')
          .select('id, agent_id, is_active')
          .eq('organization_id', data.organization_id)
          .eq('is_active', true)
          .eq('is_outbound_enabled', false)
          .maybeSingle();
        
        voiceAgent = vaData;
      }

      return { ...data, organizations, voiceAgent } as unknown as JobDetails;
    },
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export type { JobDetails };
