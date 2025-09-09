import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Image as ImageIcon, 
  Settings,
  Palette,
  Monitor,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationLogo } from '@/hooks/useOrganizationLogo';
import { OrganizationLogoUpload } from '@/components/organizations/OrganizationLogoUpload';

export const OrganizationBrandingPanel = () => {
  const { organization, userRole } = useAuth();
  const { uploadLogo, deleteLogo, isUploading, isDeleting } = useOrganizationLogo();

  if (!organization) return null;

  const handleLogoUpdate = (logoUrl: string | null) => {
    // Logo update is handled by the useOrganizationLogo hook
    // which automatically refreshes the auth context
  };

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Organization Branding</h3>
        {isAdmin && (
          <Badge variant="secondary">
            <Settings className="w-3 h-3 mr-1" />
            Admin Access
          </Badge>
        )}
      </div>

      {isAdmin ? (
        <OrganizationLogoUpload
          organizationId={organization.id}
          organizationSlug={organization.slug}
          currentLogoUrl={organization.logo_url}
          onLogoUpdate={handleLogoUpdate}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Current Logo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {organization.logo_url ? (
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <img 
                  src={organization.logo_url} 
                  alt={`${organization.name} logo`} 
                  className="w-16 h-16 object-contain rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.src = '/intel-ats-logo.png';
                  }}
                />
                <div>
                  <p className="font-medium">{organization.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Organization logo is active and displayed throughout the platform
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Logo Set</h3>
                <p className="text-sm text-muted-foreground">
                  Contact your organization administrator to upload a logo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Brand Visibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Monitor className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">Desktop Sidebar</p>
                  <p className="text-xs text-muted-foreground">Logo displayed in navigation</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Smartphone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">Mobile Header</p>
                  <p className="text-xs text-muted-foreground">Logo shown on mobile devices</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Brand Consistency</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your logo maintains consistent appearance across all platform interfaces, 
                ensuring professional brand representation for all users.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};