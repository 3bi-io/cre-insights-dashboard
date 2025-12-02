import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, Globe } from 'lucide-react';

const OrganizationSettings = () => {
  const { organization, refreshUser, userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orgData, setOrgData] = useState({
    name: '',
    slug: '',
    logo_url: ''
  });

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  useEffect(() => {
    if (organization) {
      setOrgData({
        name: organization.name || '',
        slug: organization.slug || '',
        logo_url: organization.logo_url || ''
      });
    }
  }, [organization]);

  const handleSave = async () => {
    if (!organization?.id || !isAdmin) return;
    setSaving(true);

    const { error } = await supabase
      .from('organizations')
      .update({
        name: orgData.name,
        logo_url: orgData.logo_url || null
      })
      .eq('id', organization.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update organization',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Organization updated successfully'
      });
      refreshUser();
    }
    setSaving(false);
  };

  if (!organization) {
    return (
      <div className="container max-w-2xl py-8 px-4">
        <div className="text-center py-12">
          <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Organization</h2>
          <p className="text-muted-foreground">You are not associated with any organization.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization's information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Organization Details
          </CardTitle>
          <CardDescription>
            {isAdmin ? 'Update your organization\'s name and branding' : 'View your organization\'s information'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org_name">Organization Name</Label>
            <Input
              id="org_name"
              value={orgData.name}
              onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
              placeholder="Enter organization name"
              disabled={!isAdmin}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="org_slug">Organization Slug</Label>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <Input
                id="org_slug"
                value={orgData.slug}
                disabled
                className="bg-muted"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The slug is used in URLs and cannot be changed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              value={orgData.logo_url}
              onChange={(e) => setOrgData({ ...orgData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
              disabled={!isAdmin}
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL for your organization's logo
            </p>
          </div>

          {orgData.logo_url && (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Logo Preview</p>
              <img 
                src={orgData.logo_url} 
                alt="Organization logo preview" 
                className="max-h-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {isAdmin && (
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationSettings;