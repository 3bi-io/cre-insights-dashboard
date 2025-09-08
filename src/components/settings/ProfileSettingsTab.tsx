import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Database, Save, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateChangelogPDF } from '@/utils/changelogPdfGenerator';

const ProfileSettingsTab = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  
  // Profile editing state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Initialize profile form from user metadata and profile table
  useEffect(() => {
    const init = async () => {
      const metaFull = (user as any)?.user_metadata?.full_name as string | undefined;
      const metaCompany = (user as any)?.user_metadata?.company as string | undefined;

      if (metaFull) {
        const parts = metaFull.trim().split(/\s+/);
        setFirstName(parts.slice(0, -1).join(' ') || parts[0] || '');
        setLastName(parts.slice(-1).join(' ') || '');
      }
      if (metaCompany) setCompany(metaCompany);

      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        if (data?.full_name && !metaFull) {
          const p = data.full_name.trim().split(/\s+/);
          setFirstName(p.slice(0, -1).join(' ') || p[0] || '');
          setLastName(p.slice(-1).join(' ') || '');
        }
      }
    };
    init();
  }, [user?.id]);

  const handleDownloadChangelog = () => {
    try {
      generateChangelogPDF();
      toast({
        title: "Changelog Downloaded",
        description: "The changelog PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating changelog PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate changelog PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setProfileSaving(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();

      // Update Supabase auth user metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          full_name: fullName || undefined,
          company: company || undefined,
        },
      });
      if (authErr) throw authErr;

      // Keep profiles table in sync (for app queries)
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ full_name: fullName || null })
        .eq('id', user.id);
      if (profErr) throw profErr;

      await refreshUser();
      toast({ title: 'Profile updated', description: 'Your profile has been saved.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Update failed', description: 'Could not save your profile.', variant: 'destructive' });
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your account details and personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Account Status</Label>
              <div className="pt-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Active
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                placeholder="Enter your first name" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                placeholder="Enter your last name" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input 
              id="company" 
              placeholder="C.R. England" 
              value={company} 
              onChange={(e) => setCompany(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" value="UTC-07:00 (Mountain Time)" disabled />
          </div>

          <Button 
            className="flex items-center gap-2" 
            onClick={handleSaveProfile} 
            disabled={profileSaving}
          >
            <Save className="w-4 h-4" />
            {profileSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            System Information
          </CardTitle>
          <CardDescription>
            Download system documentation and changelog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">PDF Export Feature Changelog</p>
                <p className="text-sm text-muted-foreground">
                  Download the complete changelog for the PDF export functionality
                </p>
              </div>
              <Button 
                onClick={handleDownloadChangelog} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Changelog
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettingsTab;
