import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, CheckCircle, FileText, Database } from 'lucide-react';
import { PageLayout } from '@/features/shared';
import { useSuperAdminDashboardData } from '@/hooks/useSuperAdminDashboardData';
import { MetricCard } from './shared/MetricCard';
import { DashboardSkeleton } from './shared/DashboardSkeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OutboundCallAnalytics } from '@/components/voice/OutboundCallAnalytics';
import { OverviewTab, OrganizationsTab, SystemTab, SettingsTab, DataQualityTab } from './tabs';

export const SuperAdminDashboard = React.memo(() => {
  const { data: metrics, isLoading } = useSuperAdminDashboardData();

  // Fetch recent audit logs
  const { data: recentActivity } = useQuery({
    queryKey: ['super-admin-recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, table_name, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch top organizations
  const { data: topOrganizations } = useQuery({
    queryKey: ['super-admin-top-orgs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

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
            <TabsTrigger value="data-quality">Data Quality</TabsTrigger>
            <TabsTrigger value="voice-calls">Voice Calls</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <OverviewTab recentActivity={recentActivity} />
          </TabsContent>
          
          <TabsContent value="organizations">
            <OrganizationsTab
              totalOrganizations={metrics?.totalOrganizations || 0}
              newThisMonth={metrics?.organizationGrowth.current || 0}
              totalUsers={metrics?.totalUsers || 0}
              topOrganizations={topOrganizations}
            />
          </TabsContent>

          <TabsContent value="data-quality">
            <DataQualityTab />
          </TabsContent>

          <TabsContent value="voice-calls" className="space-y-4">
            <OutboundCallAnalytics />
          </TabsContent>
          
          <TabsContent value="system">
            <SystemTab />
          </TabsContent>
          
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
});

SuperAdminDashboard.displayName = 'SuperAdminDashboard';
