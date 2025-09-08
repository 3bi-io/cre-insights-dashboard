import React from 'react';
import { Bot, Share2 } from 'lucide-react';
import { OrganizationOverview } from '@/components/dashboard/organization/OrganizationOverview';
import { OrganizationBrandingPanel } from '@/components/dashboard/organization/OrganizationBrandingPanel';
import { OrganizationFeatureStatus } from '@/components/dashboard/organization/OrganizationFeatureStatus';
import { OrganizationJobManagement } from '@/components/dashboard/organization/OrganizationJobManagement';
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

const TenstreetComponent: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center py-12">
      <Share2 className="w-12 h-12 mx-auto mb-4 text-primary" />
      <h3 className="text-lg font-medium mb-2">Tenstreet Integration Active</h3>
      <p className="text-sm text-muted-foreground">
        Your organization has access to Tenstreet ATS integration features.
      </p>
    </div>
  </div>
);

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
    id: 'branding',
    label: 'Branding',
    component: OrganizationBrandingPanel,
  },
  {
    id: 'features',
    label: 'Features',
    component: OrganizationFeatureStatus,
  },
  {
    id: 'jobs',
    label: 'Jobs',
    component: OrganizationJobManagement,
    featureGuard: {
      feature: 'meta_integration',
      featureName: 'Job Management',
      showUpgrade: false,
    },
  },
  {
    id: 'users',
    label: 'Users',
    component: OrganizationUserManagement,
  },
  {
    id: 'ai',
    label: 'AI Tools',
    icon: Bot,
    component: AIFeaturesPanel,
    featureGuard: {
      feature: 'openai_access',
      featureName: 'AI Features',
      showUpgrade: false,
      fallback: AIFallbackComponent,
    },
  },
  {
    id: 'tenstreet',
    label: 'Tenstreet',
    icon: Share2,
    component: TenstreetComponent,
    featureGuard: {
      feature: 'tenstreet_access',
      featureName: 'Tenstreet Integration',
    },
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