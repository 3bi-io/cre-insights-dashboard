
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Eye, MousePointer, Target, AlertCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { useMetaSpendAnalytics } from '@/hooks/useMetaSpendAnalytics';
import { Button } from '@/components/ui/button';

interface MetaSpendMetricsProps {
  dateRange: string;
}

const MetaSpendMetrics: React.FC<MetaSpendMetricsProps> = ({ dateRange }) => {
  const { metrics, isLoading, error, refetch } = useMetaSpendAnalytics(dateRange);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Meta Spend Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-20" />
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Meta Spend Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Meta Spend Analytics
            </CardTitle>
            <CardDescription>
              AI-powered insights for CR England Meta campaigns ({dateRange.replace('_', ' ')})
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refetch}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">
              ${metrics.totalSpend.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Spend</div>
          </div>

          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <Eye className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">
              {metrics.totalImpressions.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Impressions</div>
          </div>

          <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <MousePointer className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">
              {metrics.totalClicks.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Clicks</div>
          </div>

          <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-orange-600">
              {metrics.ctr.toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">CTR</div>
          </div>

          <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold text-red-600">
              ${metrics.cpm.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">CPM</div>
          </div>

          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
            <MousePointer className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold text-yellow-600">
              ${metrics.cpc.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">CPC</div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI Performance Insights</h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {metrics.insights}
          </p>
        </div>

        {/* Recommendations */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Optimization Recommendations
          </h3>
          <div className="space-y-2">
            {metrics.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Badge variant="outline" className="text-xs">
                  {index + 1}
                </Badge>
                <span className="text-sm flex-1">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetaSpendMetrics;
