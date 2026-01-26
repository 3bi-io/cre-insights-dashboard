import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminPageLayout } from '@/features/shared';
import { PlatformCredentialsManager } from '../components/admin/PlatformCredentialsManager';
import { AdCreativeStudio } from '../components/admin/AdCreativeStudio';
import { OAuthConfigPanel } from '../components/admin/OAuthConfigPanel';
import { GlobalSettingsPanel } from '../components/admin/GlobalSettingsPanel';
import { SocialAnalyticsPanel } from '../components/admin/SocialAnalyticsPanel';
import { useAuth } from '@/hooks/useAuth';
import { 
  Settings, 
  Key, 
  Sparkles, 
  Shield, 
  BarChart3,
  Antenna
} from 'lucide-react';

export function SuperAdminSocialBeacons() {
  const { user } = useAuth();

  return (
    <AdminPageLayout
      title="Social Beacons"
      description="Super administrator configuration for social media distribution and engagement"
    >
      <Tabs defaultValue="credentials" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-5 min-w-max">
            <TabsTrigger value="credentials" className="whitespace-nowrap">
              <Key className="h-4 w-4 mr-2" />
              Credentials
            </TabsTrigger>
            <TabsTrigger value="oauth" className="whitespace-nowrap">
              <Shield className="h-4 w-4 mr-2" />
              OAuth Setup
            </TabsTrigger>
            <TabsTrigger value="creative" className="whitespace-nowrap">
              <Sparkles className="h-4 w-4 mr-2" />
              Ad Creative
            </TabsTrigger>
            <TabsTrigger value="settings" className="whitespace-nowrap">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="whitespace-nowrap">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="credentials" className="space-y-6">
          <PlatformCredentialsManager organizationId={null} />
        </TabsContent>

        <TabsContent value="oauth" className="space-y-6">
          <OAuthConfigPanel organizationId={null} />
        </TabsContent>

        <TabsContent value="creative" className="space-y-6">
          <AdCreativeStudio />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <GlobalSettingsPanel organizationId={null} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <SocialAnalyticsPanel organizationId={null} />
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}

export default SuperAdminSocialBeacons;
