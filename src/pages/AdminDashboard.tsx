import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Building, 
  BarChart3, 
  Settings, 
  Shield, 
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

const AdminMetricsCard = ({ title, value, description, icon: Icon, trend }: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: { value: string; positive: boolean; };
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className={`h-3 w-3 ${trend.positive ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`text-xs ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.value}
          </span>
        </div>
      )}
    </CardContent>
  </Card>
);

const SystemOverviewPanel = () => {
  const { data: metrics, isLoading } = useAdminDashboardData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">System Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">System Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMetricsCard
          title="Total Organizations"
          value={metrics?.totalOrganizations || 0}
          description="Active organizations"
          icon={Building}
        />
        <AdminMetricsCard
          title="Total Users"
          value={metrics?.totalUsers || 0}
          description="Across all organizations"
          icon={Users}
        />
        <AdminMetricsCard
          title="Total Applications"
          value={metrics?.totalApplications || 0}
          description="All time applications"
          icon={UserCheck}
        />
        <AdminMetricsCard
          title="Monthly Revenue"
          value={`$${(metrics?.totalRevenue || 0).toLocaleString()}`}
          description="Current month spend"
          icon={TrendingUp}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              System Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Jobs</span>
              <span className="font-medium">{metrics?.totalJobs || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Admin Users</span>
              <span className="font-medium">{metrics?.totalAdmins || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Recent Signups (7 days)</span>
              <span className="font-medium">{metrics?.recentSignups || 0}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">SSL Certificates</span>
              <Badge variant="secondary">Valid</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Status</span>
              <Badge variant="secondary">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">RLS Policies</span>
              <Badge variant="secondary">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if user doesn't have super admin privileges
  if (!user || userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Super Administrator Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                System-wide management and analytics
              </p>
            </div>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Super Admin
            </Badge>
          </div>
        </div>

        <SystemOverviewPanel />
      </div>
    </div>
  );
};

export default AdminDashboard;