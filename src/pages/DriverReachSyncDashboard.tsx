import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw, Send, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface ApplicationSyncData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  driverreach_sync_status: string | null;
  driverreach_last_sync: string | null;
  driverreach_applied_via: string | null;
  created_at: string;
  job_title: string;
}

const DriverReachSyncDashboard = () => {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  // Fetch applications with DriverReach sync data
  const { data: applications, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['driverreach-sync', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          first_name,
          last_name,
          status,
          driverreach_sync_status,
          driverreach_last_sync,
          driverreach_applied_via,
          created_at,
          job_listings!inner (
            title,
            organization_id
          )
        `)
        .eq('job_listings.organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      return (data || []).map(app => ({
        ...app,
        job_title: (app.job_listings as any)?.title || 'Unknown Job'
      })) as ApplicationSyncData[];
    },
    enabled: !!organization?.id,
    refetchInterval: 30000, // Reduced from 10s
    refetchIntervalInBackground: false,
  });

  // Fetch credentials for manual sync
  const { data: credentials } = useQuery({
    queryKey: ['driverreach-credentials', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('driverreach_credentials')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  // Fetch field mappings
  const { data: mappings } = useQuery({
    queryKey: ['driverreach-mappings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('driverreach_field_mappings')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_default', true)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      setSyncingIds(prev => new Set(prev).add(applicationId));
      
      // Get application data
      const { data: app, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();
      
      if (appError || !app) throw new Error('Application not found');
      
      // Call DriverReach integration
      const { data, error } = await supabase.functions.invoke('driverreach-integration', {
        body: {
          action: 'send_application',
          applicationData: app,
          config: {
            apiKey: credentials?.api_key,
            companyId: credentials?.company_id,
            apiEndpoint: credentials?.api_endpoint || 'https://api.driverreach.com/v1',
          },
          mappings: mappings?.field_mappings || {},
        },
      });
      
      if (error) throw error;
      
      // Update sync status
      await supabase
        .from('applications')
        .update({
          driverreach_sync_status: 'synced',
          driverreach_last_sync: new Date().toISOString(),
          driverreach_applied_via: 'manual_sync',
        })
        .eq('id', applicationId);
      
      return data;
    },
    onSuccess: () => {
      toast.success('Application synced to DriverReach');
      queryClient.invalidateQueries({ queryKey: ['driverreach-sync'] });
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
    onSettled: (_, __, applicationId) => {
      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    },
  });

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!applications?.length) {
      return { total: 0, synced: 0, pending: 0, failed: 0, successRate: 0 };
    }
    
    const synced = applications.filter(a => a.driverreach_sync_status === 'synced').length;
    const failed = applications.filter(a => a.driverreach_sync_status === 'failed').length;
    const pending = applications.filter(a => !a.driverreach_sync_status).length;
    
    return {
      total: applications.length,
      synced,
      failed,
      pending,
      successRate: applications.length > 0 ? Math.round((synced / (synced + failed || 1)) * 100) : 0,
    };
  }, [applications]);

  const getSyncStatusBadge = (status: string | null) => {
    switch (status) {
      case 'synced':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Synced</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Not Synced</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">DriverReach Sync Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor application sync status with DriverReach ATS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Last updated: {dataUpdatedAt ? formatDistanceToNow(dataUpdatedAt, { addSuffix: true }) : 'Never'}
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Applications</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Synced</CardDescription>
            <CardTitle className="text-3xl text-green-500 flex items-center gap-2">
              {stats.synced}
              <CheckCircle className="w-6 h-6" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-500 flex items-center gap-2">
              {stats.pending}
              <Clock className="w-6 h-6" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {stats.successRate}%
              {stats.successRate >= 90 ? (
                <TrendingUp className="w-6 h-6 text-green-500" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Connection Status */}
      {!credentials && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              <div>
                <h3 className="font-medium">DriverReach Not Configured</h3>
                <p className="text-sm text-muted-foreground">
                  Configure your DriverReach credentials to enable automatic syncing.
                </p>
              </div>
              <Button variant="outline" className="ml-auto" asChild>
                <a href="/integrations/driverreach">Configure Now</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>Application sync status with DriverReach</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sync Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Sync Method</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications?.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    {app.first_name} {app.last_name}
                  </TableCell>
                  <TableCell>{app.job_title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{app.status || 'pending'}</Badge>
                  </TableCell>
                  <TableCell>{getSyncStatusBadge(app.driverreach_sync_status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {app.driverreach_last_sync 
                      ? format(new Date(app.driverreach_last_sync), 'MMM d, yyyy h:mm a')
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {app.driverreach_applied_via || '—'}
                  </TableCell>
                  <TableCell>
                    {app.driverreach_sync_status !== 'synced' && credentials && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => syncMutation.mutate(app.id)}
                        disabled={syncingIds.has(app.id)}
                      >
                        {syncingIds.has(app.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!applications || applications.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No applications found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverReachSyncDashboard;
