import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Activity, 
  Upload, 
  Settings,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { useTenstreetConfiguration } from '@/hooks/useTenstreetConfiguration';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BulkOperationProgress } from '@/components/tenstreet/BulkOperationProgress';
import { RealTimeStatusMonitor } from '@/components/tenstreet/RealTimeStatusMonitor';
import ApplicationTrendsChart from '@/components/charts/ApplicationTrendsChart';
import SourcePerformanceChart from '@/components/charts/SourcePerformanceChart';
import ConversionFunnelChart from '@/components/charts/ConversionFunnelChart';
import TenstreetCredentialsDialog from '@/components/applications/TenstreetCredentialsDialog';

export default function TenstreetDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { credentials } = useTenstreetConfiguration();
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);

  // Fetch application metrics summary
  const { data: applicationsData } = useQuery({
    queryKey: ['tenstreet-applications-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('id, status, applied_at')
        .order('applied_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Calculate metrics from applications
  const metricsData = {
    total_applications: applicationsData?.length || 0,
    new_this_week: applicationsData?.filter(a => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(a.applied_at) > weekAgo;
    }).length || 0,
    conversion_rate: applicationsData?.length 
      ? ((applicationsData.filter(a => a.status === 'hired').length / applicationsData.length) * 100).toFixed(1)
      : '0',
    avg_time_to_hire: 12 // Placeholder
  };

  // Fetch recent Xchange activity
  const { data: xchangeActivity } = useQuery({
    queryKey: ['tenstreet-xchange-activity'],
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/integrations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Integrations
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tenstreet Command Center</h1>
            <p className="text-muted-foreground">
              Unified dashboard for ATS integration, analytics, and background screening
            </p>
          </div>
        </div>
        {isConfigured ? (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Connected
          </Badge>
        ) : (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Not Configured
          </Badge>
        )}
      </div>

      {/* Configuration Alert */}
      {!isConfigured && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Configuration Required
            </CardTitle>
            <CardDescription className="text-yellow-800 dark:text-yellow-200">
              Tenstreet credentials are required to use this integration. Please configure your API credentials to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowCredentialsDialog(true)}>
              Configure Credentials
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData?.total_applications || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metricsData?.new_this_week || 0} new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData?.conversion_rate || '0'}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Screenings</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {xchangeActivity?.filter(x => x.status === 'pending' || x.status === 'in_progress').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData?.avg_time_to_hire || 0} days</div>
            <p className="text-xs text-muted-foreground">
              Application to hire
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Real-Time Monitoring Section */}
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Screening Activity</CardTitle>
                  <CardDescription>Latest background checks and verifications</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/tenstreet/xchange')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {xchangeActivity && xchangeActivity.length > 0 ? (
                <div className="space-y-3">
                  {xchangeActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/admin/tenstreet/xchange')}
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
                        activity.status === 'failed' ? 'destructive' :
                        'secondary'
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => navigate('/admin/tenstreet/xchange')}
                  >
                    Start Screening
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/tenstreet-focus')}>
                View Full Analytics
              </Button>
              <Button onClick={() => navigate('/tenstreet-xchange')}>
                Manage Screenings
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
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
                <Button className="w-full justify-start" variant="outline" disabled={!isConfigured}>
                  <Activity className="h-4 w-4 mr-2" />
                  Export Data
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
                  {isConfigured ? (
                    <Badge variant="default">Connected</Badge>
                  ) : (
                    <Badge variant="secondary">Disconnected</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Sync</span>
                  <span className="text-sm text-muted-foreground">
                    {credentials?.updated_at 
                      ? new Date(credentials.updated_at).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Field Mappings</span>
                  <Badge variant="outline">Configured</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Credentials</CardTitle>
                <CardDescription>
                  Manage your Tenstreet API connection settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConfigured ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Client ID</span>
                        <span className="font-mono">***{credentials.client_id?.slice(-4)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Account Name</span>
                        <span className="font-mono">{credentials.account_name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowCredentialsDialog(true)}
                    >
                      Update Credentials
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      No credentials configured
                    </p>
                    <Button onClick={() => setShowCredentialsDialog(true)}>
                      Configure Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Field Mappings</CardTitle>
                <CardDescription>
                  Configure how application data maps to Tenstreet fields
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Field mappings control how data is sent to Tenstreet when posting applications
                  to the ATS.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/admin/tenstreet-integration')}
                >
                  Configure Mappings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Explorer</CardTitle>
                <CardDescription>
                  Test and explore Tenstreet API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Use the API Explorer to test connections, validate data, and troubleshoot integration issues.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/tenstreet-explorer')}
                  disabled={!isConfigured}
                >
                  Open API Explorer
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>
                  Resources and guides
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://docs.tenstreet.com" target="_blank" rel="noopener noreferrer">
                    Tenstreet API Documentation
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Integration Guide
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Troubleshooting
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialogs */}
      <TenstreetCredentialsDialog 
        open={showCredentialsDialog}
        onOpenChange={setShowCredentialsDialog}
      />
    </div>
  );
}
