import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Mail } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UserInviteDialogProps {
  trigger?: React.ReactNode;
}

export const UserInviteDialog = ({ trigger }: UserInviteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  
  const { toast } = useToast();
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  type AppRole = 'admin' | 'moderator' | 'super_admin' | 'user';
  
  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'user' | 'admin' }) => {
      if (!organization?.slug) throw new Error('Organization not found');
      
      const { data, error } = await supabase.rpc('ensure_admin_for_email', {
        _email: email.toLowerCase().trim(),
        _org_slug: organization.slug,
        _role: role as AppRole
      });

      if (error) throw error;
      
      // Check if the function returned an error
      const result = data as { success?: boolean; error?: string; status?: string; user_id?: string } | null;
      if (result && 'success' in result && !result.success) {
        throw new Error(result.error || 'Failed to invite user');
      }
      
      return result as { success: boolean; status: 'assigned' | 'invited'; user_id?: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization-user-data'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
      setEmail('');
      setRole('user');
      setOpen(false);
      
      const isInvited = data?.status === 'invited';
      toast({
        title: isInvited ? 'Invitation Sent' : 'User Added',
        description: isInvited 
          ? 'An invitation has been created. The user will be added when they sign up.'
          : 'User has been successfully added to the organization.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite user',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      inviteUserMutation.mutate({ email: email.trim(), role });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite New User
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'user' | 'admin') => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviteUserMutation.isPending || !email.trim()}>
              {inviteUserMutation.isPending ? 'Inviting...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};