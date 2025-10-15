import React from 'react';
import { useAuth } from '@/hooks/useAuth';
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="documentation">API Docs</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          {(userRole === 'admin' || userRole === 'super_admin') && <TabsTrigger value="administrators">Administrators</TabsTrigger>}
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

        {(userRole === 'admin' || userRole === 'super_admin') && (
          <TabsContent value="administrators" className="space-y-6">
            <AdministratorsSettingsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;