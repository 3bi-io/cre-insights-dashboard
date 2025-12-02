import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, User, AlertTriangle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

const AccountSettings = () => {
  const { user, candidateProfile, refreshUser } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });
  const [error, setError] = useState('');
  const [visibility, setVisibility] = useState(candidateProfile?.profile_visibility || 'private');
  const [openToOpportunities, setOpenToOpportunities] = useState(candidateProfile?.open_to_opportunities ?? true);

  const handlePasswordChange = async () => {
    setError('');
    
    if (passwords.new.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    
    if (passwords.new !== passwords.confirm) {
      setError('Passwords do not match');
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
      
      setPasswords({ new: '', confirm: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    }
    
    setSaving(false);
  };

  const handlePrivacyUpdate = async () => {
    if (!user?.id) return;
    setSaving(true);

    const { error } = await supabase
      .from('candidate_profiles')
      .update({
        profile_visibility: visibility,
        open_to_opportunities: openToOpportunities
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update privacy settings',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Privacy settings updated'
      });
      refreshUser();
    }
    setSaving(false);
  };

  return (
    <div className="container max-w-2xl py-8 px-4 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Privacy Settings
            </CardTitle>
            <CardDescription>
              Control who can see your profile and contact you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Open to Opportunities</Label>
                  <p className="text-sm text-muted-foreground">Let recruiters know you're looking</p>
                </div>
                <Switch
                  checked={openToOpportunities}
                  onCheckedChange={setOpenToOpportunities}
                />
              </div>

              <div className="space-y-2">
                <Label>Profile Visibility</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'private', label: 'Private' },
                    { value: 'recruiters_only', label: 'Recruiters Only' },
                    { value: 'public', label: 'Public' }
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={visibility === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVisibility(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {visibility === 'private' && 'Only you can see your profile'}
                  {visibility === 'recruiters_only' && 'Only verified recruiters can see your profile'}
                  {visibility === 'public' && 'Anyone can see your profile'}
                </p>
              </div>
            </div>

            <Button onClick={handlePrivacyUpdate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Privacy Settings
            </Button>
          </CardContent>
        </Card>

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

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone. All your data including applications, saved jobs, and profile information will be permanently deleted.
            </p>
            <Button variant="destructive">
              Delete My Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSettings;