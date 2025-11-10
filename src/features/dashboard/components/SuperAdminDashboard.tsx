import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Users, 
  CheckCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { PageLayout } from '@/features/shared';
import { useSuperAdminDashboardData } from '@/hooks/useSuperAdminDashboardData';
import { MetricCard } from './shared/MetricCard';
import { DashboardSkeleton } from './shared/DashboardSkeleton';

export const SuperAdminDashboard = React.memo(() => {
  const { data: metrics, isLoading } = useSuperAdminDashboardData();

  const metricCards = useMemo(() => ({
    organizations: {
      title: "Total Organizations",
      value: metrics?.totalOrganizations || 0,
      description: `${metrics?.organizationGrowth.current || 0} new this month`,
      trend: metrics?.organizationGrowth.percentageChange !== undefined &&
        metrics.organizationGrowth.percentageChange !== 0
        ? {
            value: metrics.organizationGrowth.percentageChange,
            isPositive: metrics.organizationGrowth.percentageChange > 0,
          }
        : undefined
    },
    users: {
      title: "Active Users",
      value: metrics?.totalUsers || 0,
      description: `${metrics?.userGrowth.current || 0} new this month`,
      trend: metrics?.userGrowth.percentageChange !== undefined &&
        metrics.userGrowth.percentageChange !== 0
        ? {
            value: metrics.userGrowth.percentageChange,
            isPositive: metrics.userGrowth.percentageChange > 0,
          }
        : undefined
    },
    health: {
      title: "System Health",
      value: `${metrics?.systemHealth || 99.9}%`,
      description: "All systems operational"
    },
    applications: {
      title: "Total Applications",
      value: metrics?.totalApplications || 0,
      description: "Across all organizations"
    }
  }), [metrics]);

  if (isLoading) {
    return (
      <PageLayout 
        title="Super Admin Dashboard"
        description="System-wide administration and monitoring"
      >
        <DashboardSkeleton cardCount={4} />
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Super Admin Dashboard"
      description="System-wide administration and monitoring"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard {...metricCards.organizations} icon={Building2} />
          <MetricCard {...metricCards.users} icon={Users} />
          <MetricCard {...metricCards.health} icon={CheckCircle} />
          <MetricCard {...metricCards.applications} icon={FileText} />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have super admin privileges. Use them responsibly.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest system events and user actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Activity feed coming soon...</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>Important notifications and warnings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No active alerts</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Management</CardTitle>
                <CardDescription>Manage all organizations in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Organization management interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Configure system-wide settings and parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">System configuration interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>Configure super admin preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Admin settings interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
});

SuperAdminDashboard.displayName = 'SuperAdminDashboard';
