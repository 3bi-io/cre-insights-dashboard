import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, CheckCircle, FileText, Globe, LayoutGrid, Activity, Database, Settings, BarChart3, Shield } from 'lucide-react';
import { PageLayout } from '@/features/shared';
import { useSuperAdminDashboardData } from '@/hooks/useSuperAdminDashboardData';
import { MetricCard } from './shared/MetricCard';
import { DashboardSkeleton } from './shared/DashboardSkeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OutboundCallAnalytics } from '@/components/voice/OutboundCallAnalytics';
import { OverviewTab, OrganizationsTab, SystemTab, SettingsTab, DataQualityTab } from './tabs';
import { SimulationAnalyticsPanel } from './SimulationAnalyticsPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const SuperAdminDashboard = React.memo(() => {
  const { data: metrics, isLoading } = useSuperAdminDashboardData();

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

  const metricCards = useMemo(() => [
    {
      title: "Total Organizations",
      value: metrics?.totalOrganizations || 0,
      description: `${metrics?.organizationGrowth.current || 0} new this month`,
      icon: Building2,
      trend: metrics?.organizationGrowth.percentageChange !== undefined &&
        metrics.organizationGrowth.percentageChange !== 0
        ? { value: metrics.organizationGrowth.percentageChange, isPositive: metrics.organizationGrowth.percentageChange > 0 }
        : undefined,
      accentColor: 'border-l-blue-500',
      iconBg: 'bg-blue-500/15 text-blue-400',
    },
    {
      title: "Active Users",
      value: metrics?.totalUsers || 0,
      description: `${metrics?.userGrowth.current || 0} new this month`,
      icon: Users,
      trend: metrics?.userGrowth.percentageChange !== undefined &&
        metrics.userGrowth.percentageChange !== 0
        ? { value: metrics.userGrowth.percentageChange, isPositive: metrics.userGrowth.percentageChange > 0 }
        : undefined,
      accentColor: 'border-l-emerald-500',
      iconBg: 'bg-emerald-500/15 text-emerald-400',
    },
    {
      title: "System Health",
      value: `${metrics?.systemHealth || 99.9}%`,
      description: "All systems operational",
      icon: CheckCircle,
      accentColor: 'border-l-green-500',
      iconBg: 'bg-green-500/15 text-green-400',
    },
    {
      title: "Total Applications",
      value: metrics?.totalApplications || 0,
      description: "Across all organizations",
      icon: FileText,
      accentColor: 'border-l-purple-500',
      iconBg: 'bg-purple-500/15 text-purple-400',
    },
  ], [metrics]);

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
        {/* Super Admin Warning Banner */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Shield className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-500">Super Admin Mode Active</p>
            <p className="text-xs text-muted-foreground">You have full system access. All actions are logged.</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-500 font-medium">Healthy</span>
          </div>
        </div>

        {/* KPI Hero Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card) => (
            <Card key={card.title} className={cn("border-l-4 transition-all duration-200 hover:shadow-md", card.accentColor)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                    {card.trend && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "mt-2 text-[10px]",
                          card.trend.isPositive 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        )}
                      >
                        {card.trend.isPositive ? '+' : ''}{card.trend.value.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  <div className={cn("p-3 rounded-xl", card.iconBg)}>
                    <card.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="organizations" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="data-quality" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Data Quality
            </TabsTrigger>
            <TabsTrigger value="voice-calls" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Voice Calls
            </TabsTrigger>
            <TabsTrigger value="geo-simulation" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Geo Simulation
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-1.5">
              <Database className="h-3.5 w-3.5" />
              System
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </TabsTrigger>
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

          <TabsContent value="geo-simulation" className="space-y-4">
            <SimulationAnalyticsPanel />
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
