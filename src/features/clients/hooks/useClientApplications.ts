import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ClientApplication {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  applicant_email: string | null;
  phone: string | null;
  status: string | null;
  source: string | null;
  applied_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  ats_readiness_score: number | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  recruiter_id: string | null;
  first_response_at: string | null;
  tenstreet_sync_status: string | null;
  driverreach_sync_status: string | null;
  cdl: string | null;
  cdl_class: string | null;
  cdl_state: string | null;
  cdl_endorsements: string[] | null;
  cdl_expiration_date: string | null;
  exp: string | null;
  driving_experience_years: number | null;
  months: string | null;
  violation_history: string | null;
  accident_history: string | null;
  convicted_felony: string | null;
  felony_details: string | null;
  can_pass_drug_test: string | null;
  can_pass_physical: string | null;
  background_check_consent: string | null;
  veteran: string | null;
  work_authorization: string | null;
  dot_physical_date: string | null;
  medical_card_expiration: string | null;
  hazmat_endorsement: string | null;
  twic_card: string | null;
  job_listings: {
    id: string;
    title: string | null;
    job_title: string | null;
  } | null;
  recruiters: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export function useClientApplications(clientId: string | null) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['client-applications', clientId, organization?.id],
    queryFn: async (): Promise<ClientApplication[]> => {
      if (!clientId || !organization?.id) return [];

      // Get job IDs for this client
      const { data: jobs } = await supabase
        .from('job_listings')
        .select('id')
        .eq('client_id', clientId)
        .eq('organization_id', organization.id);

      const jobIds = (jobs || []).map(j => j.id);
      if (jobIds.length === 0) return [];

      const { data, error } = await supabase
        .from('applications')
        .select(`
          id, first_name, last_name, full_name, applicant_email, phone,
          status, source, applied_at, created_at, updated_at,
          ats_readiness_score, city, state, notes, recruiter_id,
          first_response_at, tenstreet_sync_status, driverreach_sync_status,
          job_listings(id, title, job_title),
          recruiters(id, first_name, last_name)
        `)
        .in('job_listing_id', jobIds)
        .order('applied_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return (data || []) as unknown as ClientApplication[];
    },
    enabled: !!clientId && !!organization?.id,
  });
}
