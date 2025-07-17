import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Download, BarChart3, Target, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface MetaPlatformActionsProps {
  platform: {
    id: string;
    name: string;
    api_endpoint: string;
  };
  onRefresh: () => void;
}

const MetaPlatformActions: React.FC<MetaPlatformActionsProps> = ({ platform, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const { toast } = useToast();

  // Fetch Meta accounts
  const { data: metaAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: ['meta-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_ad_accounts')
        .select('*')
        .order('account_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch Meta campaigns
  const { data: metaCampaigns } = useQuery({
    queryKey: ['meta-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_campaigns')
        .select('*')
        .order('campaign_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch Meta spend data
  const { data: metaSpend } = useQuery({
    queryKey: ['meta-spend'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_daily_spend')
        .select('*')
        .gte('date_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date_start', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleMetaAction = async (action: string, accountId?: string, campaignId?: string) => {
    setIsLoading(true);
    setCurrentAction(action);

    try {
      const { data, error } = await supabase.functions.invoke('meta-integration', {
        body: { 
          action, 
          accountId, 
          campaignId,
          datePreset: 'last_30_days'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message || `${action} completed successfully`,
      });

      // Refresh data
      refetchAccounts();
      onRefresh();
    } catch (error) {
      console.error(`Error with ${action}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCurrentAction('');
    }
  };

  const totalMetaSpend = metaSpend?.reduce((sum, record) => sum + (record.spend || 0), 0) || 0;

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <CardTitle className="text-lg">Meta Business Platform</CardTitle>
            <CardDescription>
              Sync ad accounts, campaigns, and performance data from Meta
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-sm font-medium">Ad Accounts</div>
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
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sync Ad Accounts</p>
              <p className="text-sm text-muted-foreground">
                Import your Meta ad accounts and basic information
              </p>
            </div>
            <Button 
              onClick={() => handleMetaAction('sync_accounts')}
              disabled={isLoading}
              size="sm"
            >
              {isLoading && currentAction === 'sync_accounts' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Sync Accounts
            </Button>
          </div>

          {metaAccounts && metaAccounts.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sync Campaigns</p>
                  <p className="text-sm text-muted-foreground">
                    Import campaigns from all your ad accounts
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    // Sync campaigns for all accounts
                    metaAccounts.forEach(account => 
                      handleMetaAction('sync_campaigns', account.account_id)
                    );
                  }}
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
                  <p className="font-medium">Sync Performance Data</p>
                  <p className="text-sm text-muted-foreground">
                    Import spend, impressions, clicks and other metrics
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    // Sync insights for all accounts
                    metaAccounts.forEach(account => 
                      handleMetaAction('sync_insights', account.account_id)
                    );
                  }}
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
            <p className="text-sm font-medium mb-2">Connected Ad Accounts:</p>
            <div className="flex flex-wrap gap-2">
              {metaAccounts.map((account) => (
                <Badge key={account.id} variant="outline">
                  {account.account_name} ({account.currency})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetaPlatformActions;