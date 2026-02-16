import React, { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { DashboardTabsComponent } from './DashboardTabs';
import { useDashboardTabs } from '../hooks/useDashboardTabs';
import { PageLayout } from '@/features/shared';

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

  const pageActions = (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
      Organization Admin
    </Badge>
  );

  return (
    <PageLayout 
      title={`${displayName} Dashboard`} 
      description="Organization management and analytics"
      actions={pageActions}
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-20 md:pb-6">
        <div className="space-y-4 sm:space-y-6">
          <DashboardTabsComponent />
        </div>
      </div>
    </PageLayout>
  );
};

export default DashboardLayout;
