import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VoiceAgent {
  id: string;
  agent_id: string;
  organization_id: string;
  is_active: boolean;
}

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
  voiceAgent?: VoiceAgent | null;
}

export const useJobDetails = (jobId: string | undefined) => {
  return useQuery({
    queryKey: ['job-details', jobId],
    queryFn: async (): Promise<JobDetails | null> => {
      if (!jobId) return null;

      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          *,
          clients(id, name, logo_url),
          organizations(id, name, slug),
          job_categories(id, name)
        `)
        .eq('id', jobId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch voice agent for the organization
      let voiceAgent: VoiceAgent | null = null;
      if (data.organization_id) {
        const { data: va } = await supabase
          .from('voice_agents')
          .select('id, agent_id, organization_id, is_active')
          .eq('organization_id', data.organization_id)
          .eq('is_active', true)
          .maybeSingle();
        
        voiceAgent = va;
      }

      return {
        ...data,
        voiceAgent
      } as unknown as JobDetails;
    },
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export type { JobDetails };
