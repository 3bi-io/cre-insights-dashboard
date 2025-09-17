import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  Shield, 
  Database, 
  AlertTriangle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { useOrganizationDashboardData } from '@/hooks/useOrganizationDashboardData';

export const OrganizationOverview = () => {
  const { data: metrics, isLoading } = useOrganizationDashboardData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Organization Overview</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const calculateJobFillRate = () => {
    if (!metrics?.activeJobs || metrics.activeJobs === 0) return 0;
    return Math.round((metrics.totalApplications / metrics.activeJobs) * 10);
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return <ArrowUpRight className="w-3 h-3 text-green-500" />;
      case 'down': return <ArrowDownRight className="w-3 h-3 text-red-500" />;
      default: return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Organization Overview</h3>
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Cost per Application</span>
              <Badge variant="outline">${(metrics?.costPerApplication || 0).toFixed(2)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg Applications/Job</span>
              <Badge variant="outline">{(metrics?.averageApplicationsPerJob || 0).toFixed(1)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Cost Efficiency Score</span>
              <Badge variant={metrics?.costEfficiencyScore && metrics.costEfficiencyScore > 70 ? "default" : "secondary"}>
                {metrics?.costEfficiencyScore || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Growth Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Weekly Growth Rate</span>
              <div className={`flex items-center gap-1 ${getTrendColor(metrics?.weeklyGrowthRate && metrics.weeklyGrowthRate > 0 ? 'up' : metrics?.weeklyGrowthRate && metrics.weeklyGrowthRate < 0 ? 'down' : 'stable')}`}>
                {getTrendIcon(metrics?.weeklyGrowthRate && metrics.weeklyGrowthRate > 0 ? 'up' : metrics?.weeklyGrowthRate && metrics.weeklyGrowthRate < 0 ? 'down' : 'stable')}
                <span className="text-sm font-medium">{metrics?.weeklyGrowthRate || 0}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Job Fill Rate</span>
              <Badge variant="secondary">{Math.min(calculateJobFillRate(), 100)}%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Organization Status</span>
              <Badge variant="default">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Comparative Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>This Month vs Last Month</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Applications:</span>
                  <span className={getTrendColor(metrics?.applicationsTrend.direction || 'stable')}>
                    {metrics?.applicationsTrend.direction === 'up' ? '+' : metrics?.applicationsTrend.direction === 'down' ? '-' : ''}{metrics?.applicationsTrend.percentage || 0}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Spending:</span>
                  <span className={getTrendColor(metrics?.spendTrend.direction || 'stable')}>
                    {metrics?.spendTrend.direction === 'up' ? '+' : metrics?.spendTrend.direction === 'down' ? '-' : ''}{metrics?.spendTrend.percentage || 0}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Job Postings:</span>
                  <span className={getTrendColor(metrics?.jobsTrend.direction || 'stable')}>
                    {metrics?.jobsTrend.direction === 'up' ? '+' : metrics?.jobsTrend.direction === 'down' ? '-' : ''}{metrics?.jobsTrend.percentage || 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          {metrics?.totalApplications ? (
            <div className="space-y-1">
              <div>Your organization has received <strong>{metrics.totalApplications} applications</strong> across <strong>{metrics.activeJobs} active job positions</strong>.</div>
              <div className="text-xs">
                Cost efficiency: <strong>{metrics.costEfficiencyScore}%</strong> • 
                Avg cost per application: <strong>${(metrics.costPerApplication || 0).toFixed(2)}</strong> • 
                Monthly spend trend: <strong className={getTrendColor(metrics.spendTrend.direction)}>
                  {metrics.spendTrend.direction === 'up' ? '+' : metrics.spendTrend.direction === 'down' ? '-' : ''}{metrics.spendTrend.percentage}%
                </strong>
              </div>
            </div>
          ) : 
            'Start by creating your first job listing to begin receiving applications and tracking performance metrics.'
          }
        </AlertDescription>
      </Alert>
    </div>
  );
};