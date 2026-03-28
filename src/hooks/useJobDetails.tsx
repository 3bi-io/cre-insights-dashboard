import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

interface JobDetails {
  id: string;
  title: string;
  job_title: string | null;
  job_summary: string | null;
  job_description: string | null;
  apply_url: string | null;
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
  job_categories: {
    id: string;
    name: string;
  } | null;
  voiceAgent?: {
    global: boolean;
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
          job_categories(id, name)
        `)
        .eq('id', jobId)
        .eq('status', 'active')
        .eq('is_hidden', false)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch client info from public view (avoids RLS blocking on clients table)
      let clientInfo: { id: string; name: string; logo_url: string | null } | null = null;
      if (data.client_id) {
        const { data: ci } = await supabase
          .from('public_client_info')
          .select('id, name, logo_url')
          .eq('id', data.client_id)
          .maybeSingle();
        clientInfo = ci;
      }

      // Check if this job's org/client has a voice agent assigned
      let voiceAgent: { assigned: boolean } | null = null;
      if (data.organization_id) {
        // Check client-specific agent first
        let hasAgent = false;
        if (data.client_id) {
          const { data: clientAgent } = await supabase
            .from('voice_agents')
            .select('id')
            .eq('organization_id', data.organization_id)
            .eq('client_id', data.client_id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          hasAgent = !!clientAgent;
        }
        // Fallback to org-level agent
        if (!hasAgent) {
          const { data: orgAgent } = await supabase
            .from('voice_agents')
            .select('id')
            .eq('organization_id', data.organization_id)
            .is('client_id', null)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          hasAgent = !!orgAgent;
        }
        if (hasAgent) voiceAgent = { assigned: true };
      }

      return { ...data, clients: clientInfo, voiceAgent } as unknown as JobDetails;
    },
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export type { JobDetails };
