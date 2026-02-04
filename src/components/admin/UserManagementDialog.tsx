import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Mail, Plus, UserX } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { getRoleDisplayName } from '@/utils/authHelpers';

interface Organization {
  id: string;
  name: string;
  slug?: string;
}

interface OrganizationUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface UserManagementDialogProps {
  organization: Organization;
  trigger?: React.ReactNode;
}

type InviteRole = 'user' | 'recruiter' | 'moderator' | 'admin';

export const UserManagementDialog = ({ organization, trigger }: UserManagementDialogProps) => {
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteRole>('user');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSuperAdmin, getRoleOptions } = useAdminAccess();

  // Get role options excluding super_admin for invites (only super admins can create super admins via different flow)
  const availableRoles = getRoleOptions(false);

  // Fetch organization users
  const { data: users, isLoading } = useQuery({
    queryKey: ['organization-users', organization.id],
    queryFn: async (): Promise<OrganizationUser[]> => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          created_at
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (!profiles) return [];

      // Get roles for these users
      const userIds = profiles.map(p => p.id);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds)
        .eq('organization_id', organization.id);

      return profiles.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'user',
        } as OrganizationUser;
      });
    },
    enabled: open,
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      // Call the ensure_admin_for_email function to set up the user
      const { error } = await supabase.rpc('ensure_admin_for_email', {
        _email: email,
        _org_slug: organization.slug || 'default-org'
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-users', organization.id] });
      setInviteEmail('');
      setInviteRole('user');
      toast({
        title: 'User Invited',
        description: 'User has been successfully added to the organization.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite user',
        variant: 'destructive',
      });
    },
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Remove from organization (set organization_id to null)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: null })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Remove user roles for this organization
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organization.id);

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-users', organization.id] });
      toast({
        title: 'User Removed',
        description: 'User has been removed from the organization.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove user',
        variant: 'destructive',
      });
    },
  });

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail.trim()) {
      inviteUserMutation.mutate({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      case 'recruiter':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Users className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Users - {organization.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite User Form */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Invite New User</h3>
            <form onSubmit={handleInviteUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(value: InviteRole) => setInviteRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={inviteUserMutation.isPending || !inviteEmail.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                {inviteUserMutation.isPending ? 'Inviting...' : 'Invite User'}
              </Button>
            </form>
          </div>

          {/* Users List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Organization Members ({users?.length || 0})</h3>
            
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No users found in this organization</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users?.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.full_name ? 
                            user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 
                            user.email.slice(0, 2).toUpperCase()
                          }
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name || user.email}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUserMutation.mutate(user.id)}
                        disabled={removeUserMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};