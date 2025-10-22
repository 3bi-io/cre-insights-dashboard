import React, { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useSearchParams, Link } from 'react-router-dom';
import { DashboardMetrics } from './DashboardMetrics';
import { DashboardTabsComponent } from './DashboardTabs';
import { OrganizationFeatureStatus } from '@/components/dashboard/organization/OrganizationFeatureStatus';
import { AIFeaturesPanel } from '@/components/dashboard/organization/AIFeaturesPanel';
import { OrganizationBrandingPanel } from '@/components/dashboard/organization/OrganizationBrandingPanel';
import { OrganizationUserManagement } from '@/components/dashboard/organization/OrganizationUserManagement';
import { useDashboardTabs } from '../hooks/useDashboardTabs';
import AIImpactDashboard from '@/pages/AIImpactDashboard';
import { PageLayout } from '@/features/shared';
import { Lock, CreditCard } from 'lucide-react';

interface DashboardLayoutProps {
  organizationName?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  organizationName 
}) => {
  const { organization, userRole } = useAuth();
  const { hasActiveSubscription, subscriptionStatus, isTrialing } = useSubscription();
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

  const pageActions = (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
      Organization Admin
    </Badge>
  );

  const currentTab = searchParams.get('tab');
  const hideHeader = currentTab === 'features';

  return (
    <PageLayout 
      title={hideHeader ? undefined : "Dashboard"} 
      description={hideHeader ? undefined : "Organization management and analytics"}
      actions={pageActions}
    >
      <div className="p-6 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Subscription Status Banner - Super admins bypass */}
          {userRole !== 'super_admin' && !hasActiveSubscription && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertTitle>Subscription Required</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {subscriptionStatus === 'inactive' 
                    ? 'Your organization needs an active subscription to access all features.'
                    : 'Your subscription has expired. Renew to continue using all features.'}
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link to="/pricing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    View Plans
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Trial Status Banner */}
          {userRole !== 'super_admin' && isTrialing && (
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span>You're currently on a trial. Upgrade to continue using all features after your trial ends.</span>
                <Button asChild size="sm" variant="outline">
                  <Link to="/pricing">Upgrade Now</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Content Section */}
          {renderTabContent()}
        </div>
      </div>
    </PageLayout>
  );
};

export default DashboardLayout;