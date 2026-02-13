import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { queryKeys } from '@/lib/queryKeys';

interface UserClientAssignmentDialogProps {
  user: {
    id: string;
    email: string;
    organization_id?: string | null;
    organization_name?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserClientAssignmentDialog: React.FC<UserClientAssignmentDialogProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());

  // Fetch clients for the user's organization
  const { data: orgClients, isLoading: clientsLoading } = useQuery({
    queryKey: ['admin', 'org-clients', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, status')
        .eq('organization_id', user.organization_id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!user?.organization_id,
  });

  // Fetch current assignments
  const { data: currentAssignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['admin', 'user-client-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_client_assignments')
        .select('client_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!user?.id,
  });

  // Sync local state with fetched assignments
  useEffect(() => {
    if (currentAssignments) {
      setSelectedClientIds(new Set(currentAssignments.map((a) => a.client_id)));
    }
  }, [currentAssignments]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user selected');

      const currentIds = new Set(currentAssignments?.map((a) => a.client_id) || []);
      const toAdd = [...selectedClientIds].filter((id) => !currentIds.has(id));
      const toRemove = [...currentIds].filter((id) => !selectedClientIds.has(id));

      // Remove unselected
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('user_client_assignments')
          .delete()
          .eq('user_id', user.id)
          .in('client_id', toRemove);
        if (error) throw error;
      }

      // Add newly selected
      if (toAdd.length > 0) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('user_client_assignments')
          .insert(
            toAdd.map((clientId) => ({
              user_id: user.id,
              client_id: clientId,
              assigned_by: currentUser?.id || null,
            }))
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.superAdminUsers() });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-client-assignments', user?.id] });
      toast({ title: 'Client assignments updated', description: `Updated client assignments for ${user?.email}` });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating assignments', description: error.message, variant: 'destructive' });
    },
  });

  const toggleClient = (clientId: string) => {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const isLoading = clientsLoading || assignmentsLoading;

  const footer = (
    <div className="flex gap-2 justify-end">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Save Assignments
      </Button>
    </div>
  );

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Manage Client Assignments"
      description={`Assign clients to ${user?.email || 'user'} (${user?.organization_name || 'No Organization'})`}
      footer={footer}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !orgClients?.length ? (
        <p className="text-center text-muted-foreground py-4">
          No clients found for this organization.
        </p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {orgClients.map((client) => (
            <label
              key={client.id}
              className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                checked={selectedClientIds.has(client.id)}
                onCheckedChange={() => toggleClient(client.id)}
              />
              <div className="flex-1">
                <span className="font-medium">{client.name}</span>
              </div>
              <span className="text-xs text-muted-foreground capitalize">{client.status}</span>
            </label>
          ))}
        </div>
      )}
    </ResponsiveDialog>
  );
};
