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
  TrendingUp
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
    // Simplified calculation - could be enhanced with actual closed positions data
    return Math.round((metrics.totalApplications / metrics.activeJobs) * 10); // Rough approximation
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Organization Overview</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Job Fill Rate</span>
              <Badge variant="secondary">{Math.min(calculateJobFillRate(), 100)}%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Jobs</span>
              <span className="text-sm text-muted-foreground">{metrics?.activeJobs || 0} positions</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Applications</span>
              <Badge variant="secondary">{metrics?.totalApplications || 0}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Budget Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Monthly Spend</span>
              <span className="text-sm font-medium">${(metrics?.monthlySpend || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Users</span>
              <span className="text-sm text-muted-foreground">{metrics?.activeUsers || 0} members</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Badge variant="secondary">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          {metrics?.totalApplications ? 
            `Your organization has received ${metrics.totalApplications} applications across ${metrics.activeJobs} active job positions.` :
            'Start by creating your first job listing to begin receiving applications.'
          }
        </AlertDescription>
      </Alert>
    </div>
  );
};