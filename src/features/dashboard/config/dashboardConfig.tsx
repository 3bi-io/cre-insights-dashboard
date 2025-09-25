import React from 'react';
import { Bot, Users } from 'lucide-react';
import { OrganizationOverview } from '@/components/dashboard/organization/OrganizationOverview';
import { OrganizationBrandingPanel } from '@/components/dashboard/organization/OrganizationBrandingPanel';
import { OrganizationFeatureStatus } from '@/components/dashboard/organization/OrganizationFeatureStatus';
import { OrganizationUserManagement } from '@/components/dashboard/organization/OrganizationUserManagement';
import { AIFeaturesPanel } from '@/components/dashboard/organization/AIFeaturesPanel';
import { FeatureGuard } from '@/components/FeatureGuard';
import AIImpactDashboard from '@/pages/AIImpactDashboard';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { OrganizationApplicationsTab } from '@/components/dashboard/organization/OrganizationApplicationsTab';

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
  <DashboardContent />
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
    id: 'applications',
    label: 'Applications',
    icon: Users,
    component: OrganizationApplicationsTab,
  },
  {
    id: 'ai-impact',
    label: 'AI Impact',
    component: AIImpactDashboard,
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