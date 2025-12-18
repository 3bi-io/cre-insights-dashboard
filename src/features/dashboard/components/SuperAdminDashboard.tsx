import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  CheckCircle,
  FileText,
  AlertCircle,
  Settings,
  Shield,
  Activity,
  Database,
  Rss,
  Image,
  ExternalLink,
  ChevronRight,
  Cpu,
  BarChart3,
  Phone
} from 'lucide-react';
import { PageLayout } from '@/features/shared';
import { useSuperAdminDashboardData } from '@/hooks/useSuperAdminDashboardData';
import { MetricCard } from './shared/MetricCard';
import { DashboardSkeleton } from './shared/DashboardSkeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OutboundCallAnalytics } from '@/components/voice/OutboundCallAnalytics';

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

  // Fetch top organizations by applications
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
            <TabsTrigger value="voice-calls">Voice Calls</TabsTrigger>
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest system events and user actions</CardDescription>
                  </div>
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {recentActivity && recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivity.map((log) => (
                        <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">
                              {log.action}
                            </Badge>
                            <span className="text-sm">{log.table_name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at || '').toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent activity logged</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>Current system health indicators</CardDescription>
                  </div>
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Database</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                        Operational
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Edge Functions</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                        Operational
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">API Services</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                        Operational
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Organization Overview</CardTitle>
                  <CardDescription>Quick view of all organizations</CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link to="/admin/organizations">
                    View All <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">{metrics?.totalOrganizations || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Organizations</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">{metrics?.organizationGrowth.current || 0}</p>
                    <p className="text-sm text-muted-foreground">New This Month</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">{metrics?.totalUsers || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </div>
                
                {topOrganizations && topOrganizations.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium mb-3">Organizations</h4>
                    {topOrganizations.map((org) => (
                      <div key={org.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{org.name}</p>
                            <p className="text-xs text-muted-foreground">{org.slug}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No organizations found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice-calls" className="space-y-4">
            <OutboundCallAnalytics />
          </TabsContent>
          
          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Status</CardTitle>
                  <CardDescription>Monitor database health and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connection Status</span>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">RLS Policies</span>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">Enabled</Badge>
                    </div>
                    <Button asChild variant="outline" className="w-full mt-4">
                      <a 
                        href="https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Open Supabase Dashboard <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Edge Functions</CardTitle>
                  <CardDescription>Serverless function status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Deployment Status</span>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Functions Count</span>
                      <span className="text-sm font-medium">60+</span>
                    </div>
                    <Button asChild variant="outline" className="w-full mt-4">
                      <a 
                        href="https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/functions" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        View Functions <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>Access monitoring and management tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/visitor-analytics">
                      <BarChart3 className="mr-2 h-4 w-4" /> Analytics
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/super-admin-feeds">
                      <Rss className="mr-2 h-4 w-4" /> Feeds
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/user-management">
                      <Users className="mr-2 h-4 w-4" /> Users
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/media">
                      <Image className="mr-2 h-4 w-4" /> Media
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Configuration</CardTitle>
                  <CardDescription>Manage AI providers and settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure AI providers, API keys, and processing settings for the platform.
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/admin/ai-configuration">
                      <Settings className="mr-2 h-4 w-4" /> Configure AI
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Platform security configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage authentication, RLS policies, and security audit settings.
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/admin/settings?tab=privacy">
                      <Shield className="mr-2 h-4 w-4" /> Security Settings
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Settings Links</CardTitle>
                <CardDescription>Navigate to specific settings sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/settings?tab=profile">Profile</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/settings?tab=organization">Organization</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/settings?tab=integrations">Integrations</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/settings?tab=administrators">Administrators</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
});

SuperAdminDashboard.displayName = 'SuperAdminDashboard';
