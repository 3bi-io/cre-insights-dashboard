import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, MousePointer, Eye, Users } from 'lucide-react';
import { logger } from '@/lib/logger';

const AdzunaPlatformActions = () => {
  const [campaignId, setCampaignId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  const handleSyncAnalytics = async () => {
    if (!campaignId) {
      toast({
        title: "Missing Campaign ID",
        description: "Please enter your Adzuna campaign ID",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('adzuna-integration', {
        body: {
          action: 'sync_analytics',
          campaignId,
          startDate,
          endDate
        }
      });

      if (error) throw error;

      toast({
        title: "Analytics Synced",
        description: data.message
      });

      // Fetch stats after sync
      await handleGetStats();
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStats = async () => {
    if (!campaignId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('adzuna-integration', {
        body: {
          action: 'get_stats',
          campaignId
        }
      });

      if (error) throw error;

      setStats(data.totals);
    } catch (error: any) {
      logger.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <img 
              src="https://www.adzuna.com/static/images/adzuna_logo.png" 
              alt="Adzuna" 
              className="h-8"
            />
            <div>
              <CardTitle>Adzuna Integration</CardTitle>
              <CardDescription>
                Programmatic job advertising with performance analytics
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaignId">Campaign ID</Label>
              <Input
                id="campaignId"
                placeholder="Enter Adzuna campaign ID"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSyncAnalytics}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Sync Analytics (Last 30 Days)'
                )}
              </Button>
              <Button
                onClick={handleGetStats}
                variant="outline"
                disabled={isLoading || !campaignId}
              >
                Refresh Stats
              </Button>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Total Spend
                </div>
                <div className="text-2xl font-bold">${Number(stats.spend).toFixed(2)}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MousePointer className="h-4 w-4" />
                  Clicks
                </div>
                <div className="text-2xl font-bold">{stats.clicks.toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  Impressions
                </div>
                <div className="text-2xl font-bold">{stats.impressions.toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Applications
                </div>
                <div className="text-2xl font-bold">{stats.applications}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">CTR</div>
                <div className="text-lg font-semibold">{stats.ctr}%</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">CPC</div>
                <div className="text-lg font-semibold">${stats.cpc}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">CPA</div>
                <div className="text-lg font-semibold">${stats.cpa}</div>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-semibold">Integration Features</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Programmatic job advertising with real-time bidding</li>
              <li>Performance-based pricing (CPC/CPA models)</li>
              <li>CDL Job Cast partnership for trucking roles</li>
              <li>Comprehensive analytics and reporting</li>
              <li>Multi-country job distribution</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdzunaPlatformActions;