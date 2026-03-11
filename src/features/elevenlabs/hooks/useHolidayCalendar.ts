import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Holiday {
  id: string;
  organization_id: string | null;
  holiday_date: string;
  name: string;
  recurring: boolean;
  created_at: string;
}

export function useHolidayCalendar() {
  const { organization } = useAuth();
  const organizationId = organization?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = ['organization-holidays', organizationId];

  const { data: holidays = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) return [];

      // Fetch both global (org_id IS NULL) and org-specific holidays
      const { data, error } = await supabase
        .from('organization_holidays' as any)
        .select('*')
        .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
        .order('holiday_date', { ascending: true });

      if (error) throw error;
      return (data as unknown as Holiday[]) || [];
    },
    enabled: !!organizationId,
  });

  const { mutate: addHoliday, isPending: isAdding } = useMutation({
    mutationFn: async ({ date, name, recurring = false }: { date: string; name: string; recurring?: boolean }) => {
      if (!organizationId) throw new Error('No organization');

      const { data, error } = await supabase.rpc('upsert_organization_holiday', {
        p_org_id: organizationId,
        p_date: date,
        p_name: name,
        p_recurring: recurring,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Holiday added' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add holiday', description: error.message, variant: 'destructive' });
    },
  });

  const { mutate: deleteHoliday, isPending: isDeleting } = useMutation({
    mutationFn: async (holidayId: string) => {
      if (!organizationId) throw new Error('No organization');

      const { data, error } = await supabase.rpc('delete_organization_holiday', {
        p_org_id: organizationId,
        p_holiday_id: holidayId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Holiday removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to remove holiday', description: error.message, variant: 'destructive' });
    },
  });

  return {
    holidays,
    isLoading,
    addHoliday,
    isAdding,
    deleteHoliday,
    isDeleting,
  };
}
