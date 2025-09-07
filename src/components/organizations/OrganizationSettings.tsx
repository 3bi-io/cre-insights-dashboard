import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Image as ImageIcon, 
  Crown 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { OrganizationLogoUpload } from './OrganizationLogoUpload';
import { OrganizationFeatureManagement } from './OrganizationFeatureManagement';

interface OrganizationSettingsProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    settings?: any;
  };
  onUpdate: (organizationId: string, updateData: any) => void;
  canManageFeatures?: boolean;
}

export const OrganizationSettings = ({ 
  organization, 
  onUpdate,
  canManageFeatures = false 
}: OrganizationSettingsProps) => {
  const { userRole } = useAuth();

  const handleLogoUpdate = (logoUrl: string | null) => {
    onUpdate(organization.id, { logo_url: logoUrl });
  };

  const handleFeatureUpdate = (organizationId: string, settings: any) => {
    onUpdate(organizationId, { settings });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organization Settings</h2>
          <p className="text-muted-foreground">
            Manage {organization.name} settings and configuration
          </p>
        </div>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Branding
          </TabsTrigger>
          {canManageFeatures && (
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Features
            </TabsTrigger>
          )}
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <OrganizationLogoUpload
            organizationId={organization.id}
            organizationSlug={organization.slug}
            currentLogoUrl={organization.logo_url}
            onLogoUpdate={handleLogoUpdate}
          />
        </TabsContent>

        {canManageFeatures && (
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Feature Management
                </CardTitle>
                <CardDescription>
                  Configure which platform features this organization can access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrganizationFeatureManagement
                  organization={organization}
                  onUpdate={handleFeatureUpdate}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>
                Basic organization details and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Organization Name</label>
                  <p className="text-sm text-muted-foreground mt-1">{organization.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Organization Slug</label>
                  <p className="text-sm text-muted-foreground mt-1">{organization.slug}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Contact your system administrator to modify organization details.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};