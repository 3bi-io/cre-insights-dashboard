import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Image as ImageIcon, 
  Crown,
  Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { OrganizationLogoUpload } from './OrganizationLogoUpload';
import DomainManagement from './DomainManagement';
import { OrganizationFeatureManagement } from './OrganizationFeatureManagement';

interface OrganizationSettingsProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    settings?: any;
    domain?: string | null;
    domain_status?: string;
    domain_ssl_status?: string;
    domain_verification_token?: string | null;
    domain_deployed_at?: string | null;
    domain_dns_records?: any;
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

  const getDomainStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'not_configured': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
          {userRole === 'super_admin' && (
            <TabsTrigger value="domain" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Domain
            </TabsTrigger>
          )}
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

        {userRole === 'super_admin' && (
          <TabsContent value="domain" className="space-y-6">
            <DomainManagement
              organization={organization}
              onUpdate={onUpdate}
            />
          </TabsContent>
        )}

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
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Domain Status
          </CardTitle>
          <CardDescription>Current domain configuration status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Domain:</span>
              <span className="text-sm font-mono">
                {organization.domain || 'Not configured'}
              </span>
            </div>
            {organization.domain && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status:</span>
                  <Badge className={getDomainStatusColor(organization.domain_status || 'not_configured')}>
                    {organization.domain_status || 'not_configured'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SSL:</span>
                  <span className="text-sm">{organization.domain_ssl_status || 'not_provisioned'}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

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