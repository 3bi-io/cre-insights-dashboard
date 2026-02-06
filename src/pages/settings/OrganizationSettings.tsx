import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, Globe, Factory, RotateCcw } from 'lucide-react';
import { OrganizationLogoUpload } from '@/components/organizations/OrganizationLogoUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDUSTRY_VERTICAL_OPTIONS, getIndustryVerticalOption } from '@/features/organizations/config/industryTemplates.config';
import { IndustryVertical } from '@/types/common.types';

const OrganizationSettings = () => {
  const { organization, refreshUser, userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resettingTemplate, setResettingTemplate] = useState(false);
  const [orgData, setOrgData] = useState({
    name: '',
    slug: '',
    industry_vertical: 'transportation' as IndustryVertical,
  });

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  useEffect(() => {
    if (organization) {
      setOrgData({
        name: organization.name || '',
        slug: organization.slug || '',
        industry_vertical: (organization.industry_vertical || 'transportation') as IndustryVertical,
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
        industry_vertical: orgData.industry_vertical,
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

  const handleResetToTemplateDefaults = async () => {
    if (!organization?.id || !isAdmin) return;
    setResettingTemplate(true);

    const { error } = await supabase.rpc('apply_industry_template', {
      _org_id: organization.id,
      _vertical: orgData.industry_vertical,
      _reset_existing: true,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset template defaults',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Template Applied',
        description: `Platform and feature settings have been reset to ${getIndustryVerticalOption(orgData.industry_vertical)?.label || 'default'} defaults.`
      });
      refreshUser();
    }
    setResettingTemplate(false);
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

  const currentVerticalOption = getIndustryVerticalOption(orgData.industry_vertical);

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

          {isAdmin && (
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Industry Template Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Industry Template
          </CardTitle>
          <CardDescription>
            Configure industry-specific settings, platforms, and AI prompts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="industry_vertical">Industry Vertical</Label>
            <Select
              value={orgData.industry_vertical}
              onValueChange={(value) => setOrgData({ ...orgData, industry_vertical: value as IndustryVertical })}
              disabled={!isAdmin}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_VERTICAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentVerticalOption && (
              <p className="text-xs text-muted-foreground">
                {currentVerticalOption.description}
              </p>
            )}
          </div>

          {currentVerticalOption && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Template Features:</p>
              <div className="flex flex-wrap gap-2">
                {currentVerticalOption.features.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-background border"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Industry
              </Button>
              <Button 
                variant="outline" 
                onClick={handleResetToTemplateDefaults} 
                disabled={resettingTemplate}
              >
                {resettingTemplate ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Reset to Template Defaults
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Resetting to template defaults will reconfigure platform access and features based on the selected industry.
          </p>
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
