import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, AlertCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { useMetaSpendAnalytics } from '@/hooks/useMetaSpendAnalytics';
import { useCostPerLead } from '@/hooks/useCostPerLead';
import { Button } from '@/components/ui/button';
interface MetaSpendMetricsProps {
  dateRange: string;
}
const MetaSpendMetrics: React.FC<MetaSpendMetricsProps> = ({
  dateRange
}) => {
  const {
    metrics,
    isLoading,
    error,
    refetch
  } = useMetaSpendAnalytics(dateRange);
  const {
    data: costData
  } = useCostPerLead(dateRange);
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Meta Lead Generation Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-20" />
          <Skeleton className="h-32" />
        </CardContent>
      </Card>;
  }
  ;
  if (error) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Meta Lead Generation Analytics
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
      </Card>;
  }
  if (!metrics) {
    return null;
  }
  const formatNumber = (value: number) => {
    if (value === 0) return '0';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toLocaleString();
  };
  const formatCurrency = (value: number) => {
    if (value === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  const formatPercentage = (value: number) => {
    if (value === 0) return '0.00%';
    return value.toFixed(2) + '%';
  };
  return;
};
export default MetaSpendMetrics;