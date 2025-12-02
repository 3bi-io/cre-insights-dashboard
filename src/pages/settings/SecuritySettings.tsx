import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SecuritySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [error, setError] = useState('');

  const handlePasswordChange = async () => {
    setError('');
    
    if (passwords.new.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    
    if (passwords.new !== passwords.confirm) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Password updated successfully'
      });
      
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    }
    
    setSaving(false);
  };

  const handleSignOutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast({
        title: 'Signed out',
        description: 'You have been signed out from all devices'
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to sign out from all devices',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container max-w-2xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground">Manage your account security</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handlePasswordChange} disabled={saving || !passwords.new || !passwords.confirm}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Password
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Session Management
            </CardTitle>
            <CardDescription>
              Manage your active sessions across devices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm font-medium">Current Session</p>
              <p className="text-xs text-muted-foreground mt-1">
                Logged in as {user?.email}
              </p>
            </div>
            
            <Button variant="destructive" onClick={handleSignOutAllDevices}>
              Sign Out From All Devices
            </Button>
            <p className="text-xs text-muted-foreground">
              This will sign you out from all devices including this one.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecuritySettings;