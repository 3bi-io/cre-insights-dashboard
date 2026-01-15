import React, { useState } from 'react';
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
} from '@/components/ui/dialog';
import { Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserPasswordDialogProps {
  user: {
    id: string;
    email: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserPasswordDialog: React.FC<UserPasswordDialogProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePasswordUpdate = async () => {
    if (!user) return;
    
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: 'Invalid password',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-password', {
        body: {
          user_id: user.id,
          new_password: newPassword,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Password updated',
        description: `Password successfully updated for ${user.email}`,
      });
      
      setNewPassword('');
      onClose();
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message || 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Set a new password for {user.email}. The user will be able to login with the new password immediately.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handlePasswordUpdate} disabled={loading || !newPassword}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
