import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SavedFilter {
  id: string;
  name: string;
  view_type: string;
  filter_config: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useSavedFilters(viewType: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['saved-filters', viewType, user?.id];

  const { data: filters = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('user_id', user.id)
        .eq('view_type', viewType)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SavedFilter[];
    },
    enabled: !!user?.id,
  });

  const saveFilter = useMutation({
    mutationFn: async ({ name, config }: { name: string; config: Record<string, unknown> }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('saved_filters').insert([{
        user_id: user.id,
        name,
        view_type: viewType,
        filter_config: config as any,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Filter saved', description: 'Your filter preset has been saved.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Could not save filter.', variant: 'destructive' });
    },
  });

  const deleteFilter = useMutation({
    mutationFn: async (filterId: string) => {
      const { error } = await supabase.from('saved_filters').delete().eq('id', filterId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Filter deleted' });
    },
  });

  const setDefault = useMutation({
    mutationFn: async (filterId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      // Clear existing defaults for this view
      await supabase
        .from('saved_filters')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('view_type', viewType);
      // Set new default
      const { error } = await supabase
        .from('saved_filters')
        .update({ is_default: true })
        .eq('id', filterId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Default filter set' });
    },
  });

  const defaultFilter = filters.find((f) => f.is_default);

  return {
    filters,
    isLoading,
    saveFilter,
    deleteFilter,
    setDefault,
    defaultFilter,
  };
}
