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

  // Show for both admin and super_admin
  if (userRole !== 'admin' && userRole !== 'super_admin') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    // Build payload and resolve user_id from profiles by email if possible
    const payload: { new_password: string; user_id?: string; email?: string } = { new_password: password };
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1);
      if (profiles && profiles.length > 0) {
        payload.user_id = profiles[0].id;
      } else {
        payload.email = email;
      }
    } catch (resolveErr) {
      // Fall back to email if lookup fails
      payload.email = email;
    }

    const tryInvoke = async (name: string) => {
      return supabase.functions.invoke(name, {
        body: payload,
      });
    };

    try {
      const { data, error } = await tryInvoke('admin-update-password');
      if (error) throw error as Error;
      if ((data as Record<string, unknown>)?.error) throw new Error(String((data as Record<string, unknown>).error));

      toast({ title: 'Password updated', description: `Password reset for ${email}.` });
      setEmail('');
      setPassword('');
    } catch (err: any) {
      // Never log password-related errors to console in production
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
          Update any user's password by email. Super admin privilege required. Use strong, unique passwords.
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
              <Input id="newPassword" type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
