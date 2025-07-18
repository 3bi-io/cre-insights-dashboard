
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, BarChart3, TrendingUp } from 'lucide-react';

interface MetaSyncActionsProps {
  isLoading: boolean;
  currentAction: string;
  metaAccountsCount: number;
  onSyncAccounts: () => void;
  onSyncAllCampaigns: () => void;
  onSyncAllInsights: () => void;
}

const MetaSyncActions: React.FC<MetaSyncActionsProps> = ({
  isLoading,
  currentAction,
  metaAccountsCount,
  onSyncAccounts,
  onSyncAllCampaigns,
  onSyncAllInsights
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Sync Ad Accounts</p>
          <p className="text-sm text-muted-foreground">
            Import your Meta ad accounts and basic information
          </p>
        </div>
        <Button 
          onClick={onSyncAccounts}
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

      {metaAccountsCount > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sync All Campaigns</p>
              <p className="text-sm text-muted-foreground">
                Import campaigns from all your ad accounts ({metaAccountsCount} accounts)
              </p>
            </div>
            <Button 
              onClick={onSyncAllCampaigns}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              {isLoading && currentAction === 'sync_campaigns' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4 mr-2" />
              )}
              Sync All Campaigns
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sync All Performance Data</p>
              <p className="text-sm text-muted-foreground">
                Import spend, impressions, clicks and metrics for account, campaign, adset & ad levels
              </p>
            </div>
            <Button 
              onClick={onSyncAllInsights}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              {isLoading && currentAction === 'sync_insights' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              Sync All Insights
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MetaSyncActions;
