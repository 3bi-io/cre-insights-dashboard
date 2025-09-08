import React, { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { DashboardMetrics } from './DashboardMetrics';
import { DashboardTabsComponent } from './DashboardTabs';
import { OrganizationFeatureStatus } from '@/components/dashboard/organization/OrganizationFeatureStatus';
import { AIFeaturesPanel } from '@/components/dashboard/organization/AIFeaturesPanel';
import { OrganizationBrandingPanel } from '@/components/dashboard/organization/OrganizationBrandingPanel';
import { OrganizationUserManagement } from '@/components/dashboard/organization/OrganizationUserManagement';
import { useDashboardTabs } from '../hooks/useDashboardTabs';
import AIImpactDashboard from '@/pages/AIImpactDashboard';

interface DashboardLayoutProps {
  organizationName?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  organizationName 
}) => {
  const { organization } = useAuth();
  const { setActiveTab } = useDashboardTabs();
  const [searchParams] = useSearchParams();
  const displayName = organizationName || organization?.name || 'Organization';

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams, setActiveTab]);

  const renderTabContent = () => {
    const tab = searchParams.get('tab');
    switch (tab) {
      case 'features':
        return <OrganizationFeatureStatus />;
      case 'ai':
        return <AIFeaturesPanel />;
      case 'branding':
        return <OrganizationBrandingPanel />;
      case 'users':
        return <OrganizationUserManagement />;
      case 'ai-impact':
        return <AIImpactDashboard />;
      default:
        return <DashboardTabsComponent />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {displayName} Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Organization management and analytics
            </p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Organization Admin
          </Badge>
        </div>
      </div>

      {/* Metrics Section */}
      <DashboardMetrics />

      {/* Content Section */}
      {renderTabContent()}
    </div>
  );
};

export default DashboardLayout;