import React from 'react';
import PageLayout from '@/components/PageLayout';
import { AIToolsOverview, AIFeaturesList } from '../components';
import { useAIFeatures } from '../hooks';

export const AIToolsPage = () => {
  const { hasAIAccess } = useAIFeatures();

  return (
    <PageLayout
      title="AI Tools"
      description="Manage and configure your AI-powered recruitment tools"
    >
      <div className="space-y-6">
        <AIToolsOverview />
        {hasAIAccess() && <AIFeaturesList />}
      </div>
    </PageLayout>
  );
};