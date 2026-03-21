import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { DateRange } from '@/features/clients/types/clientAnalytics.types';

interface AssignedClient {
  id: string;
  name: string;
  logo_url: string | null;
  city: string | null;
  state: string | null;
  status: string;
}

export function useClientPortalData() {
  const { user } = useAuth();

  return useQuery<AssignedClient[]>({
    queryKey: ['client-portal-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get assigned client IDs
      const { data: assignments, error: assignError } = await supabase
        .from('user_client_assignments')
        .select('client_id')
        .eq('user_id', user.id);

      if (assignError || !assignments?.length) return [];

      const clientIds = assignments.map(a => a.client_id);

      // Fetch client details
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id, name, logo_url, city, state, status')
        .in('id', clientIds)
        .order('name');

      if (clientError) throw new Error(clientError.message);
      return (clients || []) as AssignedClient[];
    },
    enabled: !!user?.id,
  });
}

export type { AssignedClient };
