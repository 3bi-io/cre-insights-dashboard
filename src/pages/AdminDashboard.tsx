import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Building, 
  BarChart3, 
  Settings, 
  Shield, 
  Activity,
  TrendingUp,
  Database,
  UserCheck,
  Globe,
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useAdminDashboardData, useOrganizationsData, useUserActivityData } from '@/hooks/useAdminDashboardData';

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

const OrganizationManagementPanel = () => {
  const { data: organizations, isLoading } = useOrganizationsData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Organization Management</h3>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            New Organization
          </Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Organization Management</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Organization
        </Button>
      </div>
      
      <div className="grid gap-4">
        {organizations?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No organizations found</p>
            </CardContent>
          </Card>
        ) : (
          organizations?.map((org) => (
            <Card key={org.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{org.name}</CardTitle>
                    <CardDescription>{org.slug}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={org.subscription_status === 'active' ? 'secondary' : 'outline'}>
                      {org.subscription_status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Users</p>
                    <p className="font-medium">{org.userCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Active Jobs</p>
                    <p className="font-medium">{org.jobCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Applications</p>
                    <p className="font-medium">{org.applicationCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monthly Spend</p>
                    <p className="font-medium">${org.monthlySpend.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

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

const UserManagementPanel = () => {
  const { data: metrics, isLoading: metricsLoading } = useAdminDashboardData();
  const { data: userActivity, isLoading: activityLoading } = useUserActivityData();

  if (metricsLoading || activityLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">User Management</h3>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">User Management</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Total registered users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalAdmins || 0}</div>
            <p className="text-xs text-muted-foreground">Admin & super admin roles</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Recent Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.recentSignups || 0}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent User Activity</CardTitle>
          <CardDescription>Latest user registrations and activity</CardDescription>
        </CardHeader>
        <CardContent>
          {userActivity?.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No recent user activity</p>
          ) : (
            <div className="space-y-3">
              {userActivity?.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.organization_name} • Joined {new Date(user.last_sign_in_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'secondary' : 'outline'}>
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, userRole, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <SystemOverviewPanel />
          </TabsContent>

          <TabsContent value="organizations" className="mt-6">
            <OrganizationManagementPanel />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagementPanel />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings and parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">System configuration interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;