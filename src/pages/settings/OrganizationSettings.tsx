import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, Globe, Crown, ExternalLink } from 'lucide-react';
 import { OrganizationLogoUpload } from '@/components/organizations/OrganizationLogoUpload';

const OrganizationSettings = () => {
  const { organization, refreshUser, userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orgData, setOrgData] = useState({
    name: '',
     slug: ''
  });

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  useEffect(() => {
    if (organization) {
      setOrgData({
        name: organization.name || '',
         slug: organization.slug || ''
      });
    }
  }, [organization]);

  const handleSave = async () => {
    if (!organization?.id || !isAdmin) return;
    setSaving(true);

    const { error } = await supabase
      .from('organizations')
      .update({
         name: orgData.name
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

      {isSuperAdmin && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Super Admin Access</p>
                <p className="text-sm text-muted-foreground">
                  Manage logos and branding for all organizations
                </p>
              </div>
            </div>
            <Button asChild>
              <Link to="/admin/organizations">
                Manage All Organizations
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

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

          {isAdmin && (
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>
 
       {/* Logo Upload Section */}
       {isAdmin && organization && (
         <OrganizationLogoUpload
           organizationId={organization.id}
           organizationSlug={organization.slug}
           currentLogoUrl={organization.logo_url}
           onLogoUpdate={refreshUser}
           disabled={!isAdmin}
         />
       )}
    </div>
  );
};

export default OrganizationSettings;