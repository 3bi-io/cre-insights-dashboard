import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { History, RefreshCw } from 'lucide-react';
import { getActualAccountId } from '@/utils/metaAccountAlias';

// Display account ID (alias)
const CR_ENGLAND_DISPLAY_ID = '897639563274136';
// Actual account ID for API calls  
const CR_ENGLAND_ACTUAL_ID = getActualAccountId(CR_ENGLAND_DISPLAY_ID);

const MetaBackfillButton: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const backfillMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('meta-integration', {
        body: {
          action: 'sync_leads',
          accountId: CR_ENGLAND_ACTUAL_ID,
          sinceDays: 3650, // ~10 years to cover full history
        },
      });
      if (error) throw error;
      return data as { inserted?: number; skipped?: number; errors?: number; message?: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: 'Meta backfill complete',
        description: data?.message || `Inserted ${data?.inserted ?? 0}, Skipped ${data?.skipped ?? 0}, Errors ${data?.errors ?? 0}`,
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Backfill failed',
        description: err?.message || 'Unable to sync historical Meta leads',
        variant: 'destructive',
      });
    },
  });

  return (
    <Button
      variant="default"
      onClick={() => backfillMutation.mutate()}
      disabled={backfillMutation.isPending}
      className="flex items-center gap-2"
    >
      {backfillMutation.isPending ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <History className="w-4 h-4" />
      )}
      {backfillMutation.isPending ? 'Syncing Meta History...' : 'Backfill Meta Leads'}
    </Button>
  );
};

export default MetaBackfillButton;
