import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Download, BarChart3, Target, AlertCircle, CheckCircle2, RefreshCw, Users, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import DateRangeFilter from './DateRangeFilter';
import MetaSpendMetrics from './MetaSpendMetrics';
import { getActualAccountId, getDisplayAccountId, transformAccountDataForDisplay } from '@/utils/metaAccountAlias';

interface MetaPlatformActionsProps {
  platform: {
    id: string;
    name: string;
    api_endpoint: string;
  };
  onRefresh: () => void;
}

// Display account ID (alias)
const CR_ENGLAND_DISPLAY_ID = '897639563274136';
// Actual account ID for API calls
const CR_ENGLAND_ACTUAL_ID = getActualAccountId(CR_ENGLAND_DISPLAY_ID);

// Map our frontend date ranges to Meta API valid date_preset values
const getMetaDatePreset = (dateRange: string): string => {
  switch (dateRange) {
    case 'last_7d':
      return 'last_7d';
    case 'last_14d':
      return 'last_14d';
    case 'last_30d':
      return 'last_30d';
    case 'last_60d':
      return 'last_90d'; // Meta doesn't have 60d, use 90d instead
    case 'last_90d':
      return 'last_90d';
    case 'this_month':
      return 'this_month';
    case 'last_month':
      return 'last_month';
    default:
      return 'last_30d';
  }
};

// Compute approximate days window for leads sync
const getSinceDays = (dateRange: string): number => {
  const now = new Date();
  switch (dateRange) {
    case 'last_7d':
      return 7;
    case 'last_14d':
      return 14;
    case 'last_30d':
      return 30;
    case 'last_60d':
      return 60;
    case 'last_90d':
      return 90;
    case 'this_month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return Math.max(1, Math.ceil((now.getTime() - first.getTime()) / (24 * 60 * 60 * 1000)));
    }
    case 'last_month':
      return 30; // simple default
    default:
      return 30;
  }
};

const MetaPlatformActions: React.FC<MetaPlatformActionsProps> = ({ platform, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState('last_30d');
  const { toast } = useToast();

  const { data: metaAccounts, refetch: refetchAccounts, isError: accountsError } = useQuery({
    queryKey: ['meta-accounts', CR_ENGLAND_ACTUAL_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_ad_accounts')
        .select('*')
        .eq('account_id', CR_ENGLAND_ACTUAL_ID)
        .order('account_name');
      
      if (error) throw error;
      
      // Transform data to show display IDs
      const transformedData = data?.map(transformAccountDataForDisplay);
      return transformedData;
    },
    retry: 2,
    retryDelay: 1000,
  });

  const { data: metaCampaigns, refetch: refetchCampaigns } = useQuery({
    queryKey: ['meta-campaigns', CR_ENGLAND_ACTUAL_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_campaigns')
        .select('*')
        .eq('account_id', CR_ENGLAND_ACTUAL_ID)
        .order('campaign_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!metaAccounts?.length,
  });

  const { data: metaSpend, refetch: refetchSpend } = useQuery({
    queryKey: ['meta-spend', dateRange],
    queryFn: async () => {
      let startDate: string;
      const today = new Date();
      
      switch (dateRange) {
        case 'last_7d':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last_14d':
          startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last_60d':
          startDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'last_90d':
          startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'this_month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          break;
        case 'last_month':
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          startDate = lastMonth.toISOString().split('T')[0];
          break;
        default:
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('meta_daily_spend')
        .select('*')
        .eq('account_id', CR_ENGLAND_ACTUAL_ID)
        .gte('date_start', startDate)
        .order('date_start', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!metaAccounts?.length,
  });

  const { data: metaAdSets } = useQuery({
    queryKey: ['meta-ad-sets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_ad_sets')
        .select('*')
        .eq('account_id', CR_ENGLAND_ACTUAL_ID)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!metaAccounts?.length,
  });

  const { data: metaAds } = useQuery({
    queryKey: ['meta-ads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_ads')
        .select('*')
        .eq('account_id', CR_ENGLAND_ACTUAL_ID)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!metaAccounts?.length,
  });

  const handleMetaAction = async (action: string, accountId?: string, campaignId?: string) => {
    setIsLoading(true);
    setCurrentAction(action);
    setSyncProgress(10);
    setSyncStatus(`Starting ${action}...`);

    try {
      // Use actual account ID for API calls
      const actualAccountId = getActualAccountId(accountId || CR_ENGLAND_DISPLAY_ID);
      
      const metaDatePreset = getMetaDatePreset(dateRange);
      const sinceDays = getSinceDays(dateRange);
      setSyncProgress(30);
      setSyncStatus(`Connecting to Meta API...`);
      
      const { data, error } = await supabase.functions.invoke('meta-integration', {
        body: { 
          action, 
          accountId: actualAccountId,
          campaignId,
          datePreset: metaDatePreset,
          sinceDays
        }
      });

      if (error) {
        console.error(`Supabase function error:`, error);
        throw error;
      }

      setSyncProgress(80);
      setSyncStatus('Processing data...');
      
      // Add a small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 500));

      setSyncProgress(100);
      setSyncStatus('Sync completed successfully');

      toast({
        title: "Success",
        description: data.message || `${action} completed successfully`,
      });

      // Refresh the appropriate data
      if (action === 'sync_accounts') {
        await refetchAccounts();
      } else if (action === 'sync_campaigns') {
        await refetchCampaigns();
      } else if (action === 'sync_adsets') {
        // Refresh campaigns as ad sets are related to campaigns
        await refetchCampaigns();
      } else if (action === 'sync_ads') {
        // Refresh campaigns as ads are related to campaigns
        await refetchCampaigns();
      } else if (action === 'sync_insights') {
        await refetchSpend();
      }
      
      onRefresh();
    } catch (error: any) {
      console.error(`Error with ${action}:`, error);
      setSyncStatus(`Error: ${error.message || 'Unknown error occurred'}`);
      setSyncProgress(0);
      
      toast({
        title: "Error",
        description: `Failed to ${action}. ${error.message || 'Please check your Meta API configuration and try again.'}`,
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/9d2222a9-c812-4222-ba8e-20535dc278b6.png" 
                alt="Meta" 
                className="w-8 h-8"
              />
              <div>
                <CardTitle className="text-lg">Meta Business Platform - CR England</CardTitle>
                <CardDescription>
                  Sync ad accounts, campaigns, and performance data for CR England account only
                </CardDescription>
              </div>
            </div>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
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
              <Users className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="text-sm font-medium">Adsets</div>
              <div className="text-2xl font-bold text-purple-600">
                {metaAdSets?.length || 0}
              </div>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Zap className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <div className="text-sm font-medium">Ads</div>
              <div className="text-2xl font-bold text-orange-600">
                {metaAds?.length || 0}
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
                onClick={() => handleMetaAction('sync_accounts', CR_ENGLAND_DISPLAY_ID)}
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
                    onClick={() => handleMetaAction('sync_campaigns', CR_ENGLAND_DISPLAY_ID)}
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
                    <p className="font-medium">Sync CR England Ad Sets</p>
                    <p className="text-sm text-muted-foreground">
                      Import ad sets with metrics from CR England account
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleMetaAction('sync_adsets', CR_ENGLAND_DISPLAY_ID)}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                  >
                    {isLoading && currentAction === 'sync_adsets' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Users className="w-4 h-4 mr-2" />
                    )}
                    Sync Ad Sets
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sync CR England Ads</p>
                    <p className="text-sm text-muted-foreground">
                      Import individual ads from CR England account
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleMetaAction('sync_ads', CR_ENGLAND_DISPLAY_ID)}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                  >
                    {isLoading && currentAction === 'sync_ads' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    Sync Ads
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto Meta Leads</p>
                    <p className="text-sm text-muted-foreground">
                      Meta leads are automatically imported every 6 hours
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          setIsLoading(true);
                          setSyncStatus('Manually syncing Meta leads...');
                          const response = await fetch('https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/meta-leads-cron?sinceHours=336', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                          });
                          const result = await response.json();
                          toast({
                            title: "Meta Leads Sync",
                            description: `Synced ${result.inserted || 0} new leads, skipped ${result.skipped || 0} existing`,
                          });
                          setSyncStatus('');
                          
                          // Check total Meta leads after sync
                          await supabase
                            .from('applications')
                            .select('source')
                            .in('source', ['fb', 'ig', 'meta']);
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: `Failed to sync leads: ${error.message}`,
                            variant: "destructive",
                          });
                          setSyncStatus('');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      title="Manual sync (last 14 days)"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                  </div>
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
                         onClick={() => handleMetaAction('sync_adsets', account.account_id)}
                         disabled={isLoading}
                         title="Sync ad sets for CR England"
                       >
                         <Users className="w-3 h-3" />
                       </Button>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => handleMetaAction('sync_ads', account.account_id)}
                         disabled={isLoading}
                         title="Sync ads for CR England"
                       >
                         <Zap className="w-3 h-3" />
                       </Button>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalImpressions > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">CR England Performance Summary ({dateRange.replace('_', ' ')}):</p>
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

      {/* AI-Powered Meta Spend Metrics */}
      <MetaSpendMetrics />
    </div>
  );
};

export default MetaPlatformActions;
