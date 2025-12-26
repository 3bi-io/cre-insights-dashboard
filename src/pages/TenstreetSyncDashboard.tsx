import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Users,
  Activity,
  Loader2,
  Send
} from 'lucide-react';
import { formatDistanceToNow, format, subDays } from 'date-fns';
import { toast } from 'sonner';

// CR England Organization ID
const CR_ENGLAND_ORG_ID = '682af95c-e95a-4e21-8753-ddef7f8c1749';

interface ApplicationSyncData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  tenstreet_sync_status: string | null;
  tenstreet_last_sync: string | null;
  tenstreet_applied_via: string | null;
  created_at: string | null;
  job_title: string | null;
}

interface SyncMetrics {
  total: number;
  synced: number;
  pending: number;
  failed: number;
  notSynced: number;
  successRate: number;
  todayApplications: number;
  weekApplications: number;
}

const TenstreetSyncDashboard = () => {
  const queryClient = useQueryClient();
  
  // Fetch CR England applications with Tenstreet sync status
  const { data: applications, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['cr-england-tenstreet-sync'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          first_name,
          last_name,
          status,
          tenstreet_sync_status,
          tenstreet_last_sync,
          tenstreet_applied_via,
          created_at,
          job_listings!inner (
            title,
            organization_id
          )
        `)
        .eq('job_listings.organization_id', CR_ENGLAND_ORG_ID)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      return (data || []).map(app => ({
        ...app,
        job_title: (app.job_listings as any)?.title || 'Unknown Job'
      })) as ApplicationSyncData[];
    },
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  // Fetch Tenstreet credentials status
  const { data: credentials } = useQuery({
    queryKey: ['cr-england-tenstreet-credentials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenstreet_credentials')
        .select('*')
        .eq('organization_id', CR_ENGLAND_ORG_ID)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Calculate metrics
  const metrics: SyncMetrics = React.useMemo(() => {
    if (!applications) return {
      total: 0,
      synced: 0,
      pending: 0,
      failed: 0,
      notSynced: 0,
      successRate: 0,
      todayApplications: 0,
      weekApplications: 0,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = subDays(today, 7);

    const synced = applications.filter(a => a.tenstreet_sync_status === 'synced').length;
    const pending = applications.filter(a => a.tenstreet_sync_status === 'pending').length;
    const failed = applications.filter(a => a.tenstreet_sync_status === 'failed').length;
    const notSynced = applications.filter(a => !a.tenstreet_sync_status).length;
    const total = applications.length;

    return {
      total,
      synced,
      pending,
      failed,
      notSynced,
      successRate: total > 0 ? (synced / total) * 100 : 0,
      todayApplications: applications.filter(a => 
        a.created_at && new Date(a.created_at) >= today
      ).length,
      weekApplications: applications.filter(a => 
        a.created_at && new Date(a.created_at) >= weekAgo
      ).length,
    };
  }, [applications]);

  const handleRefresh = () => {
    refetch();
    toast.success('Refreshing sync data...');
  };

  // Manual sync mutation for unsyced applications
  const syncMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      // Get application data
      const { data: app, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();
      
      if (appError || !app) throw new Error('Application not found');
      
      // Call tenstreet-integration edge function
      const { data, error } = await supabase.functions.invoke('tenstreet-integration', {
        body: {
          action: 'send_application',
          applicationData: app,
          config: {
            clientId: credentials?.client_id,
            password: credentials?.password,
            mode: credentials?.mode || 'PROD',
            service: 'subject_upload',
            source: '3BI',
            companyId: credentials?.company_ids?.[0]?.toString() || '',
            companyName: credentials?.account_name || '',
            appReferrer: '3BI',
            driverId: applicationId,
          },
          mappings: {
            personalData: {
              givenName: 'first_name',
              familyName: 'last_name',
              internetEmailAddress: 'applicant_email',
              primaryPhone: 'phone',
              municipality: 'city',
              region: 'state',
              postalCode: 'zip',
            }
          }
        }
      });
      
      if (error) throw error;
      
      // Update sync status
      await supabase
        .from('applications')
        .update({
          tenstreet_sync_status: 'synced',
          tenstreet_last_sync: new Date().toISOString(),
          tenstreet_applied_via: 'manual_sync'
        })
        .eq('id', applicationId);
      
      return data;
    },
    onSuccess: () => {
      toast.success('Application synced to Tenstreet');
      queryClient.invalidateQueries({ queryKey: ['cr-england-tenstreet-sync'] });
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    }
  });

  const handleManualSync = (applicationId: string) => {
    syncMutation.mutate(applicationId);
  };

  const getSyncStatusBadge = (status: string | null) => {
    switch (status) {
      case 'synced':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Synced</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />Not Synced</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CR England Tenstreet Sync Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of application sync status with Tenstreet ATS
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {dataUpdatedAt ? formatDistanceToNow(dataUpdatedAt, { addSuffix: true }) : 'Never'}
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tenstreet Connection</CardTitle>
              <CardDescription>CR England ATS Integration Status</CardDescription>
            </div>
            {credentials ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        {credentials && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Client ID:</span>
                <p className="font-medium">{credentials.client_id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Account:</span>
                <p className="font-medium">{credentials.account_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Mode:</span>
                <Badge variant={credentials.mode === 'PROD' ? 'default' : 'secondary'}>
                  {credentials.mode}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={credentials.status === 'active' ? 'default' : 'secondary'}>
                  {credentials.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-3xl font-bold">{metrics.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Synced to Tenstreet</p>
                <p className="text-3xl font-bold text-green-600">{metrics.synced}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Sync</p>
                <p className="text-3xl font-bold text-yellow-600">{metrics.pending + metrics.notSynced}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-3xl font-bold text-red-600">{metrics.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sync Success Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</span>
              <span className="text-sm text-muted-foreground">
                {metrics.synced} of {metrics.total} applications synced
              </span>
            </div>
            <Progress value={metrics.successRate} className="h-3" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Today's Applications</p>
                <p className="text-2xl font-bold">{metrics.todayApplications}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{metrics.weekApplications}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Applications
          </CardTitle>
          <CardDescription>
            Latest 100 applications and their Tenstreet sync status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Applicant</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Job</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Applied</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Sync Status</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Last Sync</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {applications?.slice(0, 20).map((app) => (
                  <tr key={app.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2">
                      <span className="font-medium">
                        {app.first_name} {app.last_name}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground max-w-[200px] truncate">
                      {app.job_title}
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {app.created_at ? format(new Date(app.created_at), 'MMM d, h:mm a') : 'N/A'}
                    </td>
                    <td className="py-3 px-2">
                      {getSyncStatusBadge(app.tenstreet_sync_status)}
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">
                      {app.tenstreet_last_sync 
                        ? formatDistanceToNow(new Date(app.tenstreet_last_sync), { addSuffix: true })
                        : 'Never'
                      }
                    </td>
                    <td className="py-3 px-2">
                      {app.tenstreet_sync_status !== 'synced' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManualSync(app.id)}
                          disabled={syncMutation.isPending}
                        >
                          {syncMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-1" />
                              Sync
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {applications && applications.length > 20 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing 20 of {applications.length} applications
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Auto-refreshing every 10 seconds</span>
      </div>
    </div>
  );
};

export default TenstreetSyncDashboard;
