import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Shield, 
  Globe,
  Plus,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAdminDashboardData, useUserActivityData } from '@/hooks/useAdminDashboardData';
import { useSuperAdminUsers } from '@/hooks/useSuperAdminUsers';

const UserManagement = () => {
  const { user, userRole, loading } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useAdminDashboardData();
  const { data: userActivity, isLoading: activityLoading } = useUserActivityData();
  const { users, isLoading: usersLoading, updateUserStatus, isUpdating } = useSuperAdminUsers();

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

  if (metricsLoading || activityLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage users and roles across all organizations
            </p>
          </div>
          
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users and roles across all organizations
          </p>
        </div>
        
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
              <CardTitle>User Management</CardTitle>
              <CardDescription>Enable or disable platform users (excluding super administrators)</CardDescription>
            </CardHeader>
            <CardContent>
              {users?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No users found</p>
              ) : (
                <div className="space-y-3">
                  {users?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.email}</p>
                          {!user.enabled && (
                            <UserX className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.organization_name} • {user.full_name || 'No name'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'secondary' : 'outline'}>
                          {user.role}
                        </Badge>
                        {user.role !== 'super_admin' && (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${user.enabled ? 'text-emerald-600' : 'text-red-600'}`}>
                              {user.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <Switch
                              checked={user.enabled}
                              onCheckedChange={(enabled) => updateUserStatus({ userId: user.id, enabled })}
                              disabled={isUpdating}
                            />
                          </div>
                        )}
                        {user.role === 'super_admin' && (
                          <span className="text-xs text-muted-foreground">Super Admin</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
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
      </div>
    </div>
  );
};

export default UserManagement;