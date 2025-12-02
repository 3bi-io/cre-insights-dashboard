import React, { lazy, Suspense } from 'react';
import { AdminPageLayout, AdminLoadingSkeleton } from '@/features/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Shield } from 'lucide-react';

// Lazy load tab content
const AIPlatformSettings = lazy(() => import('@/components/ai/AIPlatformSettings'));
const PrivacyControlsContent = lazy(() => import('@/components/settings/PrivacyControlsContent'));

const TabLoader = () => (
  <div className="py-8">
    <AdminLoadingSkeleton variant="form" />
  </div>
);

const AIConfigurationPage = () => {
  return (
    <AdminPageLayout
      title="AI Configuration"
      description="Configure AI behavior, privacy settings, and platform integrations"
      requiredRole={['admin', 'super_admin']}
    >
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy Controls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Suspense fallback={<TabLoader />}>
            <AIPlatformSettings />
          </Suspense>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Suspense fallback={<TabLoader />}>
            <PrivacyControlsContent />
          </Suspense>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
};

export default AIConfigurationPage;
