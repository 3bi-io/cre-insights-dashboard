import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminPageLayout } from '@/features/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntegrationsTab from '@/components/settings/IntegrationsTab';
import WebhookDocumentation from '@/components/settings/WebhookDocumentation';
import ApiDocumentation from '@/components/settings/ApiDocumentation';
import ProfileSettingsTab from '@/components/settings/ProfileSettingsTab';
import NotificationsSettingsTab from '@/components/settings/NotificationsSettingsTab';
import PrivacySettingsTab from '@/components/settings/PrivacySettingsTab';
import AdministratorsSettingsTab from '@/components/settings/AdministratorsSettingsTab';

const Settings = () => {
  const { userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  const validTabs = ['profile', 'integrations', 'webhooks', 'documentation', 'notifications', 'privacy', 'administrators'];
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'profile';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <AdminPageLayout
      title="Settings"
      description="Manage your account and application preferences"
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-7' : 'grid-cols-6'}`}>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="documentation">API Docs</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          {isAdmin && <TabsTrigger value="administrators">Team</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileSettingsTab />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsTab />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <WebhookDocumentation />
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <ApiDocumentation />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationsSettingsTab />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <PrivacySettingsTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="administrators" className="space-y-6">
            <AdministratorsSettingsTab />
          </TabsContent>
        )}
      </Tabs>
    </AdminPageLayout>
  );
};

export default Settings;
