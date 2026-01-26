import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { AdminPageLayout } from '@/features/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntegrationsTab from '@/components/settings/IntegrationsTab';
import WebhookDocumentation from '@/components/settings/WebhookDocumentation';
import ApiDocumentation from '@/components/settings/ApiDocumentation';
import ProfileSettingsTab from '@/components/settings/ProfileSettingsTab';
import NotificationsSettingsTab from '@/components/settings/NotificationsSettingsTab';
import PrivacySettingsTab from '@/components/settings/PrivacySettingsTab';

import VerificationsSettingsTab from '@/components/settings/VerificationsSettingsTab';
import SecuritySettingsTab from '@/components/settings/SecuritySettingsTab';

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const validTabs = ['profile', 'security', 'integrations', 'verifications', 'webhooks', 'documentation', 'notifications', 'privacy'];
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
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-8 min-w-max">
            <TabsTrigger value="profile" className="whitespace-nowrap">Profile</TabsTrigger>
            <TabsTrigger value="security" className="whitespace-nowrap">Security</TabsTrigger>
            <TabsTrigger value="integrations" className="whitespace-nowrap">Integrations</TabsTrigger>
            <TabsTrigger value="verifications" className="whitespace-nowrap">Verifications</TabsTrigger>
            <TabsTrigger value="webhooks" className="whitespace-nowrap">Webhooks</TabsTrigger>
            <TabsTrigger value="documentation" className="whitespace-nowrap">API Docs</TabsTrigger>
            <TabsTrigger value="notifications" className="whitespace-nowrap">Notifications</TabsTrigger>
            <TabsTrigger value="privacy" className="whitespace-nowrap">Privacy</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="space-y-6">
          <ProfileSettingsTab />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettingsTab />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsTab />
        </TabsContent>

        <TabsContent value="verifications" className="space-y-6">
          <VerificationsSettingsTab />
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
      </Tabs>
    </AdminPageLayout>
  );
};

export default Settings;
