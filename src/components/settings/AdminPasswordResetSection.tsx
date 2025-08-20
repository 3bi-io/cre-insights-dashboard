import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield } from 'lucide-react';

export const AdminPasswordResetSection: React.FC = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (userRole !== 'admin') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin_password_reset', {
        body: { email, new_password: password },
      });
      if (error) throw error as any;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Password updated', description: `Password reset for ${email}.` });
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error('Password update failed:', err);
      toast({ title: 'Error', description: err.message || 'Failed to update password', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Admin Password Reset
        </CardTitle>
        <CardDescription>
          Update a user's password by email. Admins only. Avoid reusing passwords.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">User Email</Label>
              <Input id="resetEmail" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="text" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !email || !password}>{loading ? 'Updating...' : 'Update Password'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
