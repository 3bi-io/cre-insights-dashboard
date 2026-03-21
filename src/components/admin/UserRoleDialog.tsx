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
import { Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { getRoleDescription } from '@/utils/authHelpers';

interface UserRoleDialogProps {
  user: {
    id: string;
    email: string;
    role: string;
    organization_id?: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

type UserRole = 'user' | 'admin' | 'super_admin' | 'moderator' | 'recruiter' | 'client';

export const UserRoleDialog: React.FC<UserRoleDialogProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSuperAdmin, getRoleOptions } = useAdminAccess();

  useEffect(() => {
    if (user?.role) {
      setSelectedRole(user.role as UserRole);
    }
  }, [user?.role]);

  const updateRoleMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user selected');
      
      // Delete all existing roles for this user, then insert the new one
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) throw deleteError;
      
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: selectedRole,
          organization_id: user.organization_id || null,
        });
      
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['organization-users'] });
      toast({
        title: 'Role updated',
        description: `Successfully updated role for ${user?.email} to ${selectedRole}`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update role',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRoleMutation.mutate();
  };

  if (!user) return null;

  // Get role options based on current user's permissions
  const roleOptions = getRoleOptions(isSuperAdmin);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Change User Role
            </DialogTitle>
            <DialogDescription>
              Update role for {user.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <p className="text-sm text-muted-foreground capitalize">
                {user.role?.replace('_', ' ') || 'No role assigned'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-role">New Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger id="new-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getRoleDescription(selectedRole)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateRoleMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateRoleMutation.isPending || selectedRole === user.role}>
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
