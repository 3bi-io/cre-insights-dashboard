import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrganizations } from '@/hooks/useOrganizations';
import { queryKeys } from '@/lib/queryKeys';

interface SuperAdminInviteDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

type UserRole = 'user' | 'admin' | 'super_admin';

export const SuperAdminInviteDialog: React.FC<SuperAdminInviteDialogProps> = ({
  trigger,
  onSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizations, isLoading: orgsLoading } = useOrganizations();

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!email) throw new Error('Email is required');
      
      let wasInvited = false;
      let orgName: string | undefined;
      let orgSlug: string | undefined;
      
      // Use the ensure_admin_for_email RPC if assigning to an organization
      if (selectedOrgId && selectedOrgId !== 'none') {
        // Get the organization details first
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('slug, name')
          .eq('id', selectedOrgId)
          .single();
        
        if (orgError || !org) throw new Error('Organization not found');
        
        orgName = org.name;
        orgSlug = org.slug;
        
        const { data, error } = await supabase.rpc('ensure_admin_for_email', {
          _email: email.toLowerCase().trim(),
          _org_slug: org.slug,
          _role: selectedRole as 'admin' | 'moderator' | 'super_admin' | 'user',
        });
        
        if (error) throw error;
        
        // Check if function returned an error
        const result = data as { success?: boolean; error?: string; status?: string } | null;
        if (result && 'success' in result && !result.success) {
          throw new Error(result.error || 'Failed to invite user');
        }
        
        wasInvited = result?.status === 'invited';
      } else {
        // For users without organization, we need to check if user exists first
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email.toLowerCase().trim())
          .single();
        
        if (existingProfile) {
          // User exists, just update their role
          const { error: roleError } = await supabase
            .from('user_roles')
            .upsert({
              user_id: existingProfile.id,
              role: selectedRole,
            }, {
              onConflict: 'user_id,role',
            });
          
          if (roleError) throw roleError;
        } else {
          throw new Error('User does not exist. Please ask them to sign up first, or assign them to an organization.');
        }
      }
      
      return { wasInvited, orgName, orgSlug };
    },
    onSuccess: async (result) => {
      // Send invitation email for new invites
      if (result?.wasInvited) {
        try {
          await supabase.functions.invoke('send-invite-email', {
            body: {
              email: email.toLowerCase().trim(),
              organizationName: result.orgName,
              organizationSlug: result.orgSlug,
              role: selectedRole,
            }
          });
        } catch (emailError) {
          console.error('[SuperAdminInviteDialog] Failed to send invite email:', emailError);
        }
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.admin.superAdminUsers() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast({
        title: result?.wasInvited ? 'Invitation Sent' : 'User Added',
        description: result?.wasInvited 
          ? `Invitation email sent to ${email}`
          : `Successfully added ${email} as ${selectedRole}`,
      });
      resetForm();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to invite user',
        description: error.message || 'An error occurred while inviting the user',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setEmail('');
    setSelectedRole('user');
    setSelectedOrgId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invite User
            </DialogTitle>
            <DialogDescription>
              Invite a user to the platform and assign them a role and organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger id="organization">
                  <SelectValue placeholder="Select organization (optional)" />
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
              <p className="text-xs text-muted-foreground">
                Leave empty for platform-wide users
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!email || inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Inviting...' : 'Invite User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
