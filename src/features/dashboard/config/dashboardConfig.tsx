import React from 'react';
import { Bot } from 'lucide-react';
import { OrganizationOverview } from '@/components/dashboard/organization/OrganizationOverview';
import { OrganizationBrandingPanel } from '@/components/dashboard/organization/OrganizationBrandingPanel';
import { OrganizationFeatureStatus } from '@/components/dashboard/organization/OrganizationFeatureStatus';
import { OrganizationUserManagement } from '@/components/dashboard/organization/OrganizationUserManagement';
import { AIFeaturesPanel } from '@/components/dashboard/organization/AIFeaturesPanel';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import { FeatureGuard } from '@/components/FeatureGuard';

export interface DashboardTab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
  featureGuard?: {
    feature: string;
    featureName: string;
    showUpgrade?: boolean;
    fallback?: React.ComponentType;
  };
  requiresAccess?: () => boolean;
}

const AnalyticsComponent: React.FC = () => (
  <DashboardTabs activeTab="dashboard" onTabChange={() => {}} />
);

const AIFallbackComponent: React.FC = () => (
  <FeatureGuard feature="anthropic_access" featureName="AI Features">
    <AIFeaturesPanel />
  </FeatureGuard>
);

export const dashboardTabs: DashboardTab[] = [
  {
    id: 'overview',
    label: 'Overview',
    component: OrganizationOverview,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    component: AnalyticsComponent,
    featureGuard: {
      feature: 'advanced_analytics',
      featureName: 'Advanced Analytics',
    },
  },
];