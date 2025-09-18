import React from 'react';
import PageLayout from '@/features/shared/components/PageLayout';
import AIPlatformSettings from '@/components/ai/AIPlatformSettings';

const AIPlatformSettingsPage: React.FC = () => {
  return (
    <PageLayout
      title="AI Platform Settings"
      description="Configure AI behavior, privacy settings, and platform integrations"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AIPlatformSettings />
      </div>
    </PageLayout>
  );
};

export default AIPlatformSettingsPage;