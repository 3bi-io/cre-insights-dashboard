import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { DashboardMetrics } from './DashboardMetrics';
import { DashboardTabsComponent } from './DashboardTabs';

interface DashboardLayoutProps {
  organizationName?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  organizationName 
}) => {
  const { organization } = useAuth();
  const displayName = organizationName || organization?.name || 'Organization';

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

      {/* Tabs Section */}
      <DashboardTabsComponent />
    </div>
  );
};

export default DashboardLayout;