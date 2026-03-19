import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientFieldRow {
  id: string;
  client_id: string;
  organization_id: string;
  field_key: string;
  enabled: boolean;
  required: boolean;
}

export const useClientApplicationFields = (clientId: string | null, organizationId: string | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ['client-application-fields', clientId];

  const { data: fields = [], isLoading } = useQuery({
    queryKey,
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_application_fields' as any)
        .select('*')
        .eq('client_id', clientId!)
        .order('field_key') as { data: ClientFieldRow[] | null; error: any };
      
      if (error) throw error;
      return data || [];
    },
  });

  const upsertField = useMutation({
    mutationFn: async ({ fieldKey, enabled, required }: { fieldKey: string; enabled: boolean; required: boolean }) => {
      if (!clientId || !organizationId) throw new Error('Missing client or organization');
      
      const { error } = await supabase
        .from('client_application_fields' as any)
        .upsert(
          {
            client_id: clientId,
            organization_id: organizationId,
            field_key: fieldKey,
            enabled,
            required,
          },
          { onConflict: 'client_id,field_key' }
        );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const getFieldState = (fieldKey: string) => {
    const row = fields.find(f => f.field_key === fieldKey);
    return { enabled: row?.enabled ?? true, required: row?.required ?? false };
  };

  return { fields, isLoading, upsertField, getFieldState };
};
