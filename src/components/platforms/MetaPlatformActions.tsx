
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Download, BarChart3, Target, Calendar, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface MetaPlatformActionsProps {
  platform: {
    id: string;
    name: string;
    api_endpoint: string;
  };
  onRefresh: () => void;
}

const CR_ENGLAND_ACCOUNT_ID = '435031743763874';

const MetaPlatformActions: React.FC<MetaPlatformActionsProps> = ({ platform, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const { toast } = useToast();

  // Fetch Meta accounts - filter for CR England only
  const { data: metaAccounts, refetch: refetchAccounts, isError: accountsError } = useQuery({
    queryKey: ['meta-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_ad_accounts')
        .select('*')
        .eq('account_id', CR_ENGLAND_ACCOUNT_ID)
        .order('account_name');
      
      if (error) throw error;
      return data;
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch Meta campaigns - filter for CR England account only
  const { data: metaCampaigns, refetch: refetchCampaigns } = useQuery({
    queryKey: ['meta-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_campaigns')
        .select('*')
        .eq('account_id', CR_ENGLAND_ACCOUNT_ID)
        .order('campaign_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!metaAccounts?.length,
  });

  // Fetch Meta spend data - filter for CR England account only
  const { data: metaSpend, refetch: refetchSpend } = useQuery({
    queryKey: ['meta-spend'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('meta_daily_spend')
        .select('*')
        .eq('account_id', CR_ENGLAND_ACCOUNT_ID)
        .gte('date_start', thirtyDaysAgo)
        .order('date_start', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!metaAccounts?.length,
  });

  const handleMetaAction = async (action: string, accountId?: string, campaignId?: string) => {
    setIsLoading(true);
    setCurrentAction(action);
    setSyncProgress(0);
    setSyncStatus(`Starting ${action}...`);

    try {
      console.log(`Attempting ${action} with accountId: ${accountId || CR_ENGLAND_ACCOUNT_ID}`);
      
      const { data, error } = await supabase.functions.invoke('meta-integration', {
        body: { 
          action, 
          accountId: accountId || CR_ENGLAND_ACCOUNT_ID,
          campaignId,
          datePreset: 'last_30d'
        }
      });

      if (error) {
        console.error(`Supabase function error:`, error);
        throw error;
      }

      setSyncProgress(100);
      setSyncStatus('Sync completed successfully');

      toast({
        title: "Success",
        description: data.message || `${action} completed successfully`,
      });

      // Refresh appropriate data based on action
      if (action === 'sync_accounts') {
        refetchAccounts();
      } else if (action === 'sync_campaigns') {
        refetchCampaigns();
      } else if (action === 'sync_insights') {
        refetchSpend();
      }
      
      onRefresh();
    } catch (error: any) {
      console.error(`Error with ${action}:`, error);
      setSyncStatus(`Error: ${error.message || 'Unknown error occurred'}`);
      toast({
        title: "Error",
        description: `Failed to ${action}. ${error.message || 'Please check the logs and try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCurrentAction('');
      setTimeout(() => {
        setSyncProgress(0);
        setSyncStatus('');
      }, 3000);
    }
  };

  const totalMetaSpend = metaSpend?.reduce((sum, record) => sum + (record.spend || 0), 0) || 0;
  const totalImpressions = metaSpend?.reduce((sum, record) => sum + (record.impressions || 0), 0) || 0;
  const totalClicks = metaSpend?.reduce((sum, record) => sum + (record.clicks || 0), 0) || 0;

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <CardTitle className="text-lg">Meta Business Platform - CR England</CardTitle>
            <CardDescription>
              Sync ad accounts, campaigns, and performance data for CR England account only
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {accountsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load CR England Meta account. Please check your API configuration and try again.
            </AlertDescription>
          </Alert>
        )}

        {syncStatus && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div>{syncStatus}</div>
              {syncProgress > 0 && syncProgress < 100 && (
                <Progress value={syncProgress} className="w-full" />
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-sm font-medium">CR England Account</div>
            <div className="text-2xl font-bold text-blue-600">
              {metaAccounts?.length || 0}
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-sm font-medium">Campaigns</div>
            <div className="text-2xl font-bold text-green-600">
              {metaCampaigns?.length || 0}
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <div className="text-sm font-medium">30d Spend</div>
            <div className="text-2xl font-bold text-purple-600">
              ${totalMetaSpend.toFixed(2)}
            </div>
          </div>

          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <div className="text-sm font-medium">Last Sync</div>
            <div className="text-sm font-medium text-orange-600">
              {metaAccounts?.length ? 'Active' : 'Never'}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sync CR England Account</p>
              <p className="text-sm text-muted-foreground">
                Import CR England Meta ad account and basic information
              </p>
            </div>
            <Button 
              onClick={() => handleMetaAction('sync_accounts', CR_ENGLAND_ACCOUNT_ID)}
              disabled={isLoading}
              size="sm"
            >
              {isLoading && currentAction === 'sync_accounts' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Sync Account
            </Button>
          </div>

          {metaAccounts && metaAccounts.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sync CR England Campaigns</p>
                  <p className="text-sm text-muted-foreground">
                    Import campaigns from CR England ad account
                  </p>
                </div>
                <Button 
                  onClick={() => handleMetaAction('sync_campaigns', CR_ENGLAND_ACCOUNT_ID)}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                >
                  {isLoading && currentAction === 'sync_campaigns' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="w-4 h-4 mr-2" />
                  )}
                  Sync Campaigns
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sync CR England Performance Data</p>
                  <p className="text-sm text-muted-foreground">
                    Import spend, impressions, clicks and other metrics for CR England
                  </p>
                </div>
                <Button 
                  onClick={() => handleMetaAction('sync_insights', CR_ENGLAND_ACCOUNT_ID)}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                >
                  {isLoading && currentAction === 'sync_insights' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  Sync Insights
                </Button>
              </div>
            </>
          )}
        </div>

        {metaAccounts && metaAccounts.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">CR England Ad Account:</p>
            <div className="grid grid-cols-1 gap-2">
              {metaAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div>
                    <Badge variant="default" className="mb-1 bg-blue-600">
                      {account.account_name}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      ID: {account.account_id} • {account.currency} • {account.timezone_name}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMetaAction('sync_campaigns', account.account_id)}
                      disabled={isLoading}
                      title="Sync campaigns for CR England"
                    >
                      <BarChart3 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMetaAction('sync_insights', account.account_id)}
                      disabled={isLoading}
                      title="Sync insights for CR England"
                    >
                      <Calendar className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalImpressions > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">CR England 30-Day Performance Summary:</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold">{totalImpressions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Impressions</p>
              </div>
              <div>
                <p className="text-lg font-bold">{totalClicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Clicks</p>
              </div>
              <div>
                <p className="text-lg font-bold">
                  {totalClicks > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'}%
                </p>
                <p className="text-xs text-muted-foreground">CTR</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetaPlatformActions;
