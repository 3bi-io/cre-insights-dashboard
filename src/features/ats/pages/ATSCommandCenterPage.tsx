import React, { useState, lazy, Suspense } from 'react';
import { AdminPageLayout, AdminLoadingSkeleton } from '@/features/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LayoutDashboard, 
  Search, 
  Activity, 
  Upload, 
  Settings,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Download
} from 'lucide-react';
import { useTenstreetConfiguration } from '@/hooks/useTenstreetConfiguration';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import TenstreetCredentialsDialog from '@/components/applications/TenstreetCredentialsDialog';
import TenstreetExportDialog from '@/components/tenstreet/TenstreetExportDialog';

// Lazy load tab content
const TenstreetExplorerContent = lazy(() => import('@/components/tenstreet/TenstreetExplorerContent'));
const XchangeManager = lazy(() => import('@/components/tenstreet/XchangeManager'));
const BulkOperationProgress = lazy(() => import('@/components/tenstreet/BulkOperationProgress').then(m => ({ default: m.BulkOperationProgress })));
const RealTimeStatusMonitor = lazy(() => import('@/components/tenstreet/RealTimeStatusMonitor').then(m => ({ default: m.RealTimeStatusMonitor })));
const ApplicationTrendsChart = lazy(() => import('@/components/charts/ApplicationTrendsChart'));
const SourcePerformanceChart = lazy(() => import('@/components/charts/SourcePerformanceChart'));
const ConversionFunnelChart = lazy(() => import('@/components/charts/ConversionFunnelChart'));

const TabLoader = () => (
  <div className="py-8">
    <AdminLoadingSkeleton variant="cards" />
  </div>
);

const ATSCommandCenterPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { credentials, isLoading: configLoading } = useTenstreetConfiguration();

  // Fetch user's organization
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-for-export'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch application metrics summary
  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ['ats-applications-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('id, status, applied_at')
        .order('applied_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch recent Xchange activity
  const { data: xchangeActivity } = useQuery({
    queryKey: ['ats-xchange-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenstreet_xchange_requests')
        .select('*')
        .order('request_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    }
  });

  const isConfigured = !!credentials?.client_id;
  const isLoading = configLoading || appsLoading;

  // Calculate metrics
  const metricsData = {
    total_applications: applicationsData?.length || 0,
    new_this_week: applicationsData?.filter(a => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(a.applied_at || '') > weekAgo;
    }).length || 0,
    conversion_rate: applicationsData?.length 
      ? ((applicationsData.filter(a => a.status === 'hired').length / applicationsData.length) * 100).toFixed(1)
      : '0',
    active_screenings: xchangeActivity?.filter(x => x.status === 'pending' || x.status === 'in_progress').length || 0
  };

  const connectionStatus = isConfigured ? (
    <Badge variant="default" className="flex items-center gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Connected
    </Badge>
  ) : (
    <Badge variant="destructive" className="flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      Not Configured
    </Badge>
  );

  return (
    <AdminPageLayout
      title="ATS Command Center"
      description="Unified dashboard for ATS integration, analytics, and background screening"
      requiredRole={['admin', 'super_admin']}
      actions={connectionStatus}
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {/* Configuration Alert */}
        {!isConfigured && (
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Tenstreet credentials are required to use this integration.{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => setShowCredentialsDialog(true)}>
                Configure now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricsData.total_applications}</div>
              <p className="text-xs text-muted-foreground">{metricsData.new_this_week} new this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricsData.conversion_rate}%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Screenings</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricsData.active_screenings}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Integration</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isConfigured ? 'Active' : 'Setup'}</div>
              <p className="text-xs text-muted-foreground">
                {isConfigured ? 'Credentials configured' : 'Configuration needed'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="explorer" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Explorer
            </TabsTrigger>
            <TabsTrigger value="xchange" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Xchange
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk Ops
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <Suspense fallback={<TabLoader />}>
              {applicationsData && applicationsData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Live Screening Monitor</CardTitle>
                    <CardDescription>Real-time status updates for active background checks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RealTimeStatusMonitor applicationId={applicationsData[0].id} />
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Trends</CardTitle>
                    <CardDescription>Application volume over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ApplicationTrendsChart data={[]} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Source Performance</CardTitle>
                    <CardDescription>Applications by source</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SourcePerformanceChart data={[]} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Screening Activity</CardTitle>
                  <CardDescription>Latest background checks and verifications</CardDescription>
                </CardHeader>
                <CardContent>
                  {xchangeActivity && xchangeActivity.length > 0 ? (
                    <div className="space-y-3">
                      {xchangeActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div>
                            <div className="font-medium capitalize">
                              {activity.request_type.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(activity.request_date).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant={
                            activity.status === 'completed' ? 'default' :
                            activity.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {activity.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent screening activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Suspense>
          </TabsContent>

          <TabsContent value="explorer" className="space-y-4">
            <Suspense fallback={<TabLoader />}>
              <TenstreetExplorerContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="xchange" className="space-y-4">
            <Suspense fallback={<TabLoader />}>
              {isConfigured ? (
                <XchangeManager companyId={credentials?.client_id || ''} />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Configure Tenstreet credentials to access Xchange features.
                  </AlertDescription>
                </Alert>
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Suspense fallback={<TabLoader />}>
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Trends</CardTitle>
                    <CardDescription>Track application volume and patterns over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ApplicationTrendsChart data={[]} />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Source Performance</CardTitle>
                      <CardDescription>Compare performance across different sources</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SourcePerformanceChart data={[]} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Conversion Funnel</CardTitle>
                      <CardDescription>Application to hire conversion rates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ConversionFunnelChart />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Suspense fallback={<TabLoader />}>
              <BulkOperationProgress />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common bulk operations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full justify-start" variant="outline" disabled={!isConfigured}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Applications
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline" 
                      onClick={() => setShowExportDialog(true)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Tenstreet Data
                    </Button>
                    <Button className="w-full justify-start" variant="outline" disabled={!isConfigured}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Sync Status Updates
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Integration Status</CardTitle>
                    <CardDescription>Current sync and connection status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Connection</span>
                      <Badge variant={isConfigured ? 'default' : 'secondary'}>
                        {isConfigured ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tenstreet Company ID</span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {credentials?.client_id ? `***${credentials.client_id.slice(-4)}` : 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Sync</span>
                      <span className="text-sm text-muted-foreground">
                        {credentials?.updated_at 
                          ? new Date(credentials.updated_at).toLocaleString()
                          : 'Never'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Credentials</CardTitle>
                <CardDescription>Manage your Tenstreet API connection settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConfigured ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Client ID</span>
                        <span className="font-mono">***{credentials?.client_id?.slice(-4)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Account Name</span>
                        <span className="font-mono">{credentials?.account_name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => setShowCredentialsDialog(true)}>
                      Update Credentials
                    </Button>
                  </>
                ) : (
                  <Button className="w-full" onClick={() => setShowCredentialsDialog(true)}>
                    Configure Credentials
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <TenstreetCredentialsDialog 
          open={showCredentialsDialog} 
          onOpenChange={setShowCredentialsDialog} 
        />

        <TenstreetExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          organizationId={userProfile?.organization_id}
          tenstreetCompanyId={credentials?.client_id}
        />
      </div>
    </AdminPageLayout>
  );
};

export default ATSCommandCenterPage;
