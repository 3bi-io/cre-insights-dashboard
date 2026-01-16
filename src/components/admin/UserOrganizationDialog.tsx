import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrganizations } from '@/hooks/useOrganizations';
import { logger } from '@/lib/logger';

interface UserOrganizationDialogProps {
  user: {
    id: string;
    email: string;
    organization_id?: string | null;
    organization_name?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserOrganizationDialog: React.FC<UserOrganizationDialogProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizations, isLoading: orgsLoading } = useOrganizations();

  useEffect(() => {
    if (user?.organization_id) {
      setSelectedOrgId(user.organization_id);
    } else {
      setSelectedOrgId('none');
    }
  }, [user?.organization_id]);

  const updateOrgMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user selected');
      
      const newOrgId = selectedOrgId === 'none' ? null : selectedOrgId;
      
      // Update the profile's organization_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: newOrgId })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // Also update user_roles organization_id if they have a role
      if (newOrgId) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ organization_id: newOrgId })
          .eq('user_id', user.id);
        
        // Ignore error if no role exists - not all users have roles
        if (roleError && !roleError.message.includes('0 rows')) {
          logger.warn('Could not update user_roles organization', { error: roleError, context: 'UserOrganizationDialog' });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Organization updated',
        description: `Successfully updated organization for ${user?.email}`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update organization',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgMutation.mutate();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Change Organization
            </DialogTitle>
            <DialogDescription>
              Update organization assignment for {user.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Organization</Label>
              <p className="text-sm text-muted-foreground">
                {user.organization_name || 'No organization assigned'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-organization">New Organization</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger id="new-organization">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Organization</SelectItem>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateOrgMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateOrgMutation.isPending}>
              {updateOrgMutation.isPending ? 'Updating...' : 'Update Organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
